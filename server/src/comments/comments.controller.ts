import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  async createComment(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.commentsService.createComment(taskId, createCommentDto, currentUserPayload.userId);
  }

  @Get('tasks/:taskId/comments')
  async getCommentsByTask(
    @Param('taskId') taskId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.commentsService.getCommentsByTask(taskId, currentUserPayload.userId);
  }

  @Patch('comments/:commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.commentsService.updateComment(commentId, updateCommentDto, currentUserPayload.userId);
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.commentsService.deleteComment(commentId, currentUserPayload.userId);
  }
}
