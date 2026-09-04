import { DataSource } from 'typeorm';
import { IncomeEntity } from '../income/income.entity';
import { UserEntity } from '../user/user.entity';
import { IncomeHistoryEntity } from '../history/history.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'marufalam',
  password: '',
  database: 'bd_tax',

  entities: [UserEntity, IncomeEntity, IncomeHistoryEntity],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
});
