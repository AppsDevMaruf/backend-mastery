import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IncomeRepository } from './income.repository';
import { IncomeEntity } from './income.entity';
import { CreateIncomeDto } from './dto/create-income.dto';
import { ReplaceIncomeDto } from './dto/replace-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UserRepository } from 'src/user/user.repository';
import { DataSource } from 'typeorm';
import { IncomeHistoryEntity } from 'src/history/history.entity';
import { QueryIncomeDto } from './dto/query-income.dto';

@Injectable()
export class IncomeService {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createIncome(
    reqUserId: number,
    data: CreateIncomeDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: IncomeEntity;
  }> {
    const user = await this.userRepository.findById(reqUserId);
    if (!user) {
      throw new NotFoundException(`User with id ${reqUserId} not found`);
    }
    const bonus = data.bonus ?? 0;
    const totalIncome = data.annualIncome + bonus;
    const income = await this.incomeRepository.saveIncome({
      annualIncome: data.annualIncome,
      bonus: bonus,
      totalIncome,
      user: user,
    });
    return {
      success: true,
      message: 'Incomes created successfully',
      data: income,
    };
  }

  async getIncomes(): Promise<{
    success: boolean;
    message: string;
    data: IncomeEntity[];
  }> {
    const incomes = await this.incomeRepository.findAll();

    return {
      success: true,
      message: 'Incomes fetched successfully',
      data: incomes,
    };
  }

  async getIncomeById(
    userId: number,
    incomeId: number,
  ): Promise<{
    success: boolean;
    message: string;
    data: IncomeEntity;
  }> {
    const income = await this.incomeRepository.findById(incomeId);

    if (!income) {
      throw new NotFoundException(`Income with id ${incomeId} not found`);
    }
    if (income.user.id !== userId) {
      throw new ForbiddenException("You cannot access another user's income");
    }
    return {
      success: true,
      message: `Income with id ${incomeId} found`,
      data: income,
    };
  }

  async updateOwnIncome(
    userId: number,
    incomeId: number,
    data: UpdateIncomeDto,
  ) {
    const existingIncome = await this.incomeRepository.findById(incomeId);

    if (!existingIncome) {
      throw new NotFoundException(`Income with id ${incomeId} not found`);
    }

    if (existingIncome.user.id !== userId) {
      throw new ForbiddenException("You cannot update another user's income");
    }

    const annualIncome = Number(
      data.annualIncome ?? existingIncome.annualIncome,
    );

    const bonus = Number(data.bonus ?? existingIncome.bonus ?? 0);

    const totalIncome = annualIncome + bonus;

    const updatedIncome = await this.incomeRepository.update(incomeId, {
      annualIncome,
      bonus,
      totalIncome,
    });

    return {
      success: true,
      message: 'Income updated successfully',
      data: updatedIncome,
    };
  }

  async replaceOwnIncome(
    userId: number,
    incomeId: number,
    data: ReplaceIncomeDto,
  ) {
    const existingIncome = await this.incomeRepository.findById(incomeId);

    if (!existingIncome) {
      throw new NotFoundException(`Income with id ${incomeId} not found`);
    }

    if (existingIncome.user.id !== userId) {
      throw new ForbiddenException("You cannot replace another user's income");
    }

    const bonus = Number(data.bonus ?? 0);
    const annualIncome = Number(data.annualIncome);
    const totalIncome = annualIncome + bonus;

    const updatedIncome = await this.incomeRepository.replace(incomeId, {
      annualIncome,
      bonus,
      totalIncome,
      user: existingIncome.user,
    });

    return {
      success: true,
      message: 'Income replaced successfully',
      data: updatedIncome,
    };
  }
  async createIncomeWithHistory(
    reqUserId: number,
    data: CreateIncomeDto,
  ): Promise<IncomeEntity> {
    const user = await this.userRepository.findById(reqUserId);

    if (!user) {
      throw new NotFoundException(`User with id ${reqUserId} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      const bonus = data.bonus ?? 0;
      const totalIncome = data.annualIncome + bonus;

      const income = manager.create(IncomeEntity, {
        annualIncome: data.annualIncome,
        bonus,
        totalIncome,
        user,
      });

      const savedIncome = await manager.save(income);

      const history = manager.create(IncomeHistoryEntity, {
        message: `Income ${savedIncome.id} created`,
      });

      await manager.save(history);

      return savedIncome;
    });
  }
  findAllIncomesByUserId(
    userId: number,
    query: QueryIncomeDto,
  ): Promise<{
    data: IncomeEntity[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.incomeRepository.findAllIncomesByUserId(userId, query);
  }
  async deleteOwnIncome(userId: number, incomeId: number) {
    const income = await this.incomeRepository.findById(incomeId);

    if (!income) {
      throw new NotFoundException(`Income with id ${incomeId} not found`);
    }

    if (income.user.id !== userId) {
      throw new ForbiddenException("You cannot delete another user's income");
    }

    const deleted = await this.incomeRepository.delete(incomeId);

    if (!deleted) {
      throw new NotFoundException(`Income with id ${incomeId} not found`);
    }

    return {
      success: true,
      message: `Income with id ${incomeId} successfully deleted`,
      data: { isDeleted: deleted },
    };
  }
}
