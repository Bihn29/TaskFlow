import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MoveTaskDto {
  @IsNotEmpty({ message: 'sourceListId không được để trống' })
  @IsString({ message: 'sourceListId phải là một chuỗi ký tự' })
  sourceListId: string;

  @IsNotEmpty({ message: 'targetListId không được để trống' })
  @IsString({ message: 'targetListId phải là một chuỗi ký tự' })
  targetListId: string;

  @IsNotEmpty({ message: 'Vị trí không được để trống' })
  @IsNumber({}, { message: 'Vị trí phải là một số nguyên' })
  position: number;
}
