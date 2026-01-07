import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CalendarProvider, EventSyncStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarProviderFactory } from '../providers/calendar-provider.factory';
import { CalendarTokenService } from './calendar-token.service';
// CalendarSyncService import removed - add back when needed for sync operations
import { CreateEventInput } from '../types/calendar.types';

export interface CalendarEventResponse {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    type: string;

    // Source info
    sourceId: string;
    sourceName: string;
    sourceColor: string | null;
    provider: CalendarProvider;
    providerEmail: string | null;

    // Sync info
    externalEventId?: string | null;
    isFromCalendar: boolean;
    syncStatus?: EventSyncStatus;

    // Recurrence
    recurringEventId?: string | null;
    isRecurring: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface CreateCalendarEventInput {
    sourceId: string;
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    isAllDay?: boolean;
    type?: string;
}

export interface UpdateCalendarEventInput {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
    type?: string;
}

export interface WritableCalendarSource {
    id: string;
    name: string;
    color: string | null;
    provider: CalendarProvider;
    providerEmail: string | null;
    isPrimary: boolean;
    connectionId: string;
}

@Injectable()
export class CalendarEventsService {
    private readonly logger = new Logger(CalendarEventsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerFactory: CalendarProviderFactory,
        private readonly tokenService: CalendarTokenService,
    ) { }

    /**
     * Get all writable calendar sources for a user
     * Used for the "select calendar" dropdown when creating events
     */
    async getWritableSources(userId: string): Promise<WritableCalendarSource[]> {
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
            orderBy: [
                { isPrimary: 'desc' },
                { name: 'asc' },
            ],
        });

        return sources.map((source) => ({
            id: source.id,
            name: source.name,
            color: source.color,
            provider: source.connection.provider,
            providerEmail: source.connection.providerEmail,
            isPrimary: source.isPrimary,
            connectionId: source.connection.id,
        }));
    }

    /**
     * Get aggregated events from all connected calendars within a date range
     */
    async getEvents(
        userId: string,
        startDate: Date,
        endDate: Date,
        sourceIds?: string[],
    ): Promise<CalendarEventResponse[]> {
        // Build the where clause for TimeBlocks
        const whereClause: Record<string, unknown> = {
            day: {
                userId,
            },
            startTime: {
                gte: startDate,
            },
            endTime: {
                lte: endDate,
            },
        };

        // If specific sources requested, filter to those
        if (sourceIds && sourceIds.length > 0) {
            whereClause.OR = [
                { calendarSourceId: { in: sourceIds } },
                { isFromCalendar: false, calendarSourceId: null }, // Include local time blocks too
            ];
        }

        const timeBlocks = await this.prisma.timeBlock.findMany({
            where: whereClause,
            include: {
                day: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        // Get event mappings for synced events
        const timeBlockIds = timeBlocks.map((tb) => tb.id);
        const eventMappings = await this.prisma.eventMapping.findMany({
            where: {
                timeBlockId: { in: timeBlockIds },
            },
            include: {
                calendarSource: {
                    include: {
                        connection: {
                            select: {
                                provider: true,
                                providerEmail: true,
                            },
                        },
                    },
                },
            },
        });

        const mappingByTimeBlockId = new Map(
            eventMappings.map((m) => [m.timeBlockId, m]),
        );

        // Build the response
        const events: CalendarEventResponse[] = [];

        for (const tb of timeBlocks) {
            const mapping = mappingByTimeBlockId.get(tb.id);
            const source = mapping?.calendarSource;

            events.push({
                id: tb.id,
                title: tb.title,
                description: null, // Could be extended to store description
                location: null, // Could be extended to store location
                startTime: tb.startTime.toISOString(),
                endTime: tb.endTime.toISOString(),
                isAllDay: false, // Could be derived from times
                type: tb.type,

                sourceId: source?.id || '',
                sourceName: source?.name || 'Local',
                sourceColor: source?.color || null,
                provider: source?.connection.provider || 'GOOGLE',
                providerEmail: source?.connection.providerEmail || null,

                externalEventId: tb.externalEventId,
                isFromCalendar: tb.isFromCalendar,
                syncStatus: mapping?.syncStatus,

                recurringEventId: null, // Will be set for recurring events
                isRecurring: false,

                createdAt: tb.createdAt.toISOString(),
                updatedAt: tb.updatedAt.toISOString(),
            });
        }

        return events;
    }

    /**
     * Create a new event and sync it to the selected calendar
     */
    async createEvent(
        userId: string,
        input: CreateCalendarEventInput,
    ): Promise<CalendarEventResponse> {
        // Validate the source belongs to the user and is writable
        const source = await this.prisma.calendarSource.findUnique({
            where: { id: input.sourceId },
            include: {
                connection: {
                    select: {
                        id: true,
                        userId: true,
                        provider: true,
                        providerEmail: true,
                        status: true,
                    },
                },
            },
        });

        if (!source) {
            throw new NotFoundException('Calendar source not found');
        }

        if (source.connection.userId !== userId) {
            throw new ForbiddenException('Access denied to this calendar source');
        }

        if (!['BIDIRECTIONAL', 'WRITE_ONLY'].includes(source.syncDirection)) {
            throw new ForbiddenException('This calendar is read-only');
        }

        const startTime = new Date(input.startTime);
        const endTime = new Date(input.endTime);

        // Get or create the Day for this event
        const day = await this.getOrCreateDay(userId, startTime);

        // Create the TimeBlock first
        const timeBlock = await this.prisma.timeBlock.create({
            data: {
                title: input.title,
                startTime,
                endTime,
                type: input.type || source.defaultEventType || 'Meeting',
                dayId: day.id,
                isFromCalendar: true,
                calendarSourceId: source.id,
            },
        });

        // Sync to the external calendar
        try {
            const accessToken = await this.tokenService.getValidToken(source.connection.id);
            const provider = this.providerFactory.getProvider(source.connection.provider);

            const eventInput: CreateEventInput = {
                title: input.title,
                description: input.description,
                location: input.location,
                startTime,
                endTime,
                isAllDay: input.isAllDay,
            };

            const createdEvent = await provider.createEvent(
                accessToken,
                source.externalCalendarId,
                eventInput,
            );

            // Update the TimeBlock with external event ID
            await this.prisma.timeBlock.update({
                where: { id: timeBlock.id },
                data: {
                    externalEventId: createdEvent.id,
                },
            });

            // Create the EventMapping
            await this.prisma.eventMapping.create({
                data: {
                    calendarSourceId: source.id,
                    externalEventId: createdEvent.id,
                    externalEtag: createdEvent.etag,
                    externalUpdatedAt: createdEvent.updatedAt,
                    timeBlockId: timeBlock.id,
                    syncStatus: 'SYNCED',
                    lastKnownTitle: input.title,
                    lastKnownStart: startTime,
                    lastKnownEnd: endTime,
                    lastSyncAt: new Date(),
                    lastSyncDirection: 'outbound',
                },
            });

            this.logger.log(`Created event ${createdEvent.id} in ${source.connection.provider}`);
        } catch (error) {
            this.logger.error(`Failed to sync event to external calendar: ${error}`);
            // Create mapping with PENDING status
            await this.prisma.eventMapping.create({
                data: {
                    calendarSourceId: source.id,
                    externalEventId: '',
                    timeBlockId: timeBlock.id,
                    syncStatus: 'PENDING_OUTBOUND',
                    lastKnownTitle: input.title,
                    lastKnownStart: startTime,
                    lastKnownEnd: endTime,
                    syncError: String(error),
                },
            });
        }

        return {
            id: timeBlock.id,
            title: input.title,
            description: input.description || null,
            location: input.location || null,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: input.isAllDay || false,
            type: input.type || source.defaultEventType || 'Meeting',
            sourceId: source.id,
            sourceName: source.name,
            sourceColor: source.color,
            provider: source.connection.provider,
            providerEmail: source.connection.providerEmail,
            externalEventId: null,
            isFromCalendar: true,
            syncStatus: 'SYNCED',
            recurringEventId: null,
            isRecurring: false,
            createdAt: timeBlock.createdAt.toISOString(),
            updatedAt: timeBlock.updatedAt.toISOString(),
        };
    }

    /**
     * Update an existing event and sync changes
     */
    async updateEvent(
        userId: string,
        eventId: string,
        input: UpdateCalendarEventInput,
    ): Promise<CalendarEventResponse> {
        // Get the TimeBlock with its mapping
        const timeBlock = await this.prisma.timeBlock.findUnique({
            where: { id: eventId },
            include: {
                day: true,
            },
        });

        if (!timeBlock) {
            throw new NotFoundException('Event not found');
        }

        if (timeBlock.day.userId !== userId) {
            throw new ForbiddenException('Access denied to this event');
        }

        // Get the event mapping if exists
        const mapping = await this.prisma.eventMapping.findFirst({
            where: { timeBlockId: eventId },
            include: {
                calendarSource: {
                    include: {
                        connection: {
                            select: {
                                id: true,
                                provider: true,
                                providerEmail: true,
                            },
                        },
                    },
                },
            },
        });

        const startTime = input.startTime ? new Date(input.startTime) : timeBlock.startTime;
        const endTime = input.endTime ? new Date(input.endTime) : timeBlock.endTime;

        // If the date changed, we need to update the Day association
        let dayId = timeBlock.dayId;
        const currentDayDate = timeBlock.day.date;
        const newDayDate = new Date(startTime);
        newDayDate.setHours(0, 0, 0, 0);

        if (currentDayDate.getTime() !== newDayDate.getTime()) {
            const newDay = await this.getOrCreateDay(userId, startTime);
            dayId = newDay.id;
        }

        // Update the TimeBlock
        const updatedTimeBlock = await this.prisma.timeBlock.update({
            where: { id: eventId },
            data: {
                title: input.title ?? timeBlock.title,
                startTime,
                endTime,
                type: input.type ?? timeBlock.type,
                dayId,
            },
        });

        // Sync to external calendar if this is a synced event
        if (mapping && mapping.externalEventId && mapping.calendarSource) {
            const source = mapping.calendarSource;

            if (['BIDIRECTIONAL', 'WRITE_ONLY'].includes(source.syncDirection)) {
                try {
                    const accessToken = await this.tokenService.getValidToken(source.connection.id);
                    const provider = this.providerFactory.getProvider(source.connection.provider);

                    const updatedEvent = await provider.updateEvent(
                        accessToken,
                        source.externalCalendarId,
                        {
                            id: mapping.externalEventId,
                            title: updatedTimeBlock.title,
                            description: input.description,
                            location: input.location,
                            startTime,
                            endTime,
                            isAllDay: input.isAllDay,
                        },
                    );

                    await this.prisma.eventMapping.update({
                        where: { id: mapping.id },
                        data: {
                            externalEtag: updatedEvent.etag,
                            externalUpdatedAt: updatedEvent.updatedAt,
                            lastKnownTitle: updatedTimeBlock.title,
                            lastKnownStart: startTime,
                            lastKnownEnd: endTime,
                            syncStatus: 'SYNCED',
                            lastSyncAt: new Date(),
                            lastSyncDirection: 'outbound',
                            syncError: null,
                        },
                    });

                    this.logger.log(`Updated event ${mapping.externalEventId} in ${source.connection.provider}`);
                } catch (error) {
                    this.logger.error(`Failed to sync event update: ${error}`);
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

        return {
            id: updatedTimeBlock.id,
            title: updatedTimeBlock.title,
            description: input.description || null,
            location: input.location || null,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: input.isAllDay || false,
            type: updatedTimeBlock.type,
            sourceId: mapping?.calendarSource?.id || '',
            sourceName: mapping?.calendarSource?.name || 'Local',
            sourceColor: mapping?.calendarSource?.color || null,
            provider: mapping?.calendarSource?.connection.provider || 'GOOGLE',
            providerEmail: mapping?.calendarSource?.connection.providerEmail || null,
            externalEventId: mapping?.externalEventId || null,
            isFromCalendar: updatedTimeBlock.isFromCalendar,
            syncStatus: mapping?.syncStatus || 'SYNCED',
            recurringEventId: null,
            isRecurring: false,
            createdAt: updatedTimeBlock.createdAt.toISOString(),
            updatedAt: updatedTimeBlock.updatedAt.toISOString(),
        };
    }

    /**
     * Delete an event and sync the deletion
     */
    async deleteEvent(userId: string, eventId: string): Promise<void> {
        const timeBlock = await this.prisma.timeBlock.findUnique({
            where: { id: eventId },
            include: {
                day: true,
            },
        });

        if (!timeBlock) {
            throw new NotFoundException('Event not found');
        }

        if (timeBlock.day.userId !== userId) {
            throw new ForbiddenException('Access denied to this event');
        }

        // Get the event mapping
        const mapping = await this.prisma.eventMapping.findFirst({
            where: { timeBlockId: eventId },
            include: {
                calendarSource: {
                    include: {
                        connection: true,
                    },
                },
            },
        });

        // Delete from external calendar if synced
        if (mapping && mapping.externalEventId && mapping.calendarSource) {
            const source = mapping.calendarSource;

            if (['BIDIRECTIONAL', 'WRITE_ONLY'].includes(source.syncDirection)) {
                try {
                    const accessToken = await this.tokenService.getValidToken(source.connection.id);
                    const provider = this.providerFactory.getProvider(source.connection.provider);

                    await provider.deleteEvent(
                        accessToken,
                        source.externalCalendarId,
                        mapping.externalEventId,
                    );

                    this.logger.log(`Deleted event ${mapping.externalEventId} from ${source.connection.provider}`);
                } catch (error) {
                    this.logger.error(`Failed to delete event from external calendar: ${error}`);
                    // Continue with local deletion anyway
                }
            }

            // Delete the mapping
            await this.prisma.eventMapping.delete({
                where: { id: mapping.id },
            });
        }

        // Delete the TimeBlock
        await this.prisma.timeBlock.delete({
            where: { id: eventId },
        });

        this.logger.log(`Deleted event ${eventId}`);
    }

    /**
     * Get a single event by ID
     */
    async getEvent(userId: string, eventId: string): Promise<CalendarEventResponse> {
        const timeBlock = await this.prisma.timeBlock.findUnique({
            where: { id: eventId },
            include: {
                day: true,
            },
        });

        if (!timeBlock) {
            throw new NotFoundException('Event not found');
        }

        if (timeBlock.day.userId !== userId) {
            throw new ForbiddenException('Access denied to this event');
        }

        const mapping = await this.prisma.eventMapping.findFirst({
            where: { timeBlockId: eventId },
            include: {
                calendarSource: {
                    include: {
                        connection: {
                            select: {
                                provider: true,
                                providerEmail: true,
                            },
                        },
                    },
                },
            },
        });

        const source = mapping?.calendarSource;

        return {
            id: timeBlock.id,
            title: timeBlock.title,
            description: null,
            location: null,
            startTime: timeBlock.startTime.toISOString(),
            endTime: timeBlock.endTime.toISOString(),
            isAllDay: false,
            type: timeBlock.type,
            sourceId: source?.id || '',
            sourceName: source?.name || 'Local',
            sourceColor: source?.color || null,
            provider: source?.connection.provider || 'GOOGLE',
            providerEmail: source?.connection.providerEmail || null,
            externalEventId: timeBlock.externalEventId,
            isFromCalendar: timeBlock.isFromCalendar,
            syncStatus: mapping?.syncStatus,
            recurringEventId: null,
            isRecurring: false,
            createdAt: timeBlock.createdAt.toISOString(),
            updatedAt: timeBlock.updatedAt.toISOString(),
        };
    }

    private async getOrCreateDay(userId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        let day = await this.prisma.day.findFirst({
            where: {
                userId,
                date: startOfDay,
                lifeAreaId: null,
            },
        });

        if (!day) {
            day = await this.prisma.day.create({
                data: {
                    userId,
                    date: startOfDay,
                    lifeAreaId: null,
                },
            });
        }

        return day;
    }

    /**
     * Get busy time slots from ALL connected calendars
     * Used for cross-calendar blocking visualization
     */
    async getBusyTimes(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<BusyTimeSlot[]> {
        const timeBlocks = await this.prisma.timeBlock.findMany({
            where: {
                day: { userId },
                OR: [
                    {
                        startTime: { gte: startDate, lt: endDate },
                    },
                    {
                        endTime: { gt: startDate, lte: endDate },
                    },
                    {
                        startTime: { lte: startDate },
                        endTime: { gte: endDate },
                    },
                ],
            },
            include: {
                day: true,
            },
            orderBy: { startTime: 'asc' },
        });

        const timeBlockIds = timeBlocks.map((tb) => tb.id);
        const eventMappings = await this.prisma.eventMapping.findMany({
            where: { timeBlockId: { in: timeBlockIds } },
            include: {
                calendarSource: {
                    include: {
                        connection: {
                            select: {
                                provider: true,
                                providerEmail: true,
                            },
                        },
                    },
                },
            },
        });

        const mappingByTimeBlockId = new Map(
            eventMappings.map((m) => [m.timeBlockId, m]),
        );

        return timeBlocks.map((tb) => {
            const mapping = mappingByTimeBlockId.get(tb.id);
            const source = mapping?.calendarSource;

            return {
                id: tb.id,
                title: tb.title,
                startTime: tb.startTime.toISOString(),
                endTime: tb.endTime.toISOString(),
                sourceId: source?.id || null,
                sourceName: source?.name || 'Local',
                sourceColor: source?.color || '#6B7280',
                provider: source?.connection.provider || null,
                providerEmail: source?.connection.providerEmail || null,
            };
        });
    }

    /**
     * Check if a proposed time range conflicts with existing events
     * Returns all conflicting events from any calendar source
     */
    async checkConflicts(
        userId: string,
        startTime: Date,
        endTime: Date,
        excludeEventId?: string,
    ): Promise<ConflictCheckResult> {
        const conflicts = await this.prisma.timeBlock.findMany({
            where: {
                day: { userId },
                id: excludeEventId ? { not: excludeEventId } : undefined,
                OR: [
                    {
                        startTime: { lt: endTime },
                        endTime: { gt: startTime },
                    },
                ],
            },
            include: {
                day: true,
            },
            orderBy: { startTime: 'asc' },
        });

        if (conflicts.length === 0) {
            return { hasConflicts: false, conflicts: [] };
        }

        const timeBlockIds = conflicts.map((tb) => tb.id);
        const eventMappings = await this.prisma.eventMapping.findMany({
            where: { timeBlockId: { in: timeBlockIds } },
            include: {
                calendarSource: {
                    include: {
                        connection: {
                            select: {
                                provider: true,
                                providerEmail: true,
                            },
                        },
                    },
                },
            },
        });

        const mappingByTimeBlockId = new Map(
            eventMappings.map((m) => [m.timeBlockId, m]),
        );

        const conflictDetails: ConflictingEvent[] = conflicts.map((tb) => {
            const mapping = mappingByTimeBlockId.get(tb.id);
            const source = mapping?.calendarSource;

            return {
                id: tb.id,
                title: tb.title,
                startTime: tb.startTime.toISOString(),
                endTime: tb.endTime.toISOString(),
                sourceId: source?.id || null,
                sourceName: source?.name || 'Local',
                sourceColor: source?.color || '#6B7280',
                provider: source?.connection.provider || null,
                providerEmail: source?.connection.providerEmail || null,
            };
        });

        return {
            hasConflicts: true,
            conflicts: conflictDetails,
        };
    }
}

export interface BusyTimeSlot {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    sourceId: string | null;
    sourceName: string;
    sourceColor: string;
    provider: CalendarProvider | null;
    providerEmail: string | null;
}

export interface ConflictingEvent {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    sourceId: string | null;
    sourceName: string;
    sourceColor: string;
    provider: CalendarProvider | null;
    providerEmail: string | null;
}

export interface ConflictCheckResult {
    hasConflicts: boolean;
    conflicts: ConflictingEvent[];
}
