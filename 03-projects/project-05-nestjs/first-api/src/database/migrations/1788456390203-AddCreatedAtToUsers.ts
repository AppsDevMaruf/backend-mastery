import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToUsers1788456390203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "created_at"
      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "created_at"
    `);
  }
}
