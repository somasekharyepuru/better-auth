import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarProviderFactory } from '../providers/calendar-provider.factory';
import { CalendarTokenService } from './calendar-token.service';
import { CreateEventInput } from '../types/calendar.types';

/**
 * Handles cross-calendar blocking for focus blocks
 * When a user creates a focus block with blockExternalCalendars=true,
 * this service pushes "busy" events to all connected external calendars
 */
@Injectable()
export class ExternalBlockingService {
    private readonly logger = new Logger(ExternalBlockingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerFactory: CalendarProviderFactory,
        private readonly tokenService: CalendarTokenService,
    ) { }

    /**
     * Create blocking events on all writable external calendars
     * for a given time block
     */
    async createBlockingEvents(
        userId: string,
        timeBlockId: string,
        title: string,
        startTime: Date,
        endTime: Date,
    ): Promise<{ success: boolean; blockedCalendars: string[]; errors: string[] }> {
        const blockedCalendars: string[] = [];
        const errors: string[] = [];

        // Get all writable calendar sources for this user
        const sources = await this.prisma.calendarSource.findMany({
            where: {
                connection: {
                    userId,
                    enabled: true,
                    status: 'ACTIVE',
                },
                syncEnabled: true,
                syncDirection: {
                    in: ['BIDIRECTIONAL', 'WRITE_ONLY'],
                },
            },
            include: {
                connection: {
                    select: {
                        id: true,
                        provider: true,
                        providerEmail: true,
                    },
                },
            },
        });

        // Create a "busy" event on each writable source
        for (const source of sources) {
            try {
                const accessToken = await this.tokenService.getValidToken(source.connection.id);
                const provider = this.providerFactory.getProvider(source.connection.provider);

                const eventInput: CreateEventInput = {
                    title: `[Focus] ${title}`,
                    description: 'Focus time blocked by Daymark - please do not schedule during this time',
                    startTime,
                    endTime,
                    isAllDay: false,
                };

                const createdEvent = await provider.createEvent(
                    accessToken,
                    source.externalCalendarId,
                    eventInput,
                );

                // Create an event mapping to track the blocking event
                await this.prisma.eventMapping.create({
                    data: {
                        calendarSourceId: source.id,
                        externalEventId: createdEvent.id,
                        externalEtag: createdEvent.etag,
                        externalUpdatedAt: createdEvent.updatedAt,
                        timeBlockId,
                        syncStatus: 'SYNCED',
                        isBlockingEvent: true,
                        lastKnownTitle: `[Focus] ${title}`,
                        lastKnownStart: startTime,
                        lastKnownEnd: endTime,
                        lastSyncAt: new Date(),
                        lastSyncDirection: 'outbound',
                    },
                });

                blockedCalendars.push(source.name);
                this.logger.log(`Created blocking event on ${source.name} for time block ${timeBlockId}`);
            } catch (error) {
                this.logger.error(`Failed to create blocking event on ${source.name}: ${error}`);
                errors.push(`${source.name}: ${String(error)}`);
            }
        }

        return {
            success: errors.length === 0,
            blockedCalendars,
            errors,
        };
    }

    /**
     * Remove blocking events when a time block is deleted or
     * when blockExternalCalendars is set to false
     */
    async removeBlockingEvents(timeBlockId: string): Promise<void> {
        // Find all blocking event mappings for this time block
        const blockingMappings = await this.prisma.eventMapping.findMany({
            where: {
                timeBlockId,
                isBlockingEvent: true,
            },
            include: {
                calendarSource: {
                    include: {
                        connection: true,
                    },
                },
            },
        });

        for (const mapping of blockingMappings) {
            try {
                if (!mapping.calendarSource || !mapping.externalEventId) continue;

                const source = mapping.calendarSource;
                const accessToken = await this.tokenService.getValidToken(source.connection.id);
                const provider = this.providerFactory.getProvider(source.connection.provider);

                await provider.deleteEvent(
                    accessToken,
                    source.externalCalendarId,
                    mapping.externalEventId,
                );

                this.logger.log(`Removed blocking event from ${source.name} for time block ${timeBlockId}`);
            } catch (error) {
                this.logger.error(`Failed to remove blocking event: ${error}`);
            }

            // Delete the mapping regardless of external deletion success
            await this.prisma.eventMapping.delete({
                where: { id: mapping.id },
            });
        }
    }

    /**
     * Update blocking events when a time block's time changes
     */
    async updateBlockingEvents(
        timeBlockId: string,
        title: string,
        startTime: Date,
        endTime: Date,
    ): Promise<void> {
        // Find all blocking event mappings for this time block
        const blockingMappings = await this.prisma.eventMapping.findMany({
            where: {
                timeBlockId,
                isBlockingEvent: true,
            },
            include: {
                calendarSource: {
                    include: {
                        connection: true,
                    },
                },
            },
        });

        for (const mapping of blockingMappings) {
            try {
                if (!mapping.calendarSource || !mapping.externalEventId) continue;

                const source = mapping.calendarSource;
                const accessToken = await this.tokenService.getValidToken(source.connection.id);
                const provider = this.providerFactory.getProvider(source.connection.provider);

                const updatedEvent = await provider.updateEvent(
                    accessToken,
                    source.externalCalendarId,
                    {
                        id: mapping.externalEventId,
                        title: `[Focus] ${title}`,
                        description: 'Focus time blocked by Daymark - please do not schedule during this time',
                        startTime,
                        endTime,
                        isAllDay: false,
                    },
                );

                await this.prisma.eventMapping.update({
                    where: { id: mapping.id },
                    data: {
                        externalEtag: updatedEvent.etag,
                        externalUpdatedAt: updatedEvent.updatedAt,
                        lastKnownTitle: `[Focus] ${title}`,
                        lastKnownStart: startTime,
                        lastKnownEnd: endTime,
                        syncStatus: 'SYNCED',
                        lastSyncAt: new Date(),
                        lastSyncDirection: 'outbound',
                        syncError: null,
                    },
                });

                this.logger.log(`Updated blocking event on ${source.name} for time block ${timeBlockId}`);
            } catch (error) {
                this.logger.error(`Failed to update blocking event: ${error}`);
                await this.prisma.eventMapping.update({
                    where: { id: mapping.id },
                    data: {
                        syncStatus: 'ERROR',
                        syncError: String(error),
                    },
                });
            }
        }
    }

    /**
     * Get all blocking events for a user in a date range
     * Used in the UI to show which blocks are currently being pushed to external calendars
     */
    async getBlockingEventStatus(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<{
        timeBlockId: string;
        blockedCalendars: { name: string; provider: string; synced: boolean }[];
    }[]> {
        const timeBlocks = await this.prisma.timeBlock.findMany({
            where: {
                day: { userId },
                blockExternalCalendars: true,
                category: { in: ['focus', 'deep-work'] },
                startTime: { gte: startDate },
                endTime: { lte: endDate },
            },
            select: { id: true },
        });

        const results: {
            timeBlockId: string;
            blockedCalendars: { name: string; provider: string; synced: boolean }[];
        }[] = [];

        for (const tb of timeBlocks) {
            const mappings = await this.prisma.eventMapping.findMany({
                where: {
                    timeBlockId: tb.id,
                    isBlockingEvent: true,
                },
                include: {
                    calendarSource: {
                        include: {
                            connection: {
                                select: { provider: true },
                            },
                        },
                    },
                },
            });

            results.push({
                timeBlockId: tb.id,
                blockedCalendars: mappings.map(m => ({
                    name: m.calendarSource?.name || 'Unknown',
                    provider: String(m.calendarSource?.connection.provider || 'UNKNOWN'),
                    synced: m.syncStatus === 'SYNCED',
                })),
            });
        }

        return results;
    }
}
