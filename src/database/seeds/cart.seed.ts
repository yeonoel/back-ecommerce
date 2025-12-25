import { DataSource } from 'typeorm';
import { Cart } from '../../carts/entities/cart.entity';
import { UserRole } from '../../users/enum/userRole.enum';
import { User } from '../../../src/users/entities/user.entity';

export async function seedCarts(ds: DataSource) {
  console.log('seedCarts loaded');

  const cartRepo = ds.getRepository(Cart);
  const userRepo = ds.getRepository(User);

  const users = await userRepo.find({ 
    where: { role: UserRole.CUSTOMER } 
  });
  
  if (users.length < 2) {
    throw new Error('Need at least 2 customer users for cart seeding');
  }

  // Vérifier et créer les paniers
  for (const user of [users[0], users[1]]) {
    const existingCart = await cartRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['user']
    });
    
    if (!existingCart) {
      await cartRepo.save({ user });
      console.log(`✅ Cart created for user "${user.email}"`);
    } else {
      console.log(`ℹ️  Cart already exists for user "${user.email}"`);
    }
  }

  return cartRepo.find();
}