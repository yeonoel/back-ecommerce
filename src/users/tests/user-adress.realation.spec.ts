import { Repository } from "typeorm"
import { User } from "../entities/user.entity";
import { Address } from "../../addresses/entities/address.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { testDbConfig } from "../../../test/test-db.config";
import { AddressType } from "../../addresses/enums/address-type.enum";

describe('User - Address relation', () => {
    let userRepository: Repository<User>;
    let addressRepository: Repository<Address>;
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDbConfig),
                TypeOrmModule.forFeature([User, Address]),
            ],
        }).compile();

        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        addressRepository = module.get<Repository<Address>>(getRepositoryToken(Address));
    }, 30000);

    afterEach(async () => {
        const addresses = await addressRepository.find();
        if (addresses.length > 0) {
            await addressRepository.remove(addresses);
        }
        const users = await userRepository.find();
        if (users.length > 0) {
            await userRepository.remove(users);
        }
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    const createTestUser = async () => {
        return await userRepository.save(
            userRepository.create({
                email: `test-${Date.now()}@gmail.com`,
                password: 'testPassword',
                firstName: 'Test',
                lastName: 'User',
            })
        );
    };

    describe('create addresses', () => {
            it('should create a user with an address', async () => {
                // Arrange
                const user = await createTestUser();

                // Act
                const address = await addressRepository.save(
                    addressRepository.create({
                        user: user,
                        addressType: AddressType.SHIPPING,
                        isDefault: true,
                        streetAddress: '123 Test St',
                        apartment: 'Apt 1',
                        city: 'Test City',
                        state: 'Test State',
                        postalCode: '12345',
                        country: 'Test Country',
                    })
                );

                // Assert
                const result = await userRepository.findOne({
                    where: { id: user.id },
                    relations: ['addresses'],
                });

                expect(result?.addresses).toHaveLength(1);
                expect(result?.addresses[0].streetAddress).toBe('123 Test St');
                expect(result?.addresses[0].userId).toBe(user.id);
        
        
            });

            it('should allow a user to have multiple addresses', async () => {
                // Arrange
                const user = await createTestUser();
        
                // Act
                const address1 = await addressRepository.save(
                    addressRepository.create({
                        user: user,
                        addressType: AddressType.SHIPPING,
                        isDefault: true,
                        streetAddress: '123 Test St',
                        apartment: 'Apt 1',
                        city: 'Test City',
                        state: 'Test State',
                        postalCode: '12345',
                        country: 'Test Country',
                    })
                );
        
                const address2 = await addressRepository.save(
                    addressRepository.create({
                        user: user,
                        addressType: AddressType.BILLING,
                        isDefault: false,
                        streetAddress: '456 Another St',
                        apartment: 'Apt 2',
                        city: 'Another City',
                        state: 'Another State',
                        postalCode: '67890',
                        country: 'Another Country',
                    })
                );

                // Assert
                const result = await userRepository.findOne({
                    where: { id: user.id },
                    relations: ['addresses'],
                });

                expect(result?.addresses).toHaveLength(2);
            });
    });

    describe('Deleting users', () => {
        it('should cascade delete addresses when user is deleted', async () => {
            // Arrange
            const user = await createTestUser();
            await addressRepository.save(
                addressRepository.create({
                    user,
                    streetAddress: '123 Main St',
                    addressType: AddressType.BILLING,
                    city: 'Anytown',
                    postalCode: '12345',
                    country: 'USA',
                })
            );

            // Act
            await userRepository.remove(user);

            // Assert
            const addresses = await addressRepository.find({
                where: { userId: user.id },
            });

            expect(addresses).toHaveLength(0);
        });
    });
});