import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { WorkspaceRole } from '../enums/workspace-role.enum';

export class AddMemberDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @IsEnum(WorkspaceRole, { message: 'Quyền thành viên không hợp lệ' })
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
