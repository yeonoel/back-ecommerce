import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsersColumn1765917272268 implements MigrationInterface {
    name = 'UpdateUsersColumn1765917272268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password_hash" TO "password"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash"`);
    }

}
