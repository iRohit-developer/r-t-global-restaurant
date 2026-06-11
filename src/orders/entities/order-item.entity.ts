import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'orderId' })
	order!: Order;
	/*
	This sets up a many-to-one relationship where multiple `OrderItem` records belong to a single `Order`. 
	The `onDelete: 'CASCADE'` ensures all related items are removed when an order is deleted, and `@JoinColumn` specifies `orderId` as the foreign key linking each item to its parent order.
	*/

	@ApiProperty({ example: 1 })
	@Column()
	orderId!: number;

	@ApiProperty({ example: 3 })
	@Column()
	menuItemId!: number;

	@ApiProperty({ example: 2 })
	@Column()
	quantity!: number;

	@ApiProperty({ example: 9.5 })
	@Column('float')
	price!: number;
}
