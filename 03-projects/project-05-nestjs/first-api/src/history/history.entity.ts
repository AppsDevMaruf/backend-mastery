import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('income_history')
export class IncomeHistoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  message!: string;
}
