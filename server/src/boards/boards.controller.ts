import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post('workspaces/:workspaceId/boards')
  async createBoard(
    @Param('workspaceId') workspaceId: string,
    @Body() createBoardDto: CreateBoardDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.boardsService.createBoard(workspaceId, createBoardDto, currentUserPayload.userId);
  }

  @Get('workspaces/:workspaceId/boards')
  async getBoardsByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.boardsService.getBoardsByWorkspace(workspaceId, currentUserPayload.userId);
  }

  @Get('boards/:boardId')
  async getBoardDetail(
    @Param('boardId') boardId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.boardsService.getBoardDetail(boardId, currentUserPayload.userId);
  }

  @Patch('boards/:boardId')
  async updateBoard(
    @Param('boardId') boardId: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.boardsService.updateBoard(boardId, updateBoardDto, currentUserPayload.userId);
  }

  @Delete('boards/:boardId')
  async deleteBoard(
    @Param('boardId') boardId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.boardsService.deleteBoard(boardId, currentUserPayload.userId);
  }
}
