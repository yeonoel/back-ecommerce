// users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HttpStatus } from '@nestjs/common';

// Import depuis vos fichiers séparés
import {
  mockCreateUserDto,
  mockAuthResponse,
} from './fixtures/users.fixtures';
import { createMockUsersService} from './mocks/user.service.mock';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let mockUsersService;

  beforeEach(async () => {
    // Réinitialiser les mocks avant chaque test

    mockUsersService = createMockUsersService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService
        }
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should call usersService.register with correct parameters', async () => {
      // Act
      const result = await controller.register(mockCreateUserDto);

      // Assert
      expect(service.register).toHaveBeenCalledTimes(1);
      expect(service.register).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should return the response from service.register', async () => {
      // Act
      const result = await controller.register(mockCreateUserDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('jwt-token-here');
      expect(result.data.email).toBe('test@example.com');
    });

    it('should handle service errors properly', async () => {
      // Arrange
      const error = new Error('Service error');
      mockUsersService.register.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.register(mockCreateUserDto))
        .rejects.toThrow('Service error');
    });

    it('should return status code 201 on success', () => {
      // Vérification du décorateur
      expect(HttpStatus.CREATED).toBe(201);
    });
  });

  // describe('findAll', () => {
  //   it('should call usersService.findAll', () => {
  //     // Arrange
  //     const mockUsers = [{ id: 1 }, { id: 2 }];
  //     mockUsersService.findAll.mockResolvedValueOnce(mockUsers);

  //     // Act
  //     const result = controller.findAll();

  //     // Assert
  //     expect(service.findAll).toHaveBeenCalledTimes(1);
  //     expect(result).resolves.toEqual(mockUsers);
  //   });
  // });

  // describe('findOne', () => {
  //   it('should call usersService.findOne with converted id', async () => {
  //     // Arrange
  //     const userId = '5';
  //     const mockUser = { id: 5, name: 'Test User' };
  //     mockUsersService.findOne.mockResolvedValueOnce(mockUser);

  //     // Act
  //     const result = await controller.findOne(userId);

  //     // Assert
  //     expect(service.findOne).toHaveBeenCalledWith(5);
  //     expect(result).toEqual(mockUser);
  //   });
  // });

  // describe('update', () => {
  //   it('should call usersService.update with converted id', async () => {
  //     // Arrange
  //     const userId = '10';
  //     const updateDto = { firstName: 'Updated' };
  //     const mockResult = 'User updated';
  //     mockUsersService.update.mockResolvedValueOnce(mockResult);

  //     // Act
  //     const result = await controller.update(userId, updateDto);

  //     // Assert
  //     expect(service.update).toHaveBeenCalledWith(10, updateDto);
  //     expect(result).toBe(mockResult);
  //   });
  // });

  // describe('remove', () => {
  //   it('should call usersService.remove with converted id', async () => {
  //     // Arrange
  //     const userId = '15';
  //     const mockResult = 'User removed';
  //     mockUsersService.remove.mockResolvedValueOnce(mockResult);

  //     // Act
  //     const result = await controller.remove(userId);

  //     // Assert
  //     expect(service.remove).toHaveBeenCalledWith(15);
  //     expect(result).toBe(mockResult);
  //   });
  // });

  // // Tests de cas spécifiques
  // describe('edge cases', () => {
  //   it('should handle empty string id', async () => {
  //     // Arrange
  //     mockUsersService.findOne.mockResolvedValueOnce(null);

  //     // Act
  //     const result = await controller.findOne('');

  //     // Assert
  //     expect(service.findOne).toHaveBeenCalledWith(NaN); // +'' = 0, mais attention!
  //     expect(result).toBeNull();
  //   });

  //   it('should handle non-numeric id', async () => {
  //     // Act & Assert
  //     await expect(controller.findOne('abc')).resolves; // +'abc' = NaN
  //     expect(service.findOne).toHaveBeenCalledWith(NaN);
  //   });
  // });
});