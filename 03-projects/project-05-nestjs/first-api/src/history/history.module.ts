import { Module } from '@nestjs/common';
import { IncomeHistoryEntity } from './history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({ imports: [TypeOrmModule.forFeature([IncomeHistoryEntity])] })
export class HistoryModule {}
