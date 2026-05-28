import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument, WorkspaceMember } from './schemas/workspace.schema';
import { UsersService } from '../users/users.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { WorkspaceRole } from './enums/workspace-role.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    private usersService: UsersService,
    private activityLogsService: ActivityLogsService,
  ) {}

  // ==========================================
  // Permission & Query Helpers
  // ==========================================

  /**
   * Find a workspace by ID, populating owner and member detailed documents while hiding password hashes
   */
  async findWorkspaceById(workspaceId: string): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('ownerId', '-passwordHash')
      .populate('members.userId', '-passwordHash')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    return workspace;
  }

  /**
   * Helper to scan a workspace and return the role of a given user
   */
  getMemberRole(workspace: WorkspaceDocument, userId: string): WorkspaceRole | null {
    const member = workspace.members.find((m) => {
      const idStr = (m.userId as any)?._id?.toString() || (m.userId as any)?.id || (m.userId as any)?.toString();
      return idStr === userId;
    });
    return member ? member.role : null;
  }

  /**
   * Throws ForbiddenException if user is not a member of the workspace
   */
  ensureWorkspaceMember(workspace: WorkspaceDocument, userId: string): void {
    const role = this.getMemberRole(workspace, userId);
    if (!role) {
      throw new ForbiddenException('Bạn không phải là thành viên của workspace này');
    }
  }

  /**
   * Throws ForbiddenException if user's role is not OWNER or ADMIN
   */
  ensureWorkspaceAdminOrOwner(workspace: WorkspaceDocument, userId: string): void {
    const role = this.getMemberRole(workspace, userId);
    if (role !== WorkspaceRole.OWNER && role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền quản trị trong workspace này');
    }
  }

  /**
   * Throws ForbiddenException if user's role is not OWNER
   */
  ensureWorkspaceOwner(workspace: WorkspaceDocument, userId: string): void {
    const role = this.getMemberRole(workspace, userId);
    if (role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Chỉ OWNER mới có quyền thực hiện hành động này');
    }
  }

  // ==========================================
  // Workspace Core CRUD Operations
  // ==========================================

  /**
   * Create a new workspace, automatically adding creator as OWNER
   */
  async createWorkspace(createWorkspaceDto: CreateWorkspaceDto, ownerId: string): Promise<WorkspaceDocument> {
    const { name, description } = createWorkspaceDto;

    const newWorkspace = new this.workspaceModel({
      name,
      description: description || '',
      ownerId: new Types.ObjectId(ownerId),
      members: [
        {
          userId: new Types.ObjectId(ownerId),
          role: WorkspaceRole.OWNER,
          joinedAt: new Date(),
        },
      ],
    });

    const saved = await newWorkspace.save();
    return this.findWorkspaceById(saved._id.toString());
  }

  /**
   * List all workspaces where the current user is a member
   */
  async getMyWorkspaces(userId: string): Promise<WorkspaceDocument[]> {
    return this.workspaceModel
      .find({ 'members.userId': new Types.ObjectId(userId) })
      .populate('ownerId', '-passwordHash')
      .populate('members.userId', '-passwordHash')
      .exec();
  }

  /**
   * Get detail metadata of a specific workspace, checking membership first
   */
  async getWorkspaceDetail(workspaceId: string, userId: string): Promise<WorkspaceDocument> {
    const workspace = await this.findWorkspaceById(workspaceId);
    this.ensureWorkspaceMember(workspace, userId);
    return workspace;
  }

  /**
   * Update name/description of workspace (restricted to Owner/Admin)
   */
  async updateWorkspace(workspaceId: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string): Promise<WorkspaceDocument> {
    const workspace = await this.findWorkspaceById(workspaceId);
    this.ensureWorkspaceAdminOrOwner(workspace, userId);

    const { name, description } = updateWorkspaceDto;
    if (name !== undefined) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();
    return this.findWorkspaceById(workspaceId);
  }

  /**
   * Delete workspace (restricted to OWNER only)
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findWorkspaceById(workspaceId);
    this.ensureWorkspaceOwner(workspace, userId);

    await this.workspaceModel.findByIdAndDelete(workspaceId).exec();
  }

  // ==========================================
  // Workspace Team Members Operations
  // ==========================================

  /**
   * Add a team member by email (restricted to Owner/Admin)
   */
  async addMember(workspaceId: string, addMemberDto: AddMemberDto, userId: string): Promise<WorkspaceDocument> {
    const workspace = await this.findWorkspaceById(workspaceId);
    this.ensureWorkspaceAdminOrOwner(workspace, userId);

    const { email, role } = addMemberDto;

    // Search user by email using UsersService
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng sở hữu email này');
    }

    // Verify if user is already a member
    const isAlreadyMember = workspace.members.some((m) => {
      const idStr = (m.userId as any)?._id?.toString() || (m.userId as any)?.id || (m.userId as any)?.toString();
      return idStr === user._id.toString();
    });

    if (isAlreadyMember) {
      throw new ConflictException('Người dùng đã là thành viên của workspace này');
    }

    // Restrict ADMIN from inviting/setting another OWNER
    const targetRole = role || WorkspaceRole.MEMBER;
    if (targetRole === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Không thể cấp quyền OWNER cho thành viên mới');
    }

    // Insert user into members list
    workspace.members.push({
      userId: user._id as any,
      role: targetRole,
      joinedAt: new Date(),
    });

    await workspace.save();

    // Log Activity
    await this.activityLogsService.createLog(
      workspaceId,
      userId,
      'MEMBER_ADDED',
      `đã thêm thành viên ${user.name} vào workspace`,
      undefined,
      undefined,
      { invitedUserId: user._id.toString(), email }
    );

    return this.findWorkspaceById(workspaceId);
  }

  /**
   * Update a member's role (restricted to OWNER only)
   */
  async updateMemberRole(workspaceId: string, targetUserId: string, updateMemberRoleDto: UpdateMemberRoleDto, userId: string): Promise<WorkspaceDocument> {
    const workspace = await this.findWorkspaceById(workspaceId);
    this.ensureWorkspaceOwner(workspace, userId);

    const { role } = updateMemberRoleDto;

    // Restrict changing owner role
    if (targetUserId === workspace.ownerId.toString()) {
      throw new ForbiddenException('Không thể thay đổi quyền hạn của OWNER');
    }

    // Ensure no new OWNER is designated in this endpoint
    if (role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Không thể chuyển đổi vai trò thành OWNER');
    }

    // Find member document
    const member = workspace.members.find((m) => {
      const idStr = (m.userId as any)?._id?.toString() || (m.userId as any)?.id || (m.userId as any)?.toString();
      return idStr === targetUserId;
    });

    if (!member) {
      throw new NotFoundException('Thành viên không tồn tại trong workspace này');
    }

    // Set new role (ADMIN or MEMBER)
    member.role = role;

    await workspace.save();

    // Log Activity
    await this.activityLogsService.createLog(
      workspaceId,
      userId,
      'MEMBER_ROLE_UPDATED',
      `đã thay đổi vai trò của thành viên thành ${role}`,
      undefined,
      undefined,
      { targetUserId, role }
    );

    return this.findWorkspaceById(workspaceId);
  }

  /**
   * Remove a member from the workspace (restricted to Owner/Admin)
   */
  async removeMember(workspaceId: string, targetUserId: string, userId: string): Promise<WorkspaceDocument> {
    const workspace = await this.findWorkspaceById(workspaceId);
    
    const requesterRole = this.getMemberRole(workspace, userId);
    if (!requesterRole) {
      throw new ForbiddenException('Bạn không phải là thành viên của workspace này');
    }

    // Check if target is OWNER
    if (targetUserId === workspace.ownerId.toString()) {
      throw new ForbiddenException('Không thể xóa OWNER khỏi workspace');
    }

    // Check if self exit
    const isSelfExit = userId === targetUserId;

    if (isSelfExit) {
      if (requesterRole === WorkspaceRole.OWNER) {
        throw new ForbiddenException('OWNER không thể tự rời khỏi workspace');
      }
      // If it's ADMIN or MEMBER exiting themselves, we allow it immediately without further permission checks!
    } else {
      // If not self exit, check general removal rights
      if (requesterRole === WorkspaceRole.MEMBER) {
        throw new ForbiddenException('MEMBER không có quyền xóa thành viên khác');
      }

      const targetRole = this.getMemberRole(workspace, targetUserId);
      if (!targetRole) {
        throw new NotFoundException('Thành viên không tồn tại trong workspace này');
      }

      // ADMIN can only remove MEMBER. If target is ADMIN, restricted.
      if (requesterRole === WorkspaceRole.ADMIN && targetRole === WorkspaceRole.ADMIN) {
        throw new ForbiddenException('ADMIN không thể xóa ADMIN khác');
      }
    }

    // Pull/Filter out the target member
    workspace.members = workspace.members.filter((m) => {
      const idStr = (m.userId as any)?._id?.toString() || (m.userId as any)?.id || (m.userId as any)?.toString();
      return idStr !== targetUserId;
    });

    await workspace.save();

    // Log Activity
    await this.activityLogsService.createLog(
      workspaceId,
      userId,
      'MEMBER_REMOVED',
      isSelfExit ? 'đã tự rời khỏi workspace' : 'đã xóa một thành viên khỏi workspace',
      undefined,
      undefined,
      { removedUserId: targetUserId }
    );

    return this.findWorkspaceById(workspaceId);
  }
}
