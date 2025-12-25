import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueNameCategorie1766594222971 implements MigrationInterface {
    name = 'AddUniqueNameCategorie1766594222971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878"`);
    }

}
