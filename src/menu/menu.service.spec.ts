import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MenuCategory, MenuItem } from './entities/menu.entity';

describe('MenuService', () => {
  let service: MenuService;
  let repo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
  };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(MenuItem),
          useValue: repo,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns cached menu item on cache hit', async () => {
    const cachedItem = {
      id: 1,
      name: 'Soup',
      category: MenuCategory.STARTER,
      price: 8,
      isAvailable: true,
    } as MenuItem;

    cache.get.mockResolvedValue(cachedItem);

    const result = await service.findOne(1);

    expect(result).toEqual(cachedItem);
    expect(repo.findOneBy).not.toHaveBeenCalled();
  });

  it('invalidates list and item caches on update', async () => {
    const existing = {
      id: 2,
      name: 'Pasta',
      category: MenuCategory.MAIN,
      price: 18,
      isAvailable: true,
    } as MenuItem;
    const updated = { ...existing, price: 20 };

    cache.get.mockResolvedValue(undefined);
    repo.findOneBy.mockResolvedValue(existing);
    repo.save.mockResolvedValue(updated);

    const result = await service.update(2, { price: 20 });

    expect(result.price).toBe(20);
    expect(cache.del).toHaveBeenCalledWith('menu_all');
    expect(cache.del).toHaveBeenCalledWith('menu_item_2');
  });
});
