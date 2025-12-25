import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Not, Repository } from 'typeorm';
import { ResponseDto } from '../common/dto/ResponseDto';
import { DataSource } from 'typeorm';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly dataSource: DataSource
  ) {}

  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const {isDefault} = createAddressDto;
      if(isDefault) {
        await manager.update(Address, {userId}, {isDefault: false});
      }
      const newAddress = manager.create(Address, {...createAddressDto, userId});
      const savedAddress = await manager.save(newAddress); 

      return {
        success: true,
        message: 'Address created successfully',
        data: savedAddress
      }
    });
  }

  findByUser(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
          where: {userId},
          order: {createdAt: 'DESC'}
    })
  }

  async updateAddress(userId: string, idAddress: string, updateAddressDto: UpdateAddressDto): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(Address, { where: { id: idAddress, userId } });
      if (!address) {
        throw new NotFoundException('Address not found');
      }
      const {isDefault} = updateAddressDto;
      if (isDefault) {
        await manager.update(Address, { userId} , {isDefault: false});
      }
      if (!isDefault && address.isDefault) {
        const otherAddress = await manager.findOne(Address, { where: {userId, id: Not(idAddress)} });
        if (otherAddress) {
          otherAddress.isDefault = true;
          await manager.save(otherAddress);
        }
      }
      await manager.update(Address, { id: idAddress }, {...updateAddressDto});
      return {
        success: true,
        message: 'Address deleted successfully',
        data: null,
      };
    });
  }

  async removeAddress(userId: string, idAddress: string): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(Address, { where: { id: idAddress, userId } });
      if (!address) {
        throw new NotFoundException('Address not found');
      }
      const wasDefault = address.isDefault;
      await manager.remove(Address, address);
      if (wasDefault) {
        const anotherAddress = await manager.findOne(Address, { where: { userId } });
        if (anotherAddress) {
          anotherAddress.isDefault = true;
          await manager.save(anotherAddress);
        }
      }

      return {
        success: true,
        message: 'Address deleted successfully',
        data: null,
      };
    });
  }
}
