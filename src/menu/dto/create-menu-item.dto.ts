import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuCategory } from '../entities/menu.entity';

export class CreateMenuItemDto {
	@ApiProperty({ example: 'Margherita Pizza' })
	@IsString()
	name!: string;

	@ApiProperty({ enum: MenuCategory, example: MenuCategory.MAIN })
	@IsEnum(MenuCategory)
	category!: MenuCategory;

	@ApiProperty({ example: 12.99, minimum: 0 })
	@IsNumber()
	@Min(0)
	price!: number;

	@ApiPropertyOptional({ example: true, default: true })
	@IsOptional()
	@IsBoolean()
	isAvailable?: boolean;
}
