import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityPaymentsAndOrderfields1768677808972 implements MigrationInterface {
    name = 'FixEntityPaymentsAndOrderfields1768677808972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentProvider"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "transactionId"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('card', 'paypal', 'bank_transfer')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "payment_method" "public"."payments_payment_method_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "payment_provider" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "transaction_id" character varying(255)`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_status"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_status"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_orders_status"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_status"`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_status" character varying(50) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "status" character varying(50) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders" ("status") `);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "transaction_id"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payment_provider"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payment_method"`);
        await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "transactionId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "paymentProvider" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "paymentMethod" character varying(50) NOT NULL`);
    }

}
