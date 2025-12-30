import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteSlugLenght1766846554745 implements MigrationInterface {
    name = 'DeleteSlugLenght1766846554745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "products" 
            ALTER COLUMN "slug" TYPE VARCHAR
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "products" 
            ALTER COLUMN "slug" TYPE VARCHAR(255)
        `);
    }

}
