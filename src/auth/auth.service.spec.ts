import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterDto } from './dto/Register.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/userRole.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersService: UsersService;

  const mockUser = {
    id: "1",
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    isActive: true,
    emailVerified: false,
  } as User;

  const registerDto: RegisterDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatarUrl: 'http://example.com/avatar.jpg'
    
  };

  const registerDtoWithoutPhone: RegisterDto = {
    email: 'test2@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          }
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_jwt_secret'),
          },
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)

      // Act 
        const registerPromise = service.register(registerDto);
      // Assert
      await expect(registerPromise).rejects.toThrow(ConflictException);
      await expect(registerPromise).rejects.toThrow('email already exists');
    });

    it('should throw ConflictException if phone already exists', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Act
      const registerPromise = service.register(registerDto); 

      //Assert
      await expect(registerPromise).rejects.toThrow(ConflictException);
      await expect(registerPromise).rejects.toThrow('phone already exists');
    });

    it('should not check phone if phone is not provided', async () => {
      // Arrange
      const findOneSpy = jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      // Act
      await service.register(registerDtoWithoutPhone);

      // Assert
      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({ where: { email: registerDtoWithoutPhone.email }});
    });

    it('should hash password before saving new user', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const hashedPassword = 'azzIiBU1224#IROIOJVOE';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Act
      await service.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should create user with correct data and call login', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const createSpy = jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      const saveSpy = jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      
      const hashedPassword = 'azzIiBU1224#IROIOJVOE';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Mock de la méthode login
      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue({
        success: true,
        data: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        },
        token: 'mock-jwt-token'
      });

      // Act
      await service.register(registerDto);

      // Assert
      expect(createSpy).toHaveBeenCalledWith({
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        avatarUrl: registerDto.avatarUrl,
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: false,
      });
      
      // Vérifie que login est appelé avec le user créé
      expect(loginSpy).toHaveBeenCalledWith(mockUser);
    });

    it('should return JWT token after successful registration', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      jest.spyOn(service, 'login').mockResolvedValue({
        success: true,
        data: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        },
        token: 'test-jwt-token'
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.token).toBe('test-jwt-token');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName
      });
    });
  });

  describe('login', () => {
    const userToLogin = {
      ...mockUser,
      lastLoginAt: new Date(),
    } as User;

    it('should update lastLoginAt and save user', async () => {
      // Arrange
      const user = jest.spyOn(userRepository, 'save').mockResolvedValue(userToLogin);

      // Act
      await service.login(userToLogin);

      // Assert
      expect(user).toHaveBeenCalledWith(userToLogin);
      expect(userToLogin.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should generate JWT token with correct payload', async () => {
      // Arrange
      jest.spyOn(userRepository, 'save').mockResolvedValue(userToLogin);

      // Act
      await service.login(userToLogin);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: userToLogin.id,
        email: userToLogin.email,
        role: userToLogin.role
      });
    });

    it('should return correct AuthResponseDto', async () => {
      // Arrange
      jest.spyOn(userRepository, 'save').mockResolvedValue(userToLogin);

      // Act
      const result = await service.login(userToLogin);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.data).toEqual({
        id: userToLogin.id,
        email: userToLogin.email,
        firstName: userToLogin.firstName,
        lastName: userToLogin.lastName
      });
    });

  });

  describe('buildAuthResponse (private method)', () => {
    it('should return correct response structure', async () => {
      // On ne peut pas tester directement une méthode privée
      // Mais on peut tester son comportement à travers login
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('email');
      expect(result.data).toHaveProperty('firstName');
      expect(result.data).toHaveProperty('lastName');
    });
  });
});