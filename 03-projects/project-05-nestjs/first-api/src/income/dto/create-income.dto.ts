import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateIncomeDto {
  id!: number;
  @IsNumber()
  @Min(0)
  annualIncome!: number;
  @IsNumber()
  @Min(0)
  @IsOptional()
  bonus?: number | undefined | null;
}
