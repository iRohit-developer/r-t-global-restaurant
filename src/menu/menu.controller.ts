import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
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
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from './entities/menu.entity';
import { MenuService } from './menu.service';

@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Menu')
@ApiBearerAuth()
export class MenuController {
	constructor(private readonly menuService: MenuService) {}

	@Get()
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	@ApiOperation({ summary: 'Get all menu items' })
	@ApiOkResponse({ description: 'List of menu items', type: MenuItem, isArray: true })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	@UseInterceptors(CacheInterceptor)
	@CacheKey('menu_all')
	@CacheTTL(60)
	getAll() {
		return this.menuService.findAll();
	}

	@Get(':id')
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	@ApiOperation({ summary: 'Get a menu item by id' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Menu item ID' })
	@ApiOkResponse({ description: 'Menu item details', type: MenuItem })
	@ApiNotFoundResponse({ description: 'Menu item not found' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	@ApiBadRequestResponse({ description: 'Invalid id supplied' })
	getById(@Param('id', ParseIntPipe) id: number) {
		return this.menuService.findOne(id);
	}

	@Post()
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Create a new menu item' })
	@ApiCreatedResponse({ description: 'Menu item created', type: MenuItem })
	@ApiBadRequestResponse({ description: 'Validation failed or invalid price' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	create(@Body() payload: CreateMenuItemDto) {
		return this.menuService.create(payload);
	}

	@Patch(':id')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Update a menu item' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Menu item ID' })
	@ApiOkResponse({ description: 'Updated menu item', type: MenuItem })
	@ApiNotFoundResponse({ description: 'Menu item not found' })
	@ApiBadRequestResponse({ description: 'Validation failed or invalid price' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateMenuItemDto,
	) {
		return this.menuService.update(id, payload);
	}

	@Patch(':id/unavailable')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Mark a menu item as unavailable' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Menu item ID' })
	@ApiOkResponse({ description: 'Menu item marked unavailable', type: MenuItem })
	@ApiNotFoundResponse({ description: 'Menu item not found' })
	@ApiBadRequestResponse({ description: 'Invalid id supplied' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	markUnavailable(@Param('id', ParseIntPipe) id: number) {
		return this.menuService.updateAvailability(id, false);
	}

	@Delete(':id')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Delete a menu item' })
	@ApiParam({ name: 'id', type: Number, example: 1, description: 'Menu item ID' })
	@ApiOkResponse({
		description: 'Deletion confirmation',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: 'Menu item 1 deleted' },
			},
		},
	})
	@ApiNotFoundResponse({ description: 'Menu item not found' })
	@ApiBadRequestResponse({ description: 'Invalid id supplied' })
	@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
	async remove(@Param('id', ParseIntPipe) id: number) {
		await this.menuService.remove(id);
		return { message: `Menu item ${id} deleted` };
	}
}
