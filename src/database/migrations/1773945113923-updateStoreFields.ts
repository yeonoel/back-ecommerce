import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStoreFields1773945113923 implements MigrationInterface {
    name = 'UpdateStoreFields1773945113923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418"`);
        await queryRunner.query(`ALTER TABLE "shop_invitations" DROP CONSTRAINT "FK_2b3faca6fe9f7c6d5e356828b26"`);
        await queryRunner.query(`ALTER TABLE "shop_invitations" DROP COLUMN "store_id"`);
        await queryRunner.query(`ALTER TABLE "stores" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418"`);
        await queryRunner.query(`ALTER TABLE "stores" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shop_invitations" ADD "store_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shop_invitations" ADD CONSTRAINT "FK_2b3faca6fe9f7c6d5e356828b26" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
