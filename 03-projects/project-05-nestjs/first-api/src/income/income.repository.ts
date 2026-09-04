import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeEntity } from './income.entity';
import { QueryIncomeDto } from './dto/query-income.dto';

@Injectable()
export class IncomeRepository {
  constructor(
    @InjectRepository(IncomeEntity)
    private readonly incomeRepository: Repository<IncomeEntity>,
  ) {}
  saveIncome(data: Omit<IncomeEntity, 'id'>): Promise<IncomeEntity> {
    const income = this.incomeRepository.create(data);
    return this.incomeRepository.save(income);
  }
  findAll(): Promise<IncomeEntity[]> {
    return this.incomeRepository.find({
      relations: {
        user: true,
      },
    });
  }
  async findAllIncomesByUserId(userId: number, query: QueryIncomeDto) {
    const {
      page = 1,
      limit = 10,
      minIncome,
      maxIncome,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.incomeRepository
      .createQueryBuilder('income')
      .leftJoinAndSelect('income.user', 'user')
      .where('user.id = :userId', { userId });

    if (minIncome !== undefined) {
      queryBuilder.andWhere('income.totalIncome >= :minIncome', {
        minIncome,
      });
    }

    if (maxIncome !== undefined) {
      queryBuilder.andWhere('income.totalIncome <= :maxIncome', {
        maxIncome,
      });
    }

    queryBuilder.orderBy(`income.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findById(id: number): Promise<IncomeEntity | null> {
    return this.incomeRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.incomeRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
  async update(
    id: number,
    data: Partial<Omit<IncomeEntity, 'id'>>,
  ): Promise<IncomeEntity | null> {
    await this.incomeRepository.update(id, data);
    return this.incomeRepository.findOne({ where: { id } });
  }
  async replace(
    id: number,
    data: Omit<IncomeEntity, 'id'>,
  ): Promise<IncomeEntity | null> {
    await this.incomeRepository.update(id, data);
    return this.incomeRepository.findOne({ where: { id } });
  }
}
/* import { Injectable } from '@nestjs/common';
import { Income } from './income.types';

@Injectable()
export class IncomeRepository {
  private readonly incomes: Income[] = [];
  private nextId = 1;

  save(data: Omit<Income, 'id'>): Income {
    const income: Income = {
      id: this.nextId++,
      ...data,
    };
    this.incomes.push(income);

    return income;
  }

  update(id: number, data: Partial<Omit<Income, 'id'>>): Income | undefined {
    const index = this.incomes.findIndex((income) => income.id === id);

    if (index === -1) {
      return undefined;
    }

    const updatedIncome: Income = {
      ...this.incomes[index],
      ...data,
    };

    this.incomes[index] = updatedIncome;

    return updatedIncome;
  }

  delete(id: number): boolean {
    const index = this.incomes.findIndex((income) => income.id === id);
    if (index === -1) {
      return false;
    }
    this.incomes.splice(index, 1);
    return true;
  }

  findAll(): Income[] {
    return this.incomes;
  }

  findById(id: number): Income | undefined {
    return this.incomes.find((income) => income.id === id);
  }
}
 */
