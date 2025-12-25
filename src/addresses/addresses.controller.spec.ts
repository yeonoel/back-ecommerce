import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { DataSource } from 'typeorm';
import { MockDataSource, MockRepository } from '../common/tests/mocks/mocksRepository';
import { before } from 'node:test';

describe('AddressesController', () => {
  let controller: AddressesController;
  let service: AddressesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        AddressesService,
        {
          provide: getRepositoryToken(Address),
          useValue: MockRepository
        },
        {
          provide: DataSource,
          useValue: MockDataSource
        }
      ],
    }).compile();
    controller = module.get<AddressesController>(AddressesController);
    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
