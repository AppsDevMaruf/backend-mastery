import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, it } from '@jest/globals';
import { IncomesController } from './income.controller';
import { IncomeService } from './income.service';

describe('IncomesController', () => {
  let controller: IncomesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [IncomeService],
    }).compile();

    controller = module.get<IncomesController>(IncomesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
function expect(controller: IncomesController) {
  return {
    toBeDefined: () => {
      if (controller === undefined || controller === null) {
        throw new Error('Expected controller to be defined.');
      }
    },
  };
}
