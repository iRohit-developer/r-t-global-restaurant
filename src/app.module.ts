import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { CommonModule } from './common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'r&t-global-restaurant',
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60,
      max: 100,
    }),
    AuthModule, UsersModule, MenuModule, OrdersModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
