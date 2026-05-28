import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ListsService } from './lists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ReorderListsDto } from './dto/reorder-lists.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post('boards/:boardId/lists')
  async createList(
    @Param('boardId') boardId: string,
    @Body() createListDto: CreateListDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.listsService.createList(boardId, createListDto, currentUserPayload.userId);
  }

  @Get('boards/:boardId/lists')
  async getListsByBoard(
    @Param('boardId') boardId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.listsService.getListsByBoard(boardId, currentUserPayload.userId);
  }

  @Patch('lists/:listId')
  async updateList(
    @Param('listId') listId: string,
    @Body() updateListDto: UpdateListDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.listsService.updateList(listId, updateListDto, currentUserPayload.userId);
  }

  @Delete('lists/:listId')
  async deleteList(
    @Param('listId') listId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.listsService.deleteList(listId, currentUserPayload.userId);
  }

  @Patch('boards/:boardId/lists/reorder')
  async reorderLists(
    @Param('boardId') boardId: string,
    @Body() reorderListsDto: ReorderListsDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.listsService.reorderLists(boardId, reorderListsDto, currentUserPayload.userId);
  }
}
