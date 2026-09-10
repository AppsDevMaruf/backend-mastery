import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomesController } from './income.controller';
import { IncomeRepository } from './income.repository';
import { IncomeEntity } from './income.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([IncomeEntity]), UserModule, AuthModule],
  controllers: [IncomesController],
  providers: [IncomeService, IncomeRepository],
})
export class IncomeModule {}
