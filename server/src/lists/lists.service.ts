import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { List, ListDocument } from './schemas/list.schema';
import { BoardsService } from '../boards/boards.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ReorderListsDto } from './dto/reorder-lists.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(List.name) private listModel: Model<ListDocument>,
    private boardsService: BoardsService,
    // Direct model injection to manage cascade deletions without circular DI conflicts
    @InjectModel('Task') private taskModel: Model<any>,
    private realtimeService: RealtimeService,
    private activityLogsService: ActivityLogsService,
  ) {}

  // ==========================================
  // Helper Permission Routines
  // ==========================================

  /**
   * Fetch a List by ID. Throws NotFoundException if missing.
   */
  async findListById(listId: string): Promise<ListDocument> {
    if (!Types.ObjectId.isValid(listId)) {
      throw new NotFoundException('List không tồn tại');
    }

    const list = await this.listModel.findById(listId).exec();
    if (!list) {
      throw new NotFoundException('List không tồn tại');
    }

    return list;
  }

  /**
   * Ensure user is member of the workspace containing the list
   */
  async ensureListAccess(listId: string, userId: string): Promise<ListDocument> {
    const list = await this.findListById(listId);
    await this.boardsService.ensureBoardAccess(list.boardId.toString(), userId);
    return list;
  }

  /**
   * Ensure user is Owner/Admin of the workspace containing the list
   */
  async ensureListAdminOrOwner(listId: string, userId: string): Promise<ListDocument> {
    const list = await this.findListById(listId);
    await this.boardsService.ensureBoardAdminOrOwner(list.boardId.toString(), userId);
    return list;
  }

  // ==========================================
  // Core List Operations
  // ==========================================

  /**
   * Create a new List (Column) inside a Board
   */
  async createList(boardId: string, createListDto: CreateListDto, userId: string): Promise<ListDocument> {
    await this.boardsService.ensureBoardAccess(boardId, userId);

    const { title } = createListDto;
    
    // Automatically calculate next incremental position
    const currentListCount = await this.listModel.countDocuments({ boardId: new Types.ObjectId(boardId) }).exec();

    const newList = new this.listModel({
      title,
      boardId: new Types.ObjectId(boardId),
      position: currentListCount,
    });

    const saved = await newList.save();
    
    // Emit realtime event
    this.realtimeService.emitToBoard(boardId, 'list_created', saved);
    
    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(boardId);
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'LIST_CREATED',
        `đã tạo danh sách "${saved.title}"`,
        boardId,
        undefined,
        { listId: saved._id.toString(), listTitle: saved.title }
      );
    } catch (e) {
      // safe fallback
    }

    return saved;
  }

  /**
   * List all columns belonging to a Board, sorted ascending by position
   */
  async getListsByBoard(boardId: string, userId: string): Promise<ListDocument[]> {
    await this.boardsService.ensureBoardAccess(boardId, userId);

    return this.listModel
      .find({ boardId: new Types.ObjectId(boardId) })
      .sort({ position: 1 })
      .exec();
  }

  /**
   * Update List Title (Allowed for any Workspace Member)
   */
  async updateList(listId: string, updateListDto: UpdateListDto, userId: string): Promise<ListDocument> {
    const list = await this.ensureListAccess(listId, userId);

    const { title } = updateListDto;
    if (title !== undefined) {
      list.title = title;
    }

    const saved = await list.save();
    
    // Emit realtime event
    this.realtimeService.emitToBoard(saved.boardId.toString(), 'list_updated', saved);
    
    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(saved.boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'LIST_UPDATED',
        `đã đổi tên danh sách thành "${saved.title}"`,
        saved.boardId.toString(),
        undefined,
        { listId: saved._id.toString(), listTitle: saved.title }
      );
    } catch (e) {}

    return saved;
  }

  /**
   * Delete List, cascade delete nested Tasks, and shift remaining column positions (Owner/Admin only)
   */
  async deleteList(listId: string, userId: string): Promise<void> {
    const list = await this.ensureListAdminOrOwner(listId, userId);
    const boardId = list.boardId;
    const listTitle = list.title;

    // Log Activity BEFORE deleting to ensure board and workspace references are resolved
    try {
      const board = await this.boardsService.findBoardById(boardId.toString());
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'LIST_DELETED',
        `đã xóa danh sách "${listTitle}"`,
        boardId.toString(),
        undefined,
        { listId, listTitle }
      );
    } catch (e) {}

    // 1. Delete List
    await this.listModel.findByIdAndDelete(listId).exec();

    // 2. Cascade delete all Tasks inside this list
    await this.taskModel.deleteMany({ listId: new Types.ObjectId(listId) }).exec();

    // 3. Shift remaining column positions to maintain seamless order
    const remainingLists = await this.listModel
      .find({ boardId })
      .sort({ position: 1 })
      .exec();

    for (let i = 0; i < remainingLists.length; i++) {
      remainingLists[i].position = i;
      await remainingLists[i].save();
    }
    
    // Emit realtime event
    this.realtimeService.emitToBoard(boardId.toString(), 'list_deleted', { listId, boardId: boardId.toString() });
  }

  /**
   * Bulk reorder lists within a specific board (Workspace Members only)
   */
  async reorderLists(boardId: string, reorderListsDto: ReorderListsDto, userId: string): Promise<ListDocument[]> {
    await this.boardsService.ensureBoardAccess(boardId, userId);

    const { items } = reorderListsDto;

    // Update positions in bulk, checking that the lists strictly belong to the specified board
    for (const item of items) {
      await this.listModel.updateOne(
        { 
          _id: new Types.ObjectId(item.listId), 
          boardId: new Types.ObjectId(boardId) 
        },
        { 
          $set: { position: item.position } 
        }
      ).exec();
    }

    // Emit realtime event
    this.realtimeService.emitToBoard(boardId, 'lists_reordered', { boardId });

    // Log Activity
    try {
      const board = await this.boardsService.findBoardById(boardId);
      await this.activityLogsService.createLog(
        board.workspaceId.toString(),
        userId,
        'LIST_REORDERED',
        `đã sắp xếp lại các cột danh sách`,
        boardId,
        undefined,
        {}
      );
    } catch (e) {}

    // Return the newly sorted list representation
    return this.getListsByBoard(boardId, userId);
  }
}
