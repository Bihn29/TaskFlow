import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private realtimeService: RealtimeService,
  ) {}

  /**
   * Create a new notification and emit it in real-time to the recipient's user room
   */
  async createNotification(
    userId: string,
    type: string,
    message: string,
    taskId?: string,
    boardId?: string,
    workspaceId?: string,
  ): Promise<NotificationDocument> {
    const newNotification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      type,
      message,
      taskId: taskId ? new Types.ObjectId(taskId) : undefined,
      boardId: boardId ? new Types.ObjectId(boardId) : undefined,
      workspaceId: workspaceId ? new Types.ObjectId(workspaceId) : undefined,
      isRead: false,
    });

    const saved = await newNotification.save();
    
    // Emit in real-time to the specific user's private channel
    this.realtimeService.emitToUser(userId, 'notification_created', saved);

    return saved;
  }

  /**
   * Fetch all notifications for a specific user, sorted by descending date
   */
  async getMyNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Mark a specific notification as read, ensuring ownership validation
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    // Ownership check
    if (notification.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa thông báo này');
    }

    notification.isRead = true;
    return notification.save();
  }

  /**
   * Mark all notifications for the user as read in bulk
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true } },
      )
      .exec();
  }
}
