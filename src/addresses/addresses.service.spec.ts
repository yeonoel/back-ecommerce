import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { MockDataSource } from '../common/tests/mocks/mocksRepository';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';

describe('AddressesService', () => {
  let service: AddressesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getRepositoryToken(Address),
          useValue: {}
        },
        {
          provide: DataSource,
          useValue: MockDataSource
        } 
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
