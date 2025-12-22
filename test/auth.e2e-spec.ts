import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { buildUserDto } from "../src/auth/fixtures/users.fixtures";
import { User } from "../src/auth/entities/user.entity";
import { getRepositoryToken, } from "@nestjs/typeorm";
import { TestAppModule } from "./test-app.module";

const request = require('supertest');
describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/');
    await app.init();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });


  describe('POST /api/auth/register', () => {
    it('should return 201 and create a new user', async () => {
        const userDto = buildUserDto();

        const response = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send(userDto)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(userDto.email);
        expect(response.body.token).toBeDefined();
        
    });

     it('should return 409 if email already exists', async () => {
         const userDto = buildUserDto();

         const userSave = await request(app.getHttpServer())
             .post('/api/auth/register')
             .send(userDto)
             .expect(201);

       // Deuxième tentative avec le même email
         const response = await request(app.getHttpServer())
             .post('/api/auth/register')
             .send(userDto)
             .expect(409);

         expect(response.body.message).toContain('email already exists');
     });

      it('should hash password before storing in database', async () => {
          const userDto = buildUserDto();

          const response = await request(app.getHttpServer())
              .post('/api/auth/register')
              .send(userDto)
              .expect(201);

              const nestUser = await userRepository.findOne({
                  where: { email: userDto.email },
              });

          expect(nestUser?.password).not.toBe(userDto.password);
          expect(nestUser?.password.length).toBeGreaterThan(20); 
      });


     it('should return 400 if email is invalid', async () => {
        const userDto = buildUserDto();
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ ...userDto, email: 'mo-nmail'})
          .expect(400);

          expect(response.body.message[0]).toContain('email');
      });

     it('should return 400 if password is too short', async () => {
       const userDto = buildUserDto();
       const response = await request(app.getHttpServer())
         .post('/api/auth/register')
         .send({ ...userDto, password: 'MDP'})
         .expect(400);

         expect(response.body.message[0]).toContain('password');
     })

     it('should return 400 if required fields are missing', async () => {
       return await request(app.getHttpServer())
         .post('/api/auth/register')
         .send({ email: 'test@example.com' })
         .expect(400);
     });

     it('should return 400 if phone format is invalid', async() => {
        const userDto = buildUserDto();
        return await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ ...userDto, phone: 'invalid' })
          .expect(400);
        });
  });
});