import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { IncomeEntity } from '../income/income.entity';
import { UserEntity } from '../user/user.entity';
import { IncomeHistoryEntity } from '../history/history.entity';

const nodeEnv = process.env.NODE_ENV ?? 'development';

config({
  path: [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env'],
});

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: getRequiredEnv('DB_HOST'),
  port: Number(process.env.DB_PORT ?? 5432),
  username: getRequiredEnv('DB_USERNAME'),
  password: process.env.DB_PASSWORD ?? '',
  database: getRequiredEnv('DB_NAME'),

  entities: [UserEntity, IncomeEntity, IncomeHistoryEntity],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
});
