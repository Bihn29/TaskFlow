import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString({ message: 'Tên board phải là một chuỗi ký tự' })
  @MinLength(2, { message: 'Tên board phải chứa ít nhất 2 ký tự' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là một chuỗi ký tự' })
  description?: string;
}
