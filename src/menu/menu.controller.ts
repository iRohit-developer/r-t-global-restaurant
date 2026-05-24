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
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';

@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
	constructor(private readonly menuService: MenuService) {}

	@Get()
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	@UseInterceptors(CacheInterceptor)
	@CacheKey('menu_all')
	@CacheTTL(60)
	getAll() {
		return this.menuService.findAll();
	}

	@Get(':id')
	@Roles(UserRole.ADMIN, UserRole.STAFF)
	getById(@Param('id', ParseIntPipe) id: number) {
		return this.menuService.findOne(id);
	}

	@Post()
	@Roles(UserRole.ADMIN)
	create(@Body() payload: CreateMenuItemDto) {
		return this.menuService.create(payload);
	}

	@Patch(':id')
	@Roles(UserRole.ADMIN)
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateMenuItemDto,
	) {
		return this.menuService.update(id, payload);
	}

	@Patch(':id/unavailable')
	@Roles(UserRole.ADMIN)
	markUnavailable(@Param('id', ParseIntPipe) id: number) {
		return this.menuService.updateAvailability(id, false);
	}

	@Delete(':id')
	@Roles(UserRole.ADMIN)
	async remove(@Param('id', ParseIntPipe) id: number) {
		await this.menuService.remove(id);
		return { message: `Menu item ${id} deleted` };
	}
}
