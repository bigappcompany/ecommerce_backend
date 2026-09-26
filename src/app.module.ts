import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './components/users/users.module';
import { AuthModule } from './components/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ShopModule } from './components/shop/shop.module';
import { MediaUploadsModule } from './components/media-uploads/media-uploads.module';

@Module({
  providers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    HttpModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ShopModule,
    MediaUploadsModule,
  ],
})
export class AppModule {}
