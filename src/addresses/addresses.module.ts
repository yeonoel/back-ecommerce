import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
        TypeOrmModule.forFeature([Address]),
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService]
})
export class AddressesModule {}
