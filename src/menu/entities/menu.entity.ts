import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum MenuCategory {
	STARTER = 'starter',
	MAIN = 'main',
	DESSERT = 'dessert',
	DRINK = 'drink',
}

@Entity('menu_items')
export class MenuItem {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column({
		type: 'enum',
		enum: MenuCategory,
	})
	category!: MenuCategory;

	@Column('float')
	price!: number;

	@Column({ default: true })
	isAvailable!: boolean;
}
