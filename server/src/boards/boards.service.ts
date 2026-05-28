import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    private workspacesService: WorkspacesService,
    // Inject Mongoose models directly to handle cascade deletions without circular module DI issues
    @InjectModel('List') private listModel: Model<any>,
    @InjectModel('Task') private taskModel: Model<any>,
    private realtimeService: RealtimeService,
    private activityLogsService: ActivityLogsService,
  ) {}

  // ==========================================
  // Helper routines for Access Control
  // ==========================================

  /**
   * Fetch board by ID. Throws NotFoundException if missing.
   */
  async findBoardById(boardId: string): Promise<BoardDocument> {
    if (!Types.ObjectId.isValid(boardId)) {
      throw new NotFoundException('Board không tồn tại');
    }

    const board = await this.boardModel.findById(boardId).exec();
    if (!board) {
      throw new NotFoundException('Board không tồn tại');
    }

    return board;
  }

  /**
   * Ensure user is a member of the workspace containing the board
   */
  async ensureBoardAccess(boardId: string, userId: string): Promise<BoardDocument> {
    const board = await this.findBoardById(boardId);
    const workspace = await this.workspacesService.findWorkspaceById(board.workspaceId.toString());
    this.workspacesService.ensureWorkspaceMember(workspace, userId);
    return board;
  }

  /**
   * Ensure user is Owner/Admin in the workspace containing the board
   */
  async ensureBoardAdminOrOwner(boardId: string, userId: string): Promise<BoardDocument> {
    const board = await this.findBoardById(boardId);
    const workspace = await this.workspacesService.findWorkspaceById(board.workspaceId.toString());
    this.workspacesService.ensureWorkspaceAdminOrOwner(workspace, userId);
    return board;
  }

  // ==========================================
  // Core Board Operations
  // ==========================================

  /**
   * Create a new Board inside a Workspace
   */
  async createBoard(workspaceId: string, createBoardDto: CreateBoardDto, userId: string): Promise<BoardDocument> {
    const workspace = await this.workspacesService.findWorkspaceById(workspaceId);
    this.workspacesService.ensureWorkspaceMember(workspace, userId);

    const { name, description } = createBoardDto;
    const newBoard = new this.boardModel({
      name,
      description: description || '',
      workspaceId: new Types.ObjectId(workspaceId),
      createdBy: new Types.ObjectId(userId),
    });

    const saved = await newBoard.save();

    // Log Activity
    await this.activityLogsService.createLog(
      workspaceId,
      userId,
      'BOARD_CREATED',
      `đã tạo bảng công việc "${saved.name}"`,
      saved._id.toString(),
      undefined,
      { boardName: saved.name }
    );

    return saved;
  }

  /**
   * List all Boards belonging to a Workspace
   */
  async getBoardsByWorkspace(workspaceId: string, userId: string): Promise<BoardDocument[]> {
    const workspace = await this.workspacesService.findWorkspaceById(workspaceId);
    this.workspacesService.ensureWorkspaceMember(workspace, userId);

    return this.boardModel.find({ workspaceId: new Types.ObjectId(workspaceId) }).exec();
  }

  /**
   * Get detailed metadata of a specific Board
   */
  async getBoardDetail(boardId: string, userId: string): Promise<BoardDocument> {
    return this.ensureBoardAccess(boardId, userId);
  }

  /**
   * Update Board metadata (restricted to Owner/Admin)
   */
  async updateBoard(boardId: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<BoardDocument> {
    const board = await this.ensureBoardAdminOrOwner(boardId, userId);

    const { name, description } = updateBoardDto;
    if (name !== undefined) board.name = name;
    if (description !== undefined) board.description = description;

    const saved = await board.save();
    
    // Emit realtime event
    this.realtimeService.emitToBoard(boardId, 'board_updated', saved);
    
    // Log Activity
    await this.activityLogsService.createLog(
      saved.workspaceId.toString(),
      userId,
      'BOARD_UPDATED',
      `đã cập nhật thông tin bảng "${saved.name}"`,
      boardId,
      undefined,
      { boardName: saved.name }
    );

    return saved;
  }

  /**
   * Delete Board and cascade deletes all Lists and Tasks inside it (restricted to Owner/Admin)
   */
  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.ensureBoardAdminOrOwner(boardId, userId);
    const workspaceId = board.workspaceId.toString();
    const boardName = board.name;

    // Log Activity BEFORE deleting to ensure data references are available
    await this.activityLogsService.createLog(
      workspaceId,
      userId,
      'BOARD_DELETED',
      `đã xóa bảng công việc "${boardName}"`,
      boardId,
      undefined,
      { boardName }
    );

    // 1. Delete Board
    await this.boardModel.findByIdAndDelete(boardId).exec();

    // 2. Cascade delete all Lists belonging to this Board
    await this.listModel.deleteMany({ boardId: new Types.ObjectId(boardId) }).exec();

    // 3. Cascade delete all Tasks belonging to this Board
    await this.taskModel.deleteMany({ boardId: new Types.ObjectId(boardId) }).exec();
  }
}
