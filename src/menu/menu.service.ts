import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from './entities/menu.entity';

@Injectable()
export class MenuService {
	private readonly logger = new Logger(MenuService.name);

	constructor(
		@InjectRepository(MenuItem)
		private readonly menuItemRepo: Repository<MenuItem>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	findAll(): Promise<MenuItem[]> {
		return this.menuItemRepo.find();
	}

	async findOne(id: number): Promise<MenuItem> {
		const cacheKey = this.getMenuItemCacheKey(id);
		const cached = await this.cacheManager.get<MenuItem>(cacheKey);

		if (cached) {
			this.logger.log(`Cache hit for menu item ${id}`);
			return cached;
		}

		this.logger.log(`Cache miss for menu item ${id}`);

		const menuItem = await this.menuItemRepo.findOneBy({ id });
		if (!menuItem) {
			throw new NotFoundException(`Menu item ${id} not found`);
		}

		await this.cacheManager.set(cacheKey, menuItem, 60);
		return menuItem;
	}

	async create(payload: CreateMenuItemDto): Promise<MenuItem> {
		if (payload.price < 0) {
			throw new BadRequestException('Price cannot be negative');
		}

		const menuItem = this.menuItemRepo.create(payload);
		const saved = await this.menuItemRepo.save(menuItem);
		this.logger.log(`Menu item created: ${saved.id}`);
		await this.invalidateMenuCaches(saved.id);
		return saved;
	}

	async update(id: number, payload: UpdateMenuItemDto): Promise<MenuItem> {
		const menuItem = await this.findOne(id);

		if (payload.price !== undefined && payload.price < 0) {
			throw new BadRequestException('Price cannot be negative');
		}

		Object.assign(menuItem, payload);
		const saved = await this.menuItemRepo.save(menuItem);
		this.logger.log(`Menu item updated: ${saved.id}`);
		await this.invalidateMenuCaches(saved.id);
		return saved;
	}

	async remove(id: number): Promise<void> {
		const result = await this.menuItemRepo.delete(id);
		if (result.affected === 0) {
			throw new NotFoundException(`Menu item ${id} not found`);
		}
		this.logger.warn(`Menu item deleted: ${id}`);
		await this.invalidateMenuCaches(id);
	}

	async updateAvailability(id: number, isAvailable: boolean): Promise<MenuItem> {
		const menuItem = await this.findOne(id);
		menuItem.isAvailable = isAvailable;
		const saved = await this.menuItemRepo.save(menuItem);
		this.logger.log(`Menu item availability changed: ${saved.id} -> ${isAvailable}`);
		await this.invalidateMenuCaches(saved.id);
		return saved;
	}

	private getMenuItemCacheKey(id: number): string {
		return `menu_item_${id}`;
	}

	private async invalidateMenuCaches(menuItemId: number): Promise<void> {
		this.logger.log(`Invalidating menu caches for item ${menuItemId}`);
		await this.cacheManager.del('menu_all');
		await this.cacheManager.del(this.getMenuItemCacheKey(menuItemId));
	}
}
