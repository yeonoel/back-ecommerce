// test/fixtures/users.fixtures.ts

import { Auth } from "typeorm";
import { RegisterDto } from "../dto/Register.dto";
import { AuthResponseDto } from "../dto/Users-response";

export const buildUserDto = () => ({
  email: `test${Date.now()}${Math.random()}@example.com`,
  password: 'Test12',
  firstName: 'Test',
  lastName: 'User',
});



export const mockCreateUserDto: RegisterDto = {
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+2254567890',
  storeSlug: 'test-store',
  avatarUrl: undefined
};

export const mockCreateUserDtoWithOptional: RegisterDto = {
  password: 'password456',
  firstName: 'Jane',
  storeSlug: 'test-store',
  lastName: 'Smith',
  phone: '+1234567890',
  avatarUrl: 'https://example.com/avatar.jpg'
};

export const mockAuthResponse: AuthResponseDto = {
  success: true,
  data: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890'
  },
  token: 'jwt-token-here'
};

export const mockAuthResponseWithOptional: AuthResponseDto = {
  success: true,
  data: {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+9876543210'
  },
  token: 'another-jwt-token'
};

// Pour les cas d'erreur
export const duplicateEmailDto: RegisterDto = {
  phone: '+225056540003',
  storeSlug: 'test-store',
  password: 'password123',
  firstName: 'Existing',
  lastName: 'User'
};