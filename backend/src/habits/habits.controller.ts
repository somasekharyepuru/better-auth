import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  HabitsService,
  CreateHabitDto,
  UpdateHabitDto,
  LogHabitDto,
} from './habits.service';
import { Request } from 'express';

@Controller('api/habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  private getUserId(req: Request): string {
    const userId = (req as any).userId;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return userId;
  }

  // GET /api/habits — list habits with streaks (?includeInactive=true for paused habits)
  @Get()
  getAllHabits(
    @Req() req: Request,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.habitsService.getAllHabits(
      this.getUserId(req),
      includeInactive === 'true',
    );
  }

  // GET /api/habits/today — habits due today + completedToday / completedForDate
  @Get('today')
  getTodayHabits(@Req() req: Request) {
    return this.habitsService.getTodayHabits(this.getUserId(req));
  }

  // GET /api/habits/day/:date — habits due on that day (YYYY-MM-DD), for dashboard / historical
  @Get('day/:date')
  getHabitsForDay(@Param('date') date: string, @Req() req: Request) {
    return this.habitsService.getHabitsForDate(this.getUserId(req), date);
  }

  // POST /api/habits — create a new habit
  @Post()
  createHabit(@Body() body: CreateHabitDto, @Req() req: Request) {
    return this.habitsService.createHabit(this.getUserId(req), body);
  }

  // PATCH /api/habits/:id — update habit definition
  @Patch(':id')
  updateHabit(
    @Param('id') id: string,
    @Body() body: UpdateHabitDto,
    @Req() req: Request,
  ) {
    return this.habitsService.updateHabit(id, this.getUserId(req), body);
  }

  // DELETE /api/habits/:id — hard delete
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHabit(@Param('id') id: string, @Req() req: Request) {
    return this.habitsService.deleteHabit(id, this.getUserId(req));
  }

  // PATCH /api/habits/:id/archive — soft archive
  @Patch(':id/archive')
  archiveHabit(@Param('id') id: string, @Req() req: Request) {
    return this.habitsService.archiveHabit(id, this.getUserId(req));
  }

  // POST /api/habits/:id/log — check-in for a date
  @Post(':id/log')
  logHabit(
    @Param('id') id: string,
    @Body() body: LogHabitDto,
    @Req() req: Request,
  ) {
    return this.habitsService.logHabit(id, this.getUserId(req), body);
  }

  // DELETE /api/habits/:id/log/:date — undo check-in
  @Delete(':id/log/:date')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlogHabit(
    @Param('id') id: string,
    @Param('date') date: string,
    @Req() req: Request,
  ) {
    return this.habitsService.unlogHabit(id, this.getUserId(req), date);
  }

  // GET /api/habits/:id/logs — log history + streak stats
  @Get(':id/logs')
  getHabitLogs(
    @Param('id') id: string,
    @Query('days') days: string,
    @Req() req: Request,
  ) {
    return this.habitsService.getHabitLogs(
      id,
      this.getUserId(req),
      days ? parseInt(days, 10) : 90,
    );
  }
}
