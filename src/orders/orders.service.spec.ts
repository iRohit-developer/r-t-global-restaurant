import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { MenuService } from '../menu/menu.service';
import { InvalidOrderStatusException } from '../common/exceptions/invalid-order.exception';
import { Order, OrderStatus } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let menuService: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    orderRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    menuService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepo,
        },
        {
          provide: MenuService,
          useValue: menuService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an order with computed total amount', async () => {
    menuService.findOne.mockResolvedValue({
      id: 10,
      isAvailable: true,
      price: 25,
    });
    orderRepo.create.mockImplementation((payload) => ({ id: 100, ...payload }));
    orderRepo.save.mockImplementation(async (order) => order);

    const result = await service.create({
      tableNumber: 7,
      customerName: 'Alex',
      items: [{ menuItemId: 10, quantity: 2 }],
    });

    expect(result.totalAmount).toBe(50);
    expect(orderRepo.create).toHaveBeenCalled();
    expect(orderRepo.save).toHaveBeenCalled();
  });

  it('throws custom exception for non-cancellable status', async () => {
    orderRepo.findOneBy.mockResolvedValue({
      id: 4,
      status: OrderStatus.SERVED,
    });

    await expect(service.cancel(4)).rejects.toBeInstanceOf(InvalidOrderStatusException);
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('logs an error and rethrows when order save fails', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    menuService.findOne.mockResolvedValue({
      id: 10,
      isAvailable: true,
      price: 25,
    });
    orderRepo.create.mockImplementation((payload) => ({ id: 100, ...payload }));
    orderRepo.save.mockRejectedValue(new Error('db down'));

    await expect(
      service.create({
        tableNumber: 9,
        customerName: 'Jamie',
        items: [{ menuItemId: 10, quantity: 1 }],
      }),
    ).rejects.toThrow('db down');

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
