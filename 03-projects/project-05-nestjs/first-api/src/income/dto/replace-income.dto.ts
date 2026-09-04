import { IsNumber, Min } from 'class-validator';

export class ReplaceIncomeDto {
  @IsNumber()
  @Min(0)
  annualIncome!: number;
  @IsNumber()
  @Min(0)
  bonus!: number;
  @IsNumber()
  @Min(1)
  userId!: number;
}
