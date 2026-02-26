import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFieldShopInvitation1772105461778 implements MigrationInterface {
    name = 'UpdateFieldShopInvitation1772105461778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "address_type"`);
        await queryRunner.query(`DROP TYPE "public"."addresses_address_type_enum"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "is_default"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "street_address"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "apartment"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "postal_code"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "neighborhood" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "first_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "last_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."payments_payment_method_enum" RENAME TO "payments_payment_method_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('card', 'CASH')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "public"."payments_payment_method_enum" USING "payment_method"::"text"::"public"."payments_payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_payment_method_enum_old" AS ENUM('card', 'paypal')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "public"."payments_payment_method_enum_old" USING "payment_method"::"text"::"public"."payments_payment_method_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_payment_method_enum_old" RENAME TO "payments_payment_method_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "neighborhood"`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "country" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "postal_code" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "state" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "apartment" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "street_address" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "is_default" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."addresses_address_type_enum" AS ENUM('billing', 'shipping')`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD "address_type" "public"."addresses_address_type_enum" NOT NULL DEFAULT 'shipping'`);
    }

}
