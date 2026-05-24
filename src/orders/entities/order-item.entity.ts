import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'orderId' })
	order!: Order;

	@Column()
	orderId!: number;

	@Column()
	menuItemId!: number;

	@Column()
	quantity!: number;

	@Column('float')
	price!: number;
}
