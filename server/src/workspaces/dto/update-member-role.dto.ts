import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '../enums/workspace-role.enum';

export class UpdateMemberRoleDto {
  @IsNotEmpty({ message: 'Quyền thành viên không được để trống' })
  @IsEnum(WorkspaceRole, { message: 'Quyền thành viên không hợp lệ' })
  role: WorkspaceRole;
}
