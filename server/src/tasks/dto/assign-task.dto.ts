import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTaskDto {
  @IsNotEmpty({ message: 'userId không được để trống' })
  @IsString({ message: 'userId phải là một chuỗi ký tự' })
  userId: string;
}
