import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { TasksService } from '../tasks/tasks.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { WorkspaceRole } from '../workspaces/enums/workspace-role.enum';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private tasksService: TasksService,
    private boardsService: BoardsService,
    private workspacesService: WorkspacesService,
    private realtimeService: RealtimeService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  private async ensureTaskAccess(taskId: string, userId: string): Promise<any> {
    const task = await this.tasksService.findTaskById(taskId);
    const board = await this.boardsService.findBoardById(task.boardId.toString());
    const workspace = await this.workspacesService.findWorkspaceById(board.workspaceId.toString());
    const role = this.workspacesService.getMemberRole(workspace, userId);
    
    if (!role) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }
    
    return { task, workspace, role };
  }

  async createComment(taskId: string, createCommentDto: CreateCommentDto, userId: string): Promise<CommentDocument> {
    const { task } = await this.ensureTaskAccess(taskId, userId);

    const { content } = createCommentDto;
    const newComment = new this.commentModel({
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      content,
    });

    const saved = await newComment.save();
    const commentDetails = await this.commentModel
      .findById(saved._id)
      .populate('userId', '-passwordHash')
      .exec() as any;

    this.realtimeService.emitToBoard(task.boardId.toString(), 'comment_created', commentDetails);

    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(task.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'COMMENT_CREATED',
        `đã bình luận về thẻ "${task.title}": "${commentDetails.content}"`,
        task.boardId.toString(),
        task._id.toString(),
        { commentId: commentDetails._id.toString(), taskId: task._id.toString(), content: commentDetails.content }
      );

      // Create Notification (TASK_COMMENTED) for task creator and assignees (excluding the commenter)
      const recipientIds = new Set<string>();

      // Task creator
      const creatorIdStr = task.createdBy instanceof Object
        ? (task.createdBy as any)._id?.toString() || (task.createdBy as any).id
        : task.createdBy?.toString();
      if (creatorIdStr && creatorIdStr !== userId) {
        recipientIds.add(creatorIdStr);
      }

      // Task assignees
      if (Array.isArray(task.assignees)) {
        task.assignees.forEach((assignee: any) => {
          const assigneeIdStr = assignee instanceof Object
            ? assignee._id?.toString() || assignee.id
            : assignee?.toString();
          if (assigneeIdStr && assigneeIdStr !== userId) {
            recipientIds.add(assigneeIdStr);
          }
        });
      }

      const commenterName = commentDetails.userId?.name || 'Một thành viên';
      const notifyMsg = `${commenterName} đã bình luận về thẻ công việc: ${task.title}`;

      for (const recipientId of recipientIds) {
        await this.notificationsService.createNotification(
          recipientId,
          'TASK_COMMENTED',
          notifyMsg,
          task._id.toString(),
          task.boardId.toString(),
          board.workspaceId.toString(),
        );
      }
    } catch (e) {}

    return commentDetails;
  }

  async getCommentsByTask(taskId: string, userId: string): Promise<CommentDocument[]> {
    await this.ensureTaskAccess(taskId, userId);

    return this.commentModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('userId', '-passwordHash')
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateComment(commentId: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn chỉ được sửa bình luận của chính mình');
    }

    comment.content = updateCommentDto.content;
    const saved = await comment.save();
    
    const commentDetails = await this.commentModel
      .findById(saved._id)
      .populate('userId', '-passwordHash')
      .exec() as any;

    const task = await this.tasksService.findTaskById(comment.taskId.toString());
    this.realtimeService.emitToBoard(task.boardId.toString(), 'comment_updated', commentDetails);

    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(task.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'COMMENT_UPDATED',
        `đã cập nhật bình luận của mình về thẻ "${task.title}"`,
        task.boardId.toString(),
        task._id.toString(),
        { commentId: commentDetails._id.toString(), taskId: task._id.toString() }
      );
    } catch (e) {}

    return commentDetails;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const task = await this.tasksService.findTaskById(comment.taskId.toString());
    const boardId = task.boardId.toString();

    const doDelete = async () => {
      // Log Activity BEFORE deleting
      try {
        const board = await this.boardsService.findBoardById(boardId);
        await this.activityLogsService.createLog(
          board.workspaceId.toString(),
          userId,
          'COMMENT_DELETED',
          `đã xóa một bình luận dưới thẻ "${task.title}"`,
          boardId,
          task._id.toString(),
          { commentId, taskId: task._id.toString() }
        );
      } catch (e) {}

      await this.commentModel.findByIdAndDelete(commentId).exec();
      this.realtimeService.emitToBoard(boardId, 'comment_deleted', {
        commentId,
        taskId: comment.taskId.toString(),
        boardId,
      });
    };

    if (comment.userId.toString() === userId) {
      await doDelete();
      return;
    }

    const { role } = await this.ensureTaskAccess(comment.taskId.toString(), userId);
    
    if (role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN) {
      await doDelete();
    } else {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }
  }
}
