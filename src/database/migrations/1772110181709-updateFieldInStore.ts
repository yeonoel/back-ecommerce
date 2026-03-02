import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFieldInStore1772110181709 implements MigrationInterface {
    name = 'UpdateFieldInStore1772110181709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" ADD "owner_id" uuid`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "owner_id"`);
    }

}
