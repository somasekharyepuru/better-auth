import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    private getUserId(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Get('priorities/completion')
    getPriorityCompletionReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
    ) {
        return this.reportsService.getPriorityCompletionReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
        });
    }

    @Get('habits/completion')
    getHabitCompletionReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        return this.reportsService.getHabitCompletionReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
            activeOnly: activeOnly !== 'false',
        });
    }

    @Get('habits/streaks')
    getHabitStreaksReport(
        @Req() req: Request,
        @Query('lifeAreaId') lifeAreaId?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        return this.reportsService.getHabitStreaksReport(this.getUserId(req), {
            lifeAreaId,
            activeOnly: activeOnly !== 'false',
        });
    }

    @Get('habits/consistency')
    getHabitConsistencyReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        return this.reportsService.getHabitConsistencyReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
            activeOnly: activeOnly !== 'false',
        });
    }

    @Get('habits/by-life-area')
    getHabitsByLifeAreaReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        return this.reportsService.getHabitsByLifeAreaReport(this.getUserId(req), {
            from,
            to,
            activeOnly: activeOnly !== 'false',
        });
    }

    @Get('habits/failure-patterns')
    getHabitFailurePatternsReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('habitId') habitId?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        return this.reportsService.getHabitFailurePatternsReport(this.getUserId(req), {
            from,
            to,
            habitId,
            lifeAreaId,
            activeOnly: activeOnly !== 'false',
        });
    }

    @Get('focus-sessions/completion')
    getFocusSessionCompletionReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('sessionType') sessionType?: string,
    ) {
        return this.reportsService.getFocusSessionCompletionReport(this.getUserId(req), {
            from,
            to,
            sessionType,
        });
    }

    @Get('focus-sessions/deep-work')
    getTotalDeepWorkTimeReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getTotalDeepWorkTimeReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('focus-sessions/interruptions')
    getInterruptionFrequencyReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getInterruptionFrequencyReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('focus-sessions/best-times')
    getBestFocusTimesReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getBestFocusTimesReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('focus-sessions/trends')
    getFocusTrendsReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getFocusTrendsReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('time-blocks/hours')
    getFocusHoursReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('category') category?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
        @Query('type') type?: string,
    ) {
        return this.reportsService.getFocusHoursReport(this.getUserId(req), {
            from,
            to,
            category,
            lifeAreaId,
            type,
        });
    }

    @Get('time-blocks/categories')
    getTimeBlockCategoryBreakdown(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
        @Query('type') type?: string,
    ) {
        return this.reportsService.getTimeBlockCategoryBreakdown(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
            type,
        });
    }

    @Get('time-blocks/types')
    getTimeBlockTypeDistribution(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
    ) {
        return this.reportsService.getTimeBlockTypeDistribution(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
        });
    }

    @Get('time-blocks/calendar-vs-manual')
    getCalendarVsManualBlocksReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
    ) {
        return this.reportsService.getCalendarVsManualBlocksReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
        });
    }

    @Get('time-blocks/density')
    getScheduleDensityReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getScheduleDensityReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('life-areas/time-distribution')
    getTimeDistributionByLifeAreaReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getTimeDistributionByLifeAreaReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('priorities/carried-forward')
    getCarriedForwardReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('minCarryCount') minCarryCount?: string,
    ) {
        return this.reportsService.getCarriedForwardReport(this.getUserId(req), {
            from,
            to,
            minCarryCount,
        });
    }

    @Get('priorities/throughput')
    getPriorityThroughputReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
    ) {
        return this.reportsService.getPriorityThroughputReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
        });
    }

    @Get('daily-review/trends')
    getDailyReviewTrendsReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getDailyReviewTrendsReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('daily-review/days-without')
    getDaysWithoutReviewReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getDaysWithoutReviewReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('life-areas/balance-score')
    getLifeAreaBalanceScoreReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getLifeAreaBalanceScoreReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('life-areas/priority-focus')
    getPriorityFocusByLifeAreaReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getPriorityFocusByLifeAreaReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('life-areas/eisenhower-by-area')
    getEisenhowerByLifeAreaReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getEisenhowerByLifeAreaReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('eisenhower/quadrant-distribution')
    getEisenhowerQuadrantDistributionReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
    ) {
        return this.reportsService.getEisenhowerQuadrantDistributionReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
        });
    }

    @Get('eisenhower/promotion-rate')
    getEisenhowerPromotionRateReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getEisenhowerPromotionRateReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('eisenhower/task-aging')
    getEisenhowerTaskAgingReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getEisenhowerTaskAgingReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('eisenhower/q1-q2-ratio-trend')
    getEisenhowerQ1Q2RatioTrendReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getEisenhowerQ1Q2RatioTrendReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('decisions/volume')
    getDecisionVolumeReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('lifeAreaId') lifeAreaId?: string,
    ) {
        return this.reportsService.getDecisionVolumeReport(this.getUserId(req), {
            from,
            to,
            lifeAreaId,
        });
    }

    @Get('decisions/outcome-tracking')
    getDecisionOutcomeTrackingReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getDecisionOutcomeTrackingReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('decisions/by-life-area')
    getDecisionByLifeAreaReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getDecisionByLifeAreaReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('decisions/focus-time')
    getFocusTimePerDecisionReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getFocusTimePerDecisionReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('calendar-sync/health')
    getCalendarSyncHealthReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getCalendarSyncHealthReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('calendar-sync/conflicts')
    getCalendarConflictStatsReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getCalendarConflictStatsReport(this.getUserId(req), {
            from,
            to,
        });
    }

    @Get('summary/weekly')
    getWeeklyReviewReport(@Req() req: Request, @Query('date') date?: string) {
        return this.reportsService.getWeeklyReviewReport(this.getUserId(req), { date });
    }

    @Get('summary/monthly-score')
    getMonthlyProductivityScoreReport(@Req() req: Request, @Query('date') date?: string) {
        return this.reportsService.getMonthlyProductivityScoreReport(this.getUserId(req), {
            date,
        });
    }

    @Get('summary/streak-dashboard')
    getStreakDashboardReport(@Req() req: Request) {
        return this.reportsService.getStreakDashboardReport(this.getUserId(req));
    }

    @Get('summary/goal-velocity')
    getGoalVelocityReport(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.reportsService.getGoalVelocityReport(this.getUserId(req), { from, to });
    }
}
