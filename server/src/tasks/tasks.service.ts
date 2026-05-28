import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { ListsService } from '../lists/lists.service';
import { BoardsService } from '../boards/boards.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { WorkspaceRole } from '../workspaces/enums/workspace-role.enum';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private listsService: ListsService,
    private boardsService: BoardsService,
    private workspacesService: WorkspacesService,
    private realtimeService: RealtimeService,
    private notificationsService: NotificationsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  // ==========================================
  // Helper Permission Routines
  // ==========================================

  /**
   * Fetch Task by ID, populating createdBy and assignees detailed profiles while hiding password hashes
   */
  async findTaskById(taskId: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException('Task không tồn tại');
    }

    const task = await this.taskModel
      .findById(taskId)
      .populate('createdBy', '-passwordHash')
      .populate('assignees', '-passwordHash')
      .exec();

    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    return task;
  }

  /**
   * Ensure user is member of the workspace containing the task
   */
  async ensureTaskAccess(taskId: string, userId: string): Promise<TaskDocument> {
    const task = await this.findTaskById(taskId);
    await this.boardsService.ensureBoardAccess(task.boardId.toString(), userId);
    return task;
  }

  /**
   * Ensure user is Owner/Admin of the workspace containing the task
   */
  async ensureTaskAdminOrOwner(taskId: string, userId: string): Promise<TaskDocument> {
    const task = await this.findTaskById(taskId);
    await this.boardsService.ensureBoardAdminOrOwner(task.boardId.toString(), userId);
    return task;
  }

  // ==========================================
  // Core Task Operations
  // ==========================================

  /**
   * Create a new Task inside a specific List (Column)
   */
  async createTask(listId: string, createTaskDto: CreateTaskDto, userId: string): Promise<TaskDocument> {
    const list = await this.listsService.findListById(listId);
    
    // Check permission at Board/Workspace level
    await this.boardsService.ensureBoardAccess(list.boardId.toString(), userId);

    const { title, description, priority, dueDate } = createTaskDto;

    // Automatically calculate next incremental position inside this List
    const taskCount = await this.taskModel.countDocuments({ listId: new Types.ObjectId(listId) }).exec();

    const newTask = new this.taskModel({
      title,
      description: description || '',
      boardId: list.boardId,
      listId: new Types.ObjectId(listId),
      position: taskCount,
      priority: priority || undefined,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: new Types.ObjectId(userId),
      assignees: [],
    });

    const saved = await newTask.save();
    const taskDetails = await this.findTaskById(saved._id.toString());
    
    // Emit realtime event
    this.realtimeService.emitToBoard(taskDetails.boardId.toString(), 'task_created', taskDetails);
    
    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(taskDetails.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'TASK_CREATED',
        `đã tạo thẻ công việc "${taskDetails.title}"`,
        taskDetails.boardId.toString(),
        taskDetails._id.toString(),
        { taskId: taskDetails._id.toString(), title: taskDetails.title }
      );
    } catch (e) {}

    return taskDetails;
  }

  /**
   * List all Tasks inside a Board, sorted ascending by listId and position
   */
  async getTasksByBoard(boardId: string, userId: string): Promise<TaskDocument[]> {
    await this.boardsService.ensureBoardAccess(boardId, userId);

    return this.taskModel
      .find({ boardId: new Types.ObjectId(boardId) })
      .populate('createdBy', '-passwordHash')
      .populate('assignees', '-passwordHash')
      .sort({ listId: 1, position: 1 })
      .exec();
  }

  /**
   * Get detailed metadata of a specific Task
   */
  async getTaskDetail(taskId: string, userId: string): Promise<TaskDocument> {
    return this.ensureTaskAccess(taskId, userId);
  }

  /**
   * Update Task metadata (Allowed for any Workspace Member)
   */
  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<TaskDocument> {
    const task = await this.ensureTaskAccess(taskId, userId);

    const { title, description, priority, dueDate } = updateTaskDto;
    
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const saved = await task.save();
    const taskDetails = await this.findTaskById(saved._id.toString());
    
    // Emit realtime event
    this.realtimeService.emitToBoard(taskDetails.boardId.toString(), 'task_updated', taskDetails);
    
    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(taskDetails.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'TASK_UPDATED',
        `đã cập nhật thông tin thẻ "${taskDetails.title}"`,
        taskDetails.boardId.toString(),
        taskDetails._id.toString(),
        { taskId: taskDetails._id.toString(), title: taskDetails.title }
      );
    } catch (e) {}

    return taskDetails;
  }

  /**
   * Delete Task, with strict Member creation constraint checks, shifting remaining card positions
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.findTaskById(taskId);
    
    // Validate role in workspace
    const board = await this.boardsService.findBoardById(task.boardId.toString());
    const workspace = await this.workspacesService.findWorkspaceById(board.workspaceId.toString());
    const role = this.workspacesService.getMemberRole(workspace, userId);

    if (!role) {
      throw new ForbiddenException('Bạn không phải là thành viên của workspace này');
    }

    // Role constraints: MEMBER can only delete their own task. Owner/Admin can delete anything.
    if (role === WorkspaceRole.MEMBER) {
      const creatorId = task.createdBy instanceof Object
        ? (task.createdBy as any)._id?.toString() || (task.createdBy as any).id
        : (task.createdBy as any)?.toString();
      
      if (creatorId !== userId) {
        throw new ForbiddenException('MEMBER chỉ có quyền xóa task do chính mình tạo ra');
      }
    }

    const listId = task.listId;
    const boardId = task.boardId.toString();

    // Log Activity BEFORE deleting to ensure data references are resolved
    try {
      const board = await this.boardsService.findBoardById(boardId);
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'TASK_DELETED',
        `đã xóa thẻ công việc "${task.title}"`,
        boardId,
        taskId,
        { taskId, title: task.title }
      );
    } catch (e) {}

    // 1. Delete Task
    await this.taskModel.findByIdAndDelete(taskId).exec();

    // 2. Shift remaining card positions inside that list to maintain seamless order
    const remainingTasks = await this.taskModel
      .find({ listId })
      .sort({ position: 1 })
      .exec();

    for (let i = 0; i < remainingTasks.length; i++) {
      remainingTasks[i].position = i;
      await remainingTasks[i].save();
    }
    
    // Emit realtime event
    this.realtimeService.emitToBoard(boardId, 'task_deleted', { taskId, boardId });
  }

  /**
   * Move Task across lists and recalculate positions dynamically
   */
  async moveTask(taskId: string, moveTaskDto: MoveTaskDto, userId: string): Promise<TaskDocument> {
    const task = await this.ensureTaskAccess(taskId, userId);

    const { sourceListId, targetListId, position: newPosition } = moveTaskDto;

    // Validate that target list exists and belongs to the same board
    const targetList = await this.listsService.findListById(targetListId);
    if (targetList.boardId.toString() !== task.boardId.toString()) {
      throw new ForbiddenException('Không thể di chuyển task sang cột thuộc board khác');
    }

    // Convert list IDs to ObjectIds
    const sourceListObjId = new Types.ObjectId(sourceListId);
    const targetListObjId = new Types.ObjectId(targetListId);

    if (sourceListId === targetListId) {
      // SCENARIO 1: Moving within the SAME column
      const listTasks = await this.taskModel
        .find({ listId: targetListObjId, _id: { $ne: task._id } })
        .sort({ position: 1 })
        .exec();

      // Splice the active task into the new index position
      listTasks.splice(newPosition, 0, task as any);

      // Save the rearranged order
      for (let i = 0; i < listTasks.length; i++) {
        listTasks[i].position = i;
        await listTasks[i].save();
      }
    } else {
      // SCENARIO 2: Moving to a DIFFERENT column
      task.listId = targetListObjId as any;

      // 1. Arrange positions in the TARGET column
      const targetTasks = await this.taskModel
        .find({ listId: targetListObjId })
        .sort({ position: 1 })
        .exec();

      targetTasks.splice(newPosition, 0, task as any);

      for (let i = 0; i < targetTasks.length; i++) {
        targetTasks[i].position = i;
        await targetTasks[i].save();
      }

      // 2. Rearrange positions in the SOURCE column to fill the gap
      const sourceTasks = await this.taskModel
        .find({ listId: sourceListObjId, _id: { $ne: task._id } })
        .sort({ position: 1 })
        .exec();

      for (let i = 0; i < sourceTasks.length; i++) {
        sourceTasks[i].position = i;
        await sourceTasks[i].save();
      }
    }

    const taskDetails = await this.findTaskById(taskId);
    
    // Emit realtime event
    this.realtimeService.emitToBoard(taskDetails.boardId.toString(), 'task_moved', taskDetails);
    
    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(taskDetails.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'TASK_MOVED',
        `đã di chuyển thẻ "${taskDetails.title}"`,
        taskDetails.boardId.toString(),
        taskDetails._id.toString(),
        {
          taskId: taskDetails._id.toString(),
          title: taskDetails.title,
          sourceListId,
          targetListId,
          position: newPosition,
        }
      );
    } catch (e) {}

    return taskDetails;
  }

  // ==========================================
  // Task Assignee Operations
  // ==========================================

  /**
   * Assign a Workspace Member to a Task (Owner/Admin only)
   */
  async assignTaskMember(taskId: string, assignTaskDto: AssignTaskDto, userId: string): Promise<TaskDocument> {
    const task = await this.ensureTaskAdminOrOwner(taskId, userId);

    const { userId: targetUserId } = assignTaskDto;

    // Verify if the target user is a member of the workspace
    const board = await this.boardsService.findBoardById(task.boardId.toString());
    const workspace = await this.workspacesService.findWorkspaceById(board.workspaceId.toString());
    
    const targetUserRole = this.workspacesService.getMemberRole(workspace, targetUserId);
    if (!targetUserRole) {
      throw new NotFoundException('Thành viên gán không thuộc workspace này');
    }

    // Verify if already assigned
    const isAlreadyAssigned = (task.assignees as any).some((assigneeId: any) => {
      const idStr = assigneeId instanceof Object
        ? (assigneeId as any)._id?.toString() || (assigneeId as any).id
        : assigneeId?.toString();
      return idStr === targetUserId;
    });

    if (isAlreadyAssigned) {
      throw new ConflictException('Thành viên đã được gán vào task này');
    }

    // Append assignee
    (task.assignees as any).push(new Types.ObjectId(targetUserId));
    await task.save();

    const taskDetails = await this.findTaskById(taskId);
    
    // Emit realtime event
    this.realtimeService.emitToBoard(taskDetails.boardId.toString(), 'task_updated', taskDetails);
    
    // Log Activity
    try {
      await this.activityLogsService.createLog(
        workspace.id || workspace._id.toString(),
        userId,
        'TASK_ASSIGNED',
        `đã gán một thành viên vào thẻ "${taskDetails.title}"`,
        taskDetails.boardId.toString(),
        taskDetails._id.toString(),
        { taskId: taskDetails._id.toString(), title: taskDetails.title, assignedUserId: targetUserId }
      );

      // Create Notification if assignee is a different user
      if (targetUserId !== userId) {
        await this.notificationsService.createNotification(
          targetUserId,
          'TASK_ASSIGNED',
          `Bạn đã được gán vào thẻ công việc: ${taskDetails.title}`,
          taskDetails._id.toString(),
          taskDetails.boardId.toString(),
          workspace.id || workspace._id.toString(),
        );
      }
    } catch (e) {}

    return taskDetails;
  }

  /**
   * Remove an assignee from a Task (Owner/Admin only)
   */
  async removeAssignee(taskId: string, targetUserId: string, userId: string): Promise<TaskDocument> {
    const task = await this.ensureTaskAdminOrOwner(taskId, userId);

    // Remove from array
    task.assignees = (task.assignees as any).filter((assigneeId: any) => {
      const idStr = assigneeId instanceof Object
        ? (assigneeId as any)._id?.toString() || (assigneeId as any).id
        : assigneeId?.toString();
      return idStr !== targetUserId;
    });

    await task.save();
    const taskDetails = await this.findTaskById(taskId);
    
    // Emit realtime event
    this.realtimeService.emitToBoard(taskDetails.boardId.toString(), 'task_updated', taskDetails);
    
    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(taskDetails.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'TASK_UNASSIGNED',
        `đã gỡ bỏ thành viên khỏi thẻ "${taskDetails.title}"`,
        taskDetails.boardId.toString(),
        taskDetails._id.toString(),
        { taskId: taskDetails._id.toString(), title: taskDetails.title, removedUserId: targetUserId }
      );
    } catch (e) {}

    return taskDetails;
  }
}
