import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeEnumTableAddress1765993160156 implements MigrationInterface {
    name = 'AddTypeEnumTableAddress1765993160156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "address_type"`);
        await queryRunner.query(`CREATE TYPE "public"."addresses_address_type_enum" AS ENUM('billing', 'shipping')`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "address_type" "public"."addresses_address_type_enum" NOT NULL DEFAULT 'shipping'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "address_type"`);
        await queryRunner.query(`DROP TYPE "public"."addresses_address_type_enum"`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "address_type" character varying(20) NOT NULL`);
    }

}
