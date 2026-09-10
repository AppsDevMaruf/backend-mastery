import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788000000000 implements MigrationInterface {
  name = 'InitialSchema1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'user',
        "name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "refresh_token_hash" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incomes" (
        "id" SERIAL NOT NULL,
        "annual_income" numeric NOT NULL,
        "bonus" numeric,
        "total_income" numeric NOT NULL,
        "user_id" integer,
        CONSTRAINT "PK_d737b3d0314c1f0da5461a55e5e" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "income_history" (
        "id" SERIAL NOT NULL,
        "message" character varying NOT NULL,
        CONSTRAINT "PK_2c118430a19304452f0774f6333" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "incomes"
      ADD CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "incomes"
      DROP CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6"
    `);
    await queryRunner.query(`DROP TABLE "income_history"`);
    await queryRunner.query(`DROP TABLE "incomes"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
