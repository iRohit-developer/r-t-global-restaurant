import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
	PENDING = 'pending',
	PREPARING = 'preparing',
	SERVED = 'served',
	CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ example: 12 })
	@Column()
	tableNumber!: number;

	@ApiProperty({ example: 'John Doe' })
	@Column()
	customerName!: string;

	@ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
	@Column({
		type: 'enum',
		enum: OrderStatus,
		default: OrderStatus.PENDING,
	})
	status!: OrderStatus;

	@ApiProperty({ example: 28.5 })
	@Column('float')
	totalAmount!: number;

	@ApiProperty({ type: OrderItem, isArray: true })
	@OneToMany(() => OrderItem, (item) => item.order, {
		cascade: true,
		eager: true,
	})
	items!: OrderItem[];
}
