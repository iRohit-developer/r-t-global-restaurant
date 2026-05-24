import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../orders/entities/order.entity';

export class InvalidOrderStatusException extends BadRequestException {
	constructor(currentStatus: OrderStatus) {
		if (currentStatus === OrderStatus.SERVED) {
			super('Cannot cancel a served order');
			return;
		}

		super(`Order cannot be cancelled when status is ${currentStatus}`);
	}
}
