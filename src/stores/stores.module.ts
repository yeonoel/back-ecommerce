import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { ShopInvitation } from 'src/shop-invitation/entities/shop-invitation.entity';
import { Store } from './entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, ShopInvitation, User])],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule { }
