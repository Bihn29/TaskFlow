import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getMyNotifications(user.userId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationsService.markAllAsRead(user.userId);
    return { success: true, message: 'Đã đánh dấu đọc tất cả thông báo thành công' };
  }

  @Patch(':notificationId/read')
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(notificationId, user.userId);
  }
}
