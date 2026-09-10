import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { IncomeService } from './income.service';
import { IncomeRepository } from './income.repository';
import { IncomeNotFoundException } from './exceptions/income-not-found.exception';
import { UserRepository } from '../user/user.repository';
import { QueryIncomeDto } from './dto/query-income.dto';

describe('IncomeService', () => {
  let service: IncomeService;

  const mockIncomeRepository = {
    saveIncome: jest.fn<(income: any) => Promise<any>>(),
    findAll: jest.fn<() => Promise<any[]>>(),
    findById: jest.fn<(id: number) => Promise<any>>(),
    update: jest.fn<(id: number, data: any) => Promise<any>>(),
    replace: jest.fn<(id: number, data: any) => Promise<any>>(),
    delete: jest.fn<(id: number) => Promise<boolean>>(),
    findAllIncomesByUserId: jest.fn(),
  };

  const mockUserRepository = {
    findById: jest.fn<(id: number) => Promise<any>>(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        {
          provide: IncomeRepository,
          useValue: mockIncomeRepository,
        },
        {
          provide: UserRepository,

          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<IncomeService>(IncomeService);

    jest.clearAllMocks();
  });

  describe('createIncome', () => {
    it('should create an income successfully', async () => {
      // Arrange
      const user = { id: 1, name: 'Maruf' };
      const dto = { id: 1, annualIncome: 500000, bonus: 50000 };
      const savedIncome = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user,
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockIncomeRepository.saveIncome.mockResolvedValue(savedIncome);

      // Act
      const result = await service.createIncome(1, dto);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);

      expect(mockIncomeRepository.saveIncome).toHaveBeenCalledWith({
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user,
      });

      expect(result).toEqual({
        success: true,
        message: 'Incomes created successfully',
        data: savedIncome,
      });
    });

    it('should use 0 as bonus when bonus is not provided', async () => {
      const user = {
        id: 1,
        name: 'Maruf',
      };

      const dto = {
        id: 1,
        annualIncome: 500000,
      };

      const savedIncome = {
        id: 10,
        annualIncome: 500000,
        bonus: 0,
        totalIncome: 500000,
        user,
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockIncomeRepository.saveIncome.mockResolvedValue(savedIncome);

      const result = await service.createIncome(1, dto);

      expect(mockIncomeRepository.saveIncome).toHaveBeenCalledWith({
        annualIncome: 500000,
        bonus: 0,
        totalIncome: 500000,
        user,
      });

      expect(result.data).toEqual(savedIncome);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.createIncome(99, {
          annualIncome: 500000,
          bonus: 50000,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockIncomeRepository.saveIncome).not.toHaveBeenCalled();
    });
  });

  describe('getIncomes', () => {
    it('should return all incomes', async () => {
      const incomes = [
        {
          id: 1,
          annualIncome: 500000,
          bonus: 50000,
          totalIncome: 550000,
        },
        {
          id: 2,
          annualIncome: 700000,
          bonus: 100000,
          totalIncome: 800000,
        },
      ];

      mockIncomeRepository.findAll.mockResolvedValue(incomes);

      const result = await service.getIncomes();

      expect(mockIncomeRepository.findAll).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        success: true,
        message: 'Incomes fetched successfully',
        data: incomes,
      });
    });
  });

  describe('getIncomeById', () => {
    it('should return income when income belongs to user', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);

      const result = await service.getIncomeById(1, 10);

      expect(mockIncomeRepository.findById).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        success: true,
        message: 'Income with id 10 found',
        data: income,
      });
    });

    it('should throw IncomeNotFoundException when income does not exist', async () => {
      mockIncomeRepository.findById.mockResolvedValue(null);

      await expect(service.getIncomeById(1, 999)).rejects.toThrow(
        IncomeNotFoundException,
      );
    });

    it('should throw ForbiddenException when income belongs to another user', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 2,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);

      await expect(service.getIncomeById(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateOwnIncome', () => {
    it('should update own income successfully', async () => {
      const existingIncome = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      const updatedIncome = {
        ...existingIncome,
        annualIncome: 600000,
        bonus: 50000,
        totalIncome: 650000,
      };

      mockIncomeRepository.findById.mockResolvedValue(existingIncome);
      mockIncomeRepository.update.mockResolvedValue(updatedIncome);

      const result = await service.updateOwnIncome(1, 10, {
        annualIncome: 600000,
      });

      expect(mockIncomeRepository.update).toHaveBeenCalledWith(10, {
        annualIncome: 600000,
        bonus: 50000,
        totalIncome: 650000,
      });

      expect(result).toEqual({
        success: true,
        message: 'Income updated successfully',
        data: updatedIncome,
      });
    });

    it('should throw IncomeNotFoundException when income does not exist', async () => {
      mockIncomeRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateOwnIncome(1, 999, {
          annualIncome: 600000,
        }),
      ).rejects.toThrow(IncomeNotFoundException);
    });

    it('should throw ForbiddenException when updating another users income', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 2,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);

      await expect(
        service.updateOwnIncome(1, 10, {
          annualIncome: 600000,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteOwnIncome', () => {
    it('should delete own income successfully', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);
      mockIncomeRepository.delete.mockResolvedValue(true);

      const result = await service.deleteOwnIncome(1, 10);

      expect(mockIncomeRepository.delete).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        success: true,
        message: 'Income with id 10 successfully deleted',
        data: {
          isDeleted: true,
        },
      });
    });

    it('should throw NotFoundException when income does not exist', async () => {
      mockIncomeRepository.findById.mockResolvedValue(null);

      await expect(service.deleteOwnIncome(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when deleting another users income', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 2,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);

      await expect(service.deleteOwnIncome(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when repository delete fails', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);
      mockIncomeRepository.delete.mockResolvedValue(false);

      await expect(service.deleteOwnIncome(1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.createIncome(99, {
          annualIncome: 500000,
          bonus: 50000,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockIncomeRepository.saveIncome).not.toHaveBeenCalled();
    });
    it('should throw ForbiddenException when income belongs to another user', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 2,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);

      await expect(service.getIncomeById(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('should return income when it belongs to the user', async () => {
      const income = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      mockIncomeRepository.findById.mockResolvedValue(income);

      const result = await service.getIncomeById(1, 10);

      expect(result).toEqual({
        success: true,
        message: 'Income with id 10 found',
        data: income,
      });
    });
    it('should update own income successfully', async () => {
      const existingIncome = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      const updatedIncome = {
        ...existingIncome,
        annualIncome: 600000,
        bonus: 50000,
        totalIncome: 650000,
      };

      mockIncomeRepository.findById.mockResolvedValue(existingIncome);
      mockIncomeRepository.update.mockResolvedValue(updatedIncome);

      const result = await service.updateOwnIncome(1, 10, {
        annualIncome: 600000,
      });

      expect(mockIncomeRepository.update).toHaveBeenCalledWith(10, {
        annualIncome: 600000,
        bonus: 50000,
        totalIncome: 650000,
      });

      expect(result).toEqual({
        success: true,
        message: 'Income updated successfully',
        data: updatedIncome,
      });
    });

    it('should keep existing annualIncome when only bonus is updated', async () => {
      const existingIncome = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      const updatedIncome = {
        ...existingIncome,
        bonus: 100000,
        totalIncome: 600000,
      };

      mockIncomeRepository.findById.mockResolvedValue(existingIncome);
      mockIncomeRepository.update.mockResolvedValue(updatedIncome);

      const result = await service.updateOwnIncome(1, 10, {
        bonus: 100000,
      });

      expect(mockIncomeRepository.update).toHaveBeenCalledWith(10, {
        annualIncome: 500000,
        bonus: 100000,
        totalIncome: 600000,
      });

      expect(result.data).toEqual(updatedIncome);
    });
    it('should replace own income successfully', async () => {
      const existingIncome = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user: {
          id: 1,
        },
      };

      const replacedIncome = {
        ...existingIncome,
        annualIncome: 700000,
        bonus: 0,
        totalIncome: 700000,
      };

      mockIncomeRepository.findById.mockResolvedValue(existingIncome);
      mockIncomeRepository.replace.mockResolvedValue(replacedIncome);

      const result = await service.replaceOwnIncome(1, 10, {
        annualIncome: 700000,
      });

      expect(mockIncomeRepository.replace).toHaveBeenCalledWith(10, {
        annualIncome: 700000,
        bonus: 0,
        totalIncome: 700000,
        user: existingIncome.user,
      });

      expect(result).toEqual({
        success: true,
        message: 'Income replaced successfully',
        data: replacedIncome,
      });
    });
  });
  describe('createIncomeWithHistory', () => {
    it('should create income and history inside a transaction', async () => {
      // Arrange
      const user = {
        id: 1,
        name: 'Maruf',
      };

      const dto = {
        annualIncome: 500000,
        bonus: 50000,
      };

      const createdIncome = {
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
        user,
      };

      const savedIncome = {
        id: 10,
        ...createdIncome,
      };

      const createdHistory = {
        message: 'Income 10 created',
      };

      const mockManager = {
        create: jest.fn<(...args: any[]) => any>(),
        save: jest.fn<(...args: any[]) => Promise<any>>(),
      };

      mockManager.create
        .mockReturnValueOnce(createdIncome)
        .mockReturnValueOnce(createdHistory);

      mockManager.save
        .mockResolvedValueOnce(savedIncome)
        .mockResolvedValueOnce(createdHistory);

      mockUserRepository.findById.mockResolvedValue(user);

      mockDataSource.transaction.mockImplementation(
        (
          callback: (
            manager: typeof mockManager,
          ) => Promise<typeof savedIncome>,
        ) => callback(mockManager),
      );

      // Act
      const result = await service.createIncomeWithHistory(1, dto);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);

      expect(mockManager.create).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        {
          annualIncome: 500000,
          bonus: 50000,
          totalIncome: 550000,
          user,
        },
      );

      expect(mockManager.save).toHaveBeenNthCalledWith(1, createdIncome);

      expect(mockManager.create).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        {
          message: 'Income 10 created',
        },
      );

      expect(mockManager.save).toHaveBeenNthCalledWith(2, createdHistory);

      expect(result).toEqual(savedIncome);
    });
  });
  describe('findAllIncomesByUserId', () => {
    it('should return paginated incomes for a user', async () => {
      const query: QueryIncomeDto = {
        page: 1,
        limit: 10,
        sortBy: 'id',
        sortOrder: 'DESC',
      };

      const repositoryResult = {
        data: [
          {
            id: 1,
            annualIncome: 500000,
            bonus: 50000,
            totalIncome: 550000,
            user: {
              id: 1,
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockIncomeRepository.findAllIncomesByUserId.mockResolvedValue(
        repositoryResult,
      );

      const result = await service.findAllIncomesByUserId(1, query);

      expect(mockIncomeRepository.findAllIncomesByUserId).toHaveBeenCalledWith(
        1,
        query,
      );

      expect(result).toEqual(repositoryResult);
    });
  });
});
