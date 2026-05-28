import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum';

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: 'Tiêu đề task phải là một chuỗi ký tự' })
  @MinLength(1, { message: 'Tiêu đề task phải chứa ít nhất 1 ký tự' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là một chuỗi ký tự' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Độ ưu tiên không hợp lệ' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'Hạn chót phải là định dạng ngày giờ hợp lệ' })
  dueDate?: string | null;
}
