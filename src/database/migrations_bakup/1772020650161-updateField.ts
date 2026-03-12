import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateField1772020650161 implements MigrationInterface {
    name = 'UpdateField1772020650161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop_invitations" ALTER COLUMN "temp_password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop_invitations" ALTER COLUMN "temp_password" SET NOT NULL`);
    }

}
