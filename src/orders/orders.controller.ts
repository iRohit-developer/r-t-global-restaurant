import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	getAll() {
		return this.ordersService.findAll();
	}

	@Get(':id')
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	getById(@Param('id', ParseIntPipe) id: number) {
		return this.ordersService.findOne(id);
	}

	@Post()
	@Roles(UserRole.STAFF)
	create(@Body() payload: CreateOrderDto) {
		return this.ordersService.create(payload);
	}

	@Patch(':id/status')
	@Roles(UserRole.STAFF)
	updateStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateOrderStatusDto,
	) {
		return this.ordersService.updateStatus(id, payload);
	}

	@Patch(':id/cancel')
	@Roles(UserRole.STAFF)
	cancel(@Param('id', ParseIntPipe) id: number) {
		return this.ordersService.cancel(id);
	}
}
