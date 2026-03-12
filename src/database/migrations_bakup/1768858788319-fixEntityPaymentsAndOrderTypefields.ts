import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityPaymentsAndOrderTypefields1768858788319 implements MigrationInterface {
    name = 'FixEntityPaymentsAndOrderTypefields1768858788319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "reserved_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "reserved_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_currency_enum" AS ENUM('USD', 'EUR', 'XOF')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "currency" "public"."payments_currency_enum" NOT NULL DEFAULT 'EUR'`);
        await queryRunner.query(`ALTER TYPE "public"."payments_payment_method_enum" RENAME TO "payments_payment_method_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('card', 'paypal')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "public"."payments_payment_method_enum" USING "payment_method"::"text"::"public"."payments_payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum_old"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_status"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending_payment', 'requires_action', 'paid', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending_payment'`);
        await queryRunner.query(`ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'expired', 'processing', 'shipped', 'delivered', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::"text"::"public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_payment_status_enum" RENAME TO "orders_payment_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('pending_payment', 'requires_action', 'paid', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "public"."orders_payment_status_enum" USING "payment_status"::"text"::"public"."orders_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending_payment'`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_payments_status"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_status_enum_old" AS ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "public"."orders_payment_status_enum_old" USING "payment_status"::"text"::"public"."orders_payment_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_payment_status_enum_old" RENAME TO "orders_payment_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum_old" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_status_enum_old" RENAME TO "orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "status" character varying(50) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_payment_method_enum_old" AS ENUM('card', 'paypal', 'bank_transfer')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "public"."payments_payment_method_enum_old" USING "payment_method"::"text"::"public"."payments_payment_method_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_payment_method_enum_old" RENAME TO "payments_payment_method_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "currency"`);
        await queryRunner.query(`DROP TYPE "public"."payments_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "currency" character varying(3) NOT NULL DEFAULT 'EUR'`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "reserved_quantity"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "reserved_quantity"`);
    }

}
