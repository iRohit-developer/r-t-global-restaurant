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
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Orders')
@ApiBearerAuth()
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	@ApiOperation({ summary: 'Get all orders' })
	@ApiOkResponse({ description: 'List of orders', type: Order, isArray: true })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	getAll() {
		return this.ordersService.findAll();
	}

	@Get(':id')
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	@ApiOperation({ summary: 'Get order by id' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Order ID' })
	@ApiOkResponse({ description: 'Order details', type: Order })
	@ApiNotFoundResponse({ description: 'Order not found' })
	@ApiBadRequestResponse({ description: 'Invalid id supplied' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	getById(@Param('id', ParseIntPipe) id: number) {
		return this.ordersService.findOne(id);
	}

	@Post()
	@Roles(UserRole.STAFF)
	@ApiOperation({ summary: 'Create a new order' })
	@ApiCreatedResponse({ description: 'Order created', type: Order })
	@ApiBadRequestResponse({
		description: 'Validation failed, invalid quantities, or unavailable menu item',
	})
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	create(@Body() payload: CreateOrderDto) {
		return this.ordersService.create(payload);
	}

	@Patch(':id/status')
	@Roles(UserRole.STAFF)
	@ApiOperation({ summary: 'Update order status' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Order ID' })
	@ApiOkResponse({ description: 'Updated order', type: Order })
	@ApiNotFoundResponse({ description: 'Order not found' })
	@ApiBadRequestResponse({ description: 'Validation failed for status or invalid id supplied' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	updateStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateOrderStatusDto,
	) {
		return this.ordersService.updateStatus(id, payload);
	}

	@Patch(':id/cancel')
	@Roles(UserRole.STAFF)
	@ApiOperation({ summary: 'Cancel an order' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Order ID' })
	@ApiOkResponse({ description: 'Cancelled order', type: Order })
	@ApiNotFoundResponse({ description: 'Order not found' })
	@ApiBadRequestResponse({ description: 'Order cannot be cancelled in current status or invalid id supplied' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	cancel(@Param('id', ParseIntPipe) id: number) {
		return this.ordersService.cancel(id);
	}
}
