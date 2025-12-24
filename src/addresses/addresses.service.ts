import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { RemoveAddressResponseDto } from './dto/RemoveAddressResponseDto';
import { ResponseDto } from 'src/common/dto/ResponseDto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>  
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<ResponseDto> {
    const newAddress = this.addressRepository.create({
      ...createAddressDto,
      userId
    });
    await this.addressRepository.save(newAddress);
    return {
      success: true,
      message: 'Address created successfully',
      data: newAddress
    }
  }

  findByUser(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
          where: {userId},
          order: {createdAt: 'DESC'}
    })
  }

  async updateAdress(userId: string, idAddress: string, updateAddressDto: UpdateAddressDto): Promise<ResponseDto> {
    const address = await this.addressRepository.findOne({ where: { id: idAddress, userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    Object.assign(address, updateAddressDto);
    await this.addressRepository.save(address);
    return {
      success: true,
      message: 'Address updated successfully',
      data: address
    }
  }

  async removeAdress(userId: string, idAddress: string): Promise<ResponseDto> {
    const address = await this.addressRepository.findOne({ where: { id: idAddress, userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    await this.addressRepository.remove(address);
    return {
      success: true,
      message: 'Address deleted successfully',
      data: null
    };
  }
}
