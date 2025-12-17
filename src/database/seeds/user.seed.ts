import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const users = [
    {
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
    {
      email: 'john@test.com',
      password: await bcrypt.hash('password321', 10),
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
    },
    {
      email: 'jane@test.com',
      password: await bcrypt.hash('password213', 10),
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'customer',
    },
  ];

  for (const userData of users) {
    const existing = await userRepository.findOne({ 
      where: { email: userData.email } 
    });
    
    if (!existing) {
      await userRepository.save(userData);
      console.log(`✅ User "${userData.email}" created`);
    } else {
      console.log(`ℹ️  User "${userData.email}" already exists`);
    }
  }

  return userRepository.find();
}