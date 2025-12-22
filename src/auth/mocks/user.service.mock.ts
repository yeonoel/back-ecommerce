// test/mocks/users.service.mock.ts
import { mockAuthResponse } from '../fixtures/users.fixtures';

export const createMockUsersService = () => ({
  register: jest.fn().mockResolvedValue(mockAuthResponse),
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
  update: jest.fn().mockResolvedValue('User updated'),
  remove: jest.fn().mockResolvedValue('User removed')
});