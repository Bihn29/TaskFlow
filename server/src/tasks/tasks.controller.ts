import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('lists/:listId/tasks')
  async createTask(
    @Param('listId') listId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.createTask(listId, createTaskDto, currentUserPayload.userId);
  }

  @Get('boards/:boardId/tasks')
  async getTasksByBoard(
    @Param('boardId') boardId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.getTasksByBoard(boardId, currentUserPayload.userId);
  }

  @Get('tasks/:taskId')
  async getTaskDetail(
    @Param('taskId') taskId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.getTaskDetail(taskId, currentUserPayload.userId);
  }

  @Patch('tasks/:taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.updateTask(taskId, updateTaskDto, currentUserPayload.userId);
  }

  @Delete('tasks/:taskId')
  async deleteTask(
    @Param('taskId') taskId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.deleteTask(taskId, currentUserPayload.userId);
  }

  @Patch('tasks/:taskId/move')
  async moveTask(
    @Param('taskId') taskId: string,
    @Body() moveTaskDto: MoveTaskDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.moveTask(taskId, moveTaskDto, currentUserPayload.userId);
  }

  @Post('tasks/:taskId/assignees')
  async assignTaskMember(
    @Param('taskId') taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.assignTaskMember(taskId, assignTaskDto, currentUserPayload.userId);
  }

  @Delete('tasks/:taskId/assignees/:userId')
  async removeAssignee(
    @Param('taskId') taskId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.tasksService.removeAssignee(taskId, targetUserId, currentUserPayload.userId);
  }
}
