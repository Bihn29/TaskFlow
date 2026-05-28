import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString({ message: 'Nội dung bình luận phải là một chuỗi ký tự' })
  @MinLength(1, { message: 'Nội dung bình luận phải chứa ít nhất 1 ký tự' })
  content: string;
}
