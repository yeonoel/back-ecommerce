import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../users/enum/userRole.enum';
import { User } from '../../../src/users/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const users = [
    {
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
    {
      phone: '2250565676413',
      password: await bcrypt.hash('password321', 10),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
    },
    {
      phone: '2250565676413',
      password: await bcrypt.hash('password213', 10),
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
    },
  ];

  for (const userData of users) {
    const existing = await userRepository.findOne({
      where: { phone: userData.phone }
    });

    if (!existing) {
      await userRepository.save(userData);
      console.log(`✅ User "${userData.phone}" created`);
    } else {
      console.log(`ℹ️  User "${userData.phone}" already exists`);
    }
  }

  return userRepository.find();
}