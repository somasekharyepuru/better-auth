import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';

@Injectable()
export class QuickNotesService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
    ) { }

    /**
     * Create or update quick note (upsert - one note per day)
     */
    async upsertQuickNote(userId: string, dateStr: string, content: string) {
        const day = await this.daysService.getOrCreateDay(userId, dateStr);

        return this.prisma.quickNote.upsert({
            where: { dayId: day.id },
            update: { content },
            create: {
                content,
                dayId: day.id,
            },
        });
    }
}
