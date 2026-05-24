import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuService } from '../menu/menu.service';
import { InvalidOrderStatusException } from '../common/exceptions/invalid-order.exception';
import { MenuItemUnavailableException } from '../common/exceptions/menu-unavailable.exception';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name);

	constructor(
		@InjectRepository(Order)
		private readonly orderRepo: Repository<Order>,
		private readonly menuService: MenuService,
	) {}

	findAll(): Promise<Order[]> {
		this.logger.log('Fetching all orders');
		return this.orderRepo.find();
	}

	async findOne(id: number): Promise<Order> {
		const order = await this.orderRepo.findOneBy({ id });

		if (!order) {
			throw new NotFoundException(`Order ${id} not found`);
		}

		return order;
	}

	async create(payload: CreateOrderDto): Promise<Order> {
		if (!payload.items || payload.items.length === 0) {
			throw new BadRequestException('Order must include at least one item');
		}

		const validatedItems: Array<{ menuItemId: number; quantity: number; price: number }> = [];
		let totalAmount = 0;

		for (const item of payload.items) {
			if (item.quantity <= 0) {
				throw new BadRequestException('Item quantity must be greater than 0');
			}

			const menuItem = await this.menuService.findOne(item.menuItemId);

			if (!menuItem.isAvailable) {
				throw new MenuItemUnavailableException(menuItem.id);
			}

			totalAmount += menuItem.price * item.quantity;
			validatedItems.push({
				menuItemId: menuItem.id,
				quantity: item.quantity,
				price: menuItem.price,
			});
		}

		const order = this.orderRepo.create({
			tableNumber: payload.tableNumber,
			customerName: payload.customerName,
			status: OrderStatus.PENDING,
			totalAmount,
			items: validatedItems,
		});

		let saved: Order;
		try {
			saved = await this.orderRepo.save(order);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown persistence error';
			this.logger.error(`Failed to create order for table ${payload.tableNumber}: ${message}`);
			throw error;
		}
		this.logger.log(`Order created: ${saved.id}`);
		return saved;
	}

	async updateStatus(id: number, payload: UpdateOrderStatusDto): Promise<Order> {
		const order = await this.findOne(id);
		order.status = payload.status;
		let saved: Order;
		try {
			saved = await this.orderRepo.save(order);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown persistence error';
			this.logger.error(`Failed to update order status for ${id}: ${message}`);
			throw error;
		}
		this.logger.log(`Order status updated: ${id} -> ${payload.status}`);
		return saved;
	}

	async cancel(id: number): Promise<Order> {
		const order = await this.findOne(id);

		const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PREPARING];
		if (!cancellableStatuses.includes(order.status)) {
			throw new InvalidOrderStatusException(order.status);
		}

		order.status = OrderStatus.CANCELLED;
		let saved: Order;
		try {
			saved = await this.orderRepo.save(order);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown persistence error';
			this.logger.error(`Failed to cancel order ${id}: ${message}`);
			throw error;
		}
		this.logger.warn(`Order cancelled: ${id}`);
		return saved;
	}
}
