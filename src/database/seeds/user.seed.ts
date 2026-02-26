import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../users/enum/userRole.enum';
import { User } from '../../../src/users/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const users = [
    {
      password: await bcrypt.hash('password123', 10),
      firstName: 'super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      phone: '+2250565676413',

    }
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