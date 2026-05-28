import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('boards/:boardId/activity-logs')
  async getBoardLogs(
    @Param('boardId') boardId: string,
    @CurrentUser() user: any,
  ) {
    return this.activityLogsService.getBoardLogs(boardId, user.userId);
  }

  @Get('tasks/:taskId/activity-logs')
  async getTaskLogs(
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.activityLogsService.getTaskLogs(taskId, user.userId);
  }
}
