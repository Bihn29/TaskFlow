import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsNotEmpty({ message: 'Tên workspace không được để trống' })
  @IsString({ message: 'Tên workspace phải là một chuỗi ký tự' })
  @MinLength(2, { message: 'Tên workspace phải chứa ít nhất 2 ký tự' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là một chuỗi ký tự' })
  description?: string;
}
