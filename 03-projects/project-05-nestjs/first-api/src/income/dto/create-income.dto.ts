import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateIncomeDto {
  @IsNumber()
  @Min(0)
  annualIncome!: number;
  @IsNumber()
  @Min(0)
  @IsOptional()
  bonus?: number | null;
}
