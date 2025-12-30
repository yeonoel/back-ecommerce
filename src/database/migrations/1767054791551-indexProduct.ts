import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexProduct1767054791551 implements MigrationInterface {
    name = 'IndexProduct1767054791551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_products_category_id"`);
        await queryRunner.query(`CREATE INDEX "idx_products_category" ON "products" ("category_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_products_category"`);
        await queryRunner.query(`CREATE INDEX "idx_products_category_id" ON "products" ("category_id") `);
    }

}
