import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/Create-user.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from './enum/userRole.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));
describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const user1 = {
    id: '1',
    email: 'F4TQ5@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  } as User;

  const createUserDto: CreateUserDto = {
    email: 'F4TQ5@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  } ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_jwt_secret'),
          },
        }
      
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user1);
      
      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException)

      expect(service.register(createUserDto)).rejects.toThrow('User with this email already exists');
    });

    it('should hash password before saving new user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(user1);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user1)
      jest.spyOn(jwtService, 'sign').mockReturnValue('test_token');

      (bcrypt.hash as jest.Mock).mockResolvedValue('azzIiBU1224#IROIOJVOE');

      await service.register(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should return a JWT tokent after succesfull registration', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(user1);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user1);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-tokenazzIiBU1224#IROIOJVOE');

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register(createUserDto);

      expect(result.token).toBe('test-tokenazzIiBU1224#IROIOJVOE');
      expect(result.success).toBe(true);
      expect(jwtService.sign).toHaveBeenCalledWith({sub: user1.id, email: user1.email});
    });

    it('should create and save user with correct data', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const createUser = jest.spyOn(userRepository, 'create').mockReturnValue(user1);
      const saveUser = jest.spyOn(userRepository, 'save').mockResolvedValue(user1);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');
      
      (bcrypt.hash as jest.Mock).mockResolvedValue('azzIiBU1224#IROIOJVOE');

      await service.register(createUserDto);

      expect(createUser).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: 'azzIiBU1224#IROIOJVOE',
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        avatarUrl: createUserDto.avatarUrl,
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: false,
      });
      expect(saveUser).toHaveBeenCalled();
    });

    it('should return correct user data in response', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(user1);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user1);
      jest.spyOn(jwtService, 'sign').mockReturnValue('ferferfrefrtoken');

      (bcrypt.hash as jest.Mock).mockResolvedValue('azzIiBU1224#IROIOJVOE');

      const result = await service.register(createUserDto);

      expect(result.success).toBe(true);
      expect(result.token).toBe('ferferfrefrtoken');
      expect(result.data).toEqual({
        id: user1.id,
        email: user1.email,
        firstName: user1.firstName,
        lastName: user1.lastName,
      });
    })
  })
})

