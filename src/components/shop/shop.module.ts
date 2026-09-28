import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ShopOrder } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ApiCredential } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyGuard, OptionalApiKeyGuard } from './api-key.guard';
import { ShopSeedService } from './shop-seed.service';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Cart,
      CartItem,
      ShopOrder,
      OrderItem,
      ApiCredential,
      User,
    ]),
  ],
  controllers: [
    ProductsController,
    CartController,
    OrdersController,
    ApiKeysController,
    IntegrationsController,
  ],
  providers: [
    ProductsService,
    CartService,
    OrdersService,
    ApiKeysService,
    ApiKeyGuard,
    OptionalApiKeyGuard,
    ShopSeedService,
    RolesGuard,
  ],
})
export class ShopModule {}
