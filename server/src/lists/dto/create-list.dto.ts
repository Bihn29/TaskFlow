import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateListDto {
  @IsNotEmpty({ message: 'Tiêu đề list không được để trống' })
  @IsString({ message: 'Tiêu đề list phải là một chuỗi ký tự' })
  @MinLength(1, { message: 'Tiêu đề list phải chứa ít nhất 1 ký tự' })
  title: string;
}
