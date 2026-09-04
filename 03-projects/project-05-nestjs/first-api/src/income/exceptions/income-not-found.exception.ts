import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class IncomeNotFoundException extends AppException {
  constructor(incomeId: number) {
    super(
      `Income with id ${incomeId} not found`,
      HttpStatus.NOT_FOUND,
      'INCOME_NOT_FOUND',
    );
  }
}
