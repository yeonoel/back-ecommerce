import { MigrationInterface, QueryRunner } from "typeorm";

export class AddisDeletedField1770652470559 implements MigrationInterface {
    name = 'AddisDeletedField1770652470559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

}
