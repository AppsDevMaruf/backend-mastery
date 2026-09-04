import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncomeQueryIndex1788542820432 implements MigrationInterface {
  name = 'AddIncomeQueryIndex1788542820432';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_incomes_user_total_income"
      ON "incomes" ("user_id", "total_income")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_incomes_user_total_income"
    `);
  }
}
