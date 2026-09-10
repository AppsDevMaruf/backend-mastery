import { Test, TestingModule } from '@nestjs/testing';

import { IncomesController } from './income.controller';
import { IncomeService } from './income.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { ReplaceIncomeDto } from './dto/replace-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
describe('IncomesController', () => {
  let controller: IncomesController;

  const mockIncomeService = {
    createIncome: jest.fn<(...args: any[]) => any>(),
    findAllIncomesByUserId: jest.fn<(...args: any[]) => any>(),
    getIncomeById: jest.fn<(...args: any[]) => any>(),
    updateOwnIncome: jest.fn<(...args: any[]) => any>(),
    replaceOwnIncome: jest.fn<(...args: any[]) => any>(),
    createIncomeWithHistory: jest.fn<(...args: any[]) => any>(),
    deleteOwnIncome: jest.fn<(...args: any[]) => any>(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [
        {
          provide: IncomeService,
          useValue: mockIncomeService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<IncomesController>(IncomesController);

    jest.clearAllMocks();
  });

  describe('createIncome', () => {
    it('should call service with current user id and dto', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const body = Object.assign(new CreateIncomeDto(), {
        annualIncome: 500000,
        bonus: 50000,
      });

      const serviceResult = {
        success: true,
        message: 'Incomes created successfully',
        data: {
          id: 10,
          annualIncome: 500000,
          bonus: 50000,
          totalIncome: 550000,
        },
      };

      mockIncomeService.createIncome.mockResolvedValue(serviceResult);

      const result = await controller.createIncome(user, body);

      expect(mockIncomeService.createIncome).toHaveBeenCalledWith(1, body);

      expect(result).toEqual(serviceResult);
    });
  });

  describe('findAll', () => {
    it('should call service with current user id and query', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const query = new QueryIncomeDto();

      query.page = 1;
      query.limit = 10;
      query.sortBy = 'id';
      query.sortOrder = 'DESC';

      const serviceResult = {
        data: [
          {
            id: 10,
            annualIncome: 500000,
            bonus: 50000,
            totalIncome: 550000,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockIncomeService.findAllIncomesByUserId.mockResolvedValue(serviceResult);

      const result = await controller.findAll(user, query);

      expect(mockIncomeService.findAllIncomesByUserId).toHaveBeenCalledWith(
        1,
        query,
      );

      expect(result).toEqual(serviceResult);
    });
  });

  describe('getMyInfo', () => {
    it('should return current authenticated user', () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const result = controller.getMyInfo(user);

      expect(result).toBe(user);
    });
  });

  describe('getIncomeById', () => {
    it('should call service with user id and income id', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const serviceResult = {
        success: true,
        message: 'Income with id 10 found',
        data: {
          id: 10,
          annualIncome: 500000,
          bonus: 50000,
          totalIncome: 550000,
        },
      };

      mockIncomeService.getIncomeById.mockResolvedValue(serviceResult);

      const result = await controller.getIncomeById(user, 10);

      expect(mockIncomeService.getIncomeById).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual(serviceResult);
    });
  });

  describe('updateIncome', () => {
    it('should call service with user id, income id and update dto', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const body = Object.assign(new UpdateIncomeDto(), {
        bonus: 100000,
      });

      const serviceResult = {
        success: true,
        message: 'Income updated successfully',
        data: {
          id: 10,
          annualIncome: 500000,
          bonus: 100000,
          totalIncome: 600000,
        },
      };

      mockIncomeService.updateOwnIncome.mockResolvedValue(serviceResult);

      const result = await controller.updateIncome(user, 10, body);

      expect(mockIncomeService.updateOwnIncome).toHaveBeenCalledWith(
        1,
        10,
        body,
      );

      expect(result).toEqual(serviceResult);
    });
  });

  describe('replaceIncome', () => {
    it('should call service with user id, income id and replace dto', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const body = Object.assign(new ReplaceIncomeDto(), {
        annualIncome: 700000,
        bonus: 0,
      });

      const serviceResult = {
        success: true,
        message: 'Income replaced successfully',
        data: {
          id: 10,
          annualIncome: 700000,
          bonus: 0,
          totalIncome: 700000,
        },
      };

      mockIncomeService.replaceOwnIncome.mockResolvedValue(serviceResult);

      const result = await controller.replaceIncome(user, 10, body);

      expect(mockIncomeService.replaceOwnIncome).toHaveBeenCalledWith(
        1,
        10,
        body,
      );

      expect(result).toEqual(serviceResult);
    });
  });

  describe('createIncomeWithHistory', () => {
    it('should call service to create income with history', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const body = Object.assign(new CreateIncomeDto(), {
        annualIncome: 500000,
        bonus: 50000,
      });

      const serviceResult = {
        id: 10,
        annualIncome: 500000,
        bonus: 50000,
        totalIncome: 550000,
      };

      mockIncomeService.createIncomeWithHistory.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.createIncomeWithHistory(user, body);

      expect(mockIncomeService.createIncomeWithHistory).toHaveBeenCalledWith(
        1,
        body,
      );

      expect(result).toEqual(serviceResult);
    });
  });

  describe('deleteIncome', () => {
    it('should call service with current user id and income id', async () => {
      const user = {
        sub: 1,
      } as JwtPayload;

      const serviceResult = {
        success: true,
        message: 'Income with id 10 successfully deleted',
        data: {
          isDeleted: true,
        },
      };

      mockIncomeService.deleteOwnIncome.mockResolvedValue(serviceResult);

      const result = await controller.deleteIncome(user, 10);

      expect(mockIncomeService.deleteOwnIncome).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual(serviceResult);
    });
  });
});
