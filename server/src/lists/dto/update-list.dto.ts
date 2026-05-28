import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateListDto {
  @IsOptional()
  @IsString({ message: 'Tiêu đề list phải là một chuỗi ký tự' })
  @MinLength(1, { message: 'Tiêu đề list phải chứa ít nhất 1 ký tự' })
  title?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Vị trí phải là một số' })
  position?: number;
}
