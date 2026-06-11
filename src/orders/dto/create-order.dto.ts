import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
	ArrayMinSize,
	IsArray,
	IsInt,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
	@ApiProperty({ example: 1, minimum: 1 })
	@IsInt()
	@Min(1)
	menuItemId!: number;

	@ApiProperty({ example: 2, minimum: 1 })
	@IsInt()
	@Min(1)
	quantity!: number;
}

export class CreateOrderDto {
	@ApiProperty({ example: 12, minimum: 1 })
	@IsInt()
	@Min(1)
	tableNumber!: number;

	@ApiProperty({ example: 'John Doe' })
	@IsString()
	customerName!: string;

	@ApiProperty({
		type: CreateOrderItemDto,
		isArray: true,
		example: [
			{ menuItemId: 1, quantity: 2 },
			{ menuItemId: 4, quantity: 1 },
		],
	})
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items!: CreateOrderItemDto[];
}
