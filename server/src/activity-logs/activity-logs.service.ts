import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from './schemas/activity-log.schema';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLogDocument>,
    private realtimeService: RealtimeService,
    // Inject models directly to avoid circular dependency trees
    @InjectModel('Board') private boardModel: Model<any>,
    @InjectModel('Task') private taskModel: Model<any>,
    @InjectModel('Workspace') private workspaceModel: Model<any>,
  ) {}

  /**
   * Create an activity log and emit a real-time event to the board's room if boardId is specified
   */
  async createLog(
    workspaceId: string,
    userId: string,
    action: string,
    message?: string,
    boardId?: string,
    taskId?: string,
    metadata?: any,
  ): Promise<ActivityLogDocument> {
    const newLog = new this.activityLogModel({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(userId),
      action,
      message,
      boardId: boardId ? new Types.ObjectId(boardId) : undefined,
      taskId: taskId ? new Types.ObjectId(taskId) : undefined,
      metadata,
    });

    const saved = await newLog.save();
    const populated = await this.activityLogModel
      .findById(saved._id)
      .populate('userId', 'name email avatarUrl')
      .exec();

    // If related to a board, broadcast to the board's realtime room
    if (boardId && populated) {
      this.realtimeService.emitToBoard(boardId, 'activity_created', populated);
    }

    return populated || saved;
  }

  /**
   * Fetch all activity logs of a specific board, verifying user has membership access
   */
  async getBoardLogs(boardId: string, userId: string): Promise<ActivityLogDocument[]> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new NotFoundException('Board không tồn tại');
    }

    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException('Board không tồn tại');
    }

    // Verify workspace membership
    const workspace = await this.workspaceModel.findById(board.workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }
    const isMember = workspace.members.some((m: any) => {
      const idStr = m.userId?._id?.toString() || m.userId?.id || m.userId?.toString();
      return idStr === userId;
    });
    if (!isMember && workspace.ownerId?.toString() !== userId) {
      throw new ForbiddenException('Bạn không phải là thành viên của workspace này');
    }

    return this.activityLogModel
      .find({ boardId: new Types.ObjectId(boardId) })
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Fetch all activity logs of a specific task, verifying user has membership access
   */
  async getTaskLogs(taskId: string, userId: string): Promise<ActivityLogDocument[]> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException('Task không tồn tại');
    }

    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    const board = await this.boardModel.findById(task.boardId.toString()).exec();
    if (!board) {
      throw new NotFoundException('Board liên kết với Task không tồn tại');
    }

    // Verify workspace membership
    const workspace = await this.workspaceModel.findById(board.workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }
    const isMember = workspace.members.some((m: any) => {
      const idStr = m.userId?._id?.toString() || m.userId?.id || m.userId?.toString();
      return idStr === userId;
    });
    if (!isMember && workspace.ownerId?.toString() !== userId) {
      throw new ForbiddenException('Bạn không phải là thành viên của workspace này');
    }

    return this.activityLogModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
