import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { MenuCategory } from '../src/menu/entities/menu.entity';
import { OrderStatus } from '../src/orders/entities/order.entity';

const getStringProperty = (body: unknown, key: string): string => {
  if (typeof body !== 'object' || body === null) {
    throw new Error(`Expected response body object with ${key}`);
  }

  const value = body[key as keyof typeof body];

  if (typeof value !== 'string') {
    throw new Error(`Expected ${key} to be a string`);
  }

  return value;
};

const getNumberProperty = (body: unknown, key: string): number => {
  if (typeof body !== 'object' || body === null) {
    throw new Error(`Expected response body object with ${key}`);
  }

  const value = body[key as keyof typeof body];

  if (typeof value !== 'number') {
    throw new Error(`Expected ${key} to be a number`);
  }

  return value;
};

const getBooleanProperty = (body: unknown, key: string): boolean => {
  if (typeof body !== 'object' || body === null) {
    throw new Error(`Expected response body object with ${key}`);
  }

  const value = body[key as keyof typeof body];

  if (typeof value !== 'boolean') {
    throw new Error(`Expected ${key} to be a boolean`);
  }

  return value;
};

describe('Restaurant System (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let staffToken: string;
  let cacheManager: {
    get: (key: string) => Promise<unknown>;
    clear?: () => Promise<void>;
  };
  let usernameCounter = 0;

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  const nextUsername = (prefix: string): string => {
    usernameCounter += 1;
    return `${prefix}-${Date.now()}-${usernameCounter}`;
  };

  const ensureTestUser = async (username: string, password: string, role: 'admin' | 'staff') => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, password, role });

    if (![201, 409].includes(response.status)) {
      throw new Error(`Failed to ensure test user ${username}: ${response.status}`);
    }
  };

  const createMenuItem = async (overrides?: Partial<{ name: string; category: MenuCategory; price: number }>) => {
    const response = await request(app.getHttpServer())
      .post('/menu')
      .set(authHeader(adminToken))
      .send({
        name: 'Soup',
        category: MenuCategory.STARTER,
        price: 8,
        ...overrides,
      })
      .expect(201);

    return getNumberProperty(response.body, 'id');
  };

  beforeAll(async () => {
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ?? '5432';
    process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'password';
    process.env.DB_NAME = process.env.DB_NAME ?? 'r&t-global-restaurant';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    cacheManager = app.get(CACHE_MANAGER);
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE "order_items", "orders", "menu_items" RESTART IDENTITY CASCADE',
    );
    await cacheManager.clear?.();

    await ensureTestUser('admin', 'admin123', 'admin');
    await ensureTestUser('staff', 'staff123', 'staff');

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);
    adminToken = getStringProperty(adminLogin.body, 'access_token');

    const staffLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'staff', password: 'staff123' })
      .expect(201);
    staffToken = getStringProperty(staffLogin.body, 'access_token');
  });

  it('returns the health greeting', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('registers a user and returns a login token', async () => {
    const username = nextUsername('staff-user');

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username,
        password: 'secure123',
      })
      .expect(201);

    expect(getStringProperty(response.body, 'access_token')).toBeTruthy();
    expect(response.body.user).toMatchObject({
      username,
      role: 'staff',
    });
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('rejects invalid auth requests', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'ab',
        password: '123',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpass',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
        extraField: true,
      })
      .expect(400);

    const duplicateUsername = nextUsername('duplicate-user');

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: duplicateUsername,
        password: 'secure123',
        role: 'admin',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: duplicateUsername,
        password: 'secure123',
        role: 'admin',
      })
      .expect(409);
  });

  it('enforces authentication and role guards on protected routes', async () => {
    return request(app.getHttpServer())
      .post('/menu')
      .send({ name: 'Soup', price: 8 })
      .expect(401);

    await request(app.getHttpServer())
      .post('/menu')
      .set(authHeader(staffToken))
      .send({
        name: 'Soup',
        category: MenuCategory.STARTER,
        price: 8,
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/orders')
      .set(authHeader(adminToken))
      .send({
        tableNumber: 7,
        customerName: 'Admin Should Fail',
        items: [{ menuItemId: 1, quantity: 1 }],
      })
      .expect(403);
  });

  it('supports menu CRUD and availability management', async () => {
    const id = await createMenuItem();

    await request(app.getHttpServer())
      .get('/menu')
      .set(authHeader(staffToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id,
              name: 'Soup',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get(`/menu/${id}`)
      .set(authHeader(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id,
          name: 'Soup',
          category: MenuCategory.STARTER,
          price: 8,
          isAvailable: true,
        });
      });

    expect(await cacheManager.get(`menu_item_${id}`)).toEqual(
      expect.objectContaining({
        id,
        name: 'Soup',
        category: MenuCategory.STARTER,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/menu/${id}`)
      .set(authHeader(adminToken))
      .send({
        price: 10,
        name: 'Tomato Soup',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id,
          name: 'Tomato Soup',
          price: 10,
        });
      });

    await request(app.getHttpServer())
      .get(`/menu/${id}`)
      .set(authHeader(adminToken))
      .expect(200);

    expect(await cacheManager.get(`menu_item_${id}`)).toEqual(
      expect.objectContaining({
        id,
        name: 'Tomato Soup',
        price: 10,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/menu/${id}/unavailable`)
      .set(authHeader(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(getBooleanProperty(body, 'isAvailable')).toBe(false);
      });

    expect(await cacheManager.get(`menu_item_${id}`)).toBeUndefined();

    await request(app.getHttpServer())
      .post('/menu')
      .set(authHeader(adminToken))
      .send({
        name: 'Broken Soup',
        category: MenuCategory.STARTER,
        price: -1,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/menu')
      .set(authHeader(adminToken))
      .send({
        name: 'Soup',
        category: MenuCategory.STARTER,
        price: 8,
        isAvailable: true,
        unexpected: 'value',
      })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/menu/${id}`)
      .set(authHeader(adminToken))
      .expect(200)
      .expect({ message: `Menu item ${id} deleted` });

    expect(await cacheManager.get(`menu_item_${id}`)).toBeUndefined();

    await request(app.getHttpServer())
      .get(`/menu/${id}`)
      .set(authHeader(adminToken))
      .expect(404);
  });

  it('keeps menu list cache coherent after writes', async () => {
    const initialMenuId = await createMenuItem({
      name: 'Salad',
      category: MenuCategory.STARTER,
      price: 7,
    });

    await request(app.getHttpServer())
      .get('/menu')
      .set(authHeader(staffToken))
      .expect(200);

    expect(await cacheManager.get('menu_all')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: initialMenuId, name: 'Salad' }),
      ]),
    );

    const createdMenuId = await createMenuItem({
      name: 'Burger',
      category: MenuCategory.MAIN,
      price: 15,
    });

    expect(await cacheManager.get('menu_all')).toBeUndefined();

    await request(app.getHttpServer())
      .get('/menu')
      .set(authHeader(staffToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: initialMenuId, name: 'Salad' }),
            expect.objectContaining({ id: createdMenuId, name: 'Burger' }),
          ]),
        );
      });

    expect(await cacheManager.get('menu_all')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createdMenuId, name: 'Burger' }),
      ]),
    );
  });

  it('supports order lifecycle operations across roles', async () => {
    const menuItemId = await createMenuItem({
      name: 'Pasta',
      category: MenuCategory.MAIN,
      price: 12,
    });

    const createOrderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set(authHeader(staffToken))
      .send({
        tableNumber: 5,
        customerName: 'Taylor',
        items: [{ menuItemId, quantity: 2 }],
      })
      .expect(201);

    const orderId = getNumberProperty(createOrderResponse.body, 'id');
    expect(createOrderResponse.body).toMatchObject({
      id: orderId,
      tableNumber: 5,
      customerName: 'Taylor',
      status: OrderStatus.PENDING,
      totalAmount: 24,
      items: [
        expect.objectContaining({
          menuItemId,
          quantity: 2,
          price: 12,
        }),
      ],
    });
    expect(createOrderResponse.body.items).toHaveLength(1);
    expect(createOrderResponse.body.items[0]).toEqual(
      expect.objectContaining({
        orderId,
        menuItemId,
        quantity: 2,
        price: 12,
      }),
    );

    await request(app.getHttpServer())
      .get('/orders')
      .set(authHeader(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: orderId,
              status: OrderStatus.PENDING,
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get(`/orders/${orderId}`)
      .set(authHeader(staffToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: orderId,
          totalAmount: 24,
        });
      });

    await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: OrderStatus.PREPARING })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: orderId,
          status: OrderStatus.PREPARING,
        });
      });

    await request(app.getHttpServer())
      .patch(`/orders/${orderId}/cancel`)
      .set(authHeader(staffToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: orderId,
          status: OrderStatus.CANCELLED,
        });
      });
  });

  it('rejects invalid or unavailable order operations', async () => {
    const menuItemId = await createMenuItem({
      name: 'Cake',
      category: MenuCategory.DESSERT,
      price: 6,
    });

    await request(app.getHttpServer())
      .patch(`/menu/${menuItemId}/unavailable`)
      .set(authHeader(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .post('/orders')
      .set(authHeader(staffToken))
      .send({
        tableNumber: 2,
        customerName: 'Jordan',
        items: [{ menuItemId, quantity: 1 }],
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toContain(`Menu item ${menuItemId} is currently unavailable`);
      });

    const availableMenuItemId = await createMenuItem({
      name: 'Juice',
      category: MenuCategory.DRINK,
      price: 4,
    });

    const servedOrderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set(authHeader(staffToken))
      .send({
        tableNumber: 3,
        customerName: 'Morgan',
        items: [{ menuItemId: availableMenuItemId, quantity: 1 }],
      })
      .expect(201);

    const servedOrderId = getNumberProperty(servedOrderResponse.body, 'id');

    await request(app.getHttpServer())
      .patch(`/orders/${servedOrderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: OrderStatus.SERVED })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/orders/${servedOrderId}/cancel`)
      .set(authHeader(staffToken))
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe('Cannot cancel a served order');
      });

    await request(app.getHttpServer())
      .patch(`/orders/${servedOrderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'done' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/orders')
      .set(authHeader(staffToken))
      .send({
        tableNumber: 4,
        customerName: 'Casey',
        items: [{ menuItemId: availableMenuItemId, quantity: 1, note: 'extra' }],
      })
      .expect(400);

    await request(app.getHttpServer())
      .get('/orders/9999')
      .set(authHeader(adminToken))
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
