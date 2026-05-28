import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderListItemDto {
  @IsNotEmpty({ message: 'listId không được để trống' })
  @IsString({ message: 'listId phải là một chuỗi ký tự' })
  listId: string;

  @IsNotEmpty({ message: 'Vị trí không được để trống' })
  @IsNumber({}, { message: 'Vị trí phải là một số nguyên' })
  position: number;
}

export class ReorderListsDto {
  @IsNotEmpty({ message: 'Danh sách items không được để trống' })
  @IsArray({ message: 'Danh sách items phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ReorderListItemDto)
  items: ReorderListItemDto[];
}
