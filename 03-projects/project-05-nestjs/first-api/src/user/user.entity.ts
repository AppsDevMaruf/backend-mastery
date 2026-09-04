import { IsString } from 'class-validator';
import { IncomeEntity } from '../income/income.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
  })
  role!: UserRole;

  @IsString()
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'password_hash',
    select: false,
  })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'refresh_token_hash',
    select: false,
    nullable: true,
  })
  refreshTokenHash!: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt!: Date;

  @OneToMany(() => IncomeEntity, (income) => income.user)
  incomes!: IncomeEntity[];
}
