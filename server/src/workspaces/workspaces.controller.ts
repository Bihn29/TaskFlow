import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.createWorkspace(createWorkspaceDto, currentUserPayload.userId);
  }

  @Get()
  async getMyWorkspaces(
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.getMyWorkspaces(currentUserPayload.userId);
  }

  @Get(':workspaceId')
  async getWorkspaceDetail(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.getWorkspaceDetail(workspaceId, currentUserPayload.userId);
  }

  @Patch(':workspaceId')
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.updateWorkspace(workspaceId, updateWorkspaceDto, currentUserPayload.userId);
  }

  @Delete(':workspaceId')
  async deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.deleteWorkspace(workspaceId, currentUserPayload.userId);
  }

  @Post(':workspaceId/members')
  async addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.addMember(workspaceId, addMemberDto, currentUserPayload.userId);
  }

  @Patch(':workspaceId/members/:userId/role')
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, targetUserId, updateMemberRoleDto, currentUserPayload.userId);
  }

  @Delete(':workspaceId/members/:userId')
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() currentUserPayload: { userId: string; email: string },
  ) {
    return this.workspacesService.removeMember(workspaceId, targetUserId, currentUserPayload.userId);
  }
}
