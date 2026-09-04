import { UserEntity } from '../user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('incomes')
export class IncomeEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'numeric', name: 'annual_income' })
  annualIncome!: number;
  @Column({ type: 'numeric', name: 'bonus', nullable: true })
  bonus?: number;
  @Column({ type: 'numeric', name: 'total_income' })
  totalIncome!: number;
  @ManyToOne(() => UserEntity, (user) => user.incomes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}
