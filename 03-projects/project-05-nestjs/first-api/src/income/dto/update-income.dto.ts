import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateIncomeDto {
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Annual income must be a number',
    },
  )
  @Min(0, {
    message: 'Annual income cannot be negative',
  })
  annualIncome?: number;

  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Bonus must be a number',
    },
  )
  @Min(0, {
    message: 'Bonus cannot be negative',
  })
  bonus?: number;
}
