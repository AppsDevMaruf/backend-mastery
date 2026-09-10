import { IsNumber, IsOptional, Min } from 'class-validator';

export class ReplaceIncomeDto {
  @IsNumber()
  @Min(0)
  annualIncome!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number | null;
}