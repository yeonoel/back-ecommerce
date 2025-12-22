// test/fixtures/users.fixtures.ts

import { UsersResponseDto } from "../dto/Users-response";
import { CreateUserDto } from "../dto/Create-user.dto";

export const buildUserDto = () => ({
  email: `test${Date.now()}${Math.random()}@example.com`,
  password: 'Test12',
  firstName: 'Test',
  lastName: 'User',
});



export const mockCreateUserDto: CreateUserDto = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: undefined,
  avatarUrl: undefined
};

export const mockCreateUserDtoWithOptional: CreateUserDto = {
  email: 'test2@example.com',
  password: 'password456',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+1234567890',
  avatarUrl: 'https://example.com/avatar.jpg'
};

export const mockAuthResponse: UsersResponseDto = {
  success: true,
  data: {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  },
  token: 'jwt-token-here'
};

export const mockAuthResponseWithOptional: UsersResponseDto = {
  success: true,
  data: {
    id: '2',
    email: 'test2@example.com',
    firstName: 'Jane',
    lastName: 'Smith'
  },
  token: 'another-jwt-token'
};

// Pour les cas d'erreur
export const duplicateEmailDto: CreateUserDto = {
  email: 'existing@example.com',
  password: 'password123',
  firstName: 'Existing',
  lastName: 'User'
};