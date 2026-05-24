import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MenuCategory } from '../entities/menu.entity';

export class CreateMenuItemDto {
	@IsString()
	name!: string;

	@IsEnum(MenuCategory)
	category!: MenuCategory;

	@IsNumber()
	@Min(0)
	price!: number;

	@IsOptional()
	@IsBoolean()
	isAvailable?: boolean;
}
