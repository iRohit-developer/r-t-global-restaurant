import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
	PENDING = 'pending',
	PREPARING = 'preparing',
	SERVED = 'served',
	CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	tableNumber!: number;

	@Column()
	customerName!: string;

	@Column({
		type: 'enum',
		enum: OrderStatus,
		default: OrderStatus.PENDING,
	})
	status!: OrderStatus;

	@Column('float')
	totalAmount!: number;

	@OneToMany(() => OrderItem, (item) => item.order, {
		cascade: true,
		eager: true,
	})
	items!: OrderItem[];
}
