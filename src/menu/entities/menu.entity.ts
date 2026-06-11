import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum MenuCategory {
	STARTER = 'starter',
	MAIN = 'main',
	DESSERT = 'dessert',
	DRINK = 'drink',
}

@Entity('menu_items')
export class MenuItem {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ example: 'Margherita Pizza' })
	@Column()
	name!: string;

	@ApiProperty({ enum: MenuCategory, example: MenuCategory.MAIN })
	@Column({
		type: 'enum',
		enum: MenuCategory,
	})
	category!: MenuCategory;

	@ApiProperty({ example: 12.99 })
	@Column('float')
	price!: number;

	@ApiProperty({ example: true, default: true })
	@Column({ default: true })
	isAvailable!: boolean;
}
