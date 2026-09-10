import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { ReplaceIncomeDto } from './dto/replace-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permission } from '../auth/permissions/permission.enum';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomeService: IncomeService) {}
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_CREATE_OWN)
  createIncome(
    @CurrentUser() reqUser: JwtPayload,
    @Body() body: CreateIncomeDto,
  ) {
    return this.incomeService.createIncome(reqUser.sub, body);
  }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_READ_OWN)
  @Get()
  findAll(@CurrentUser() reqUser: JwtPayload, @Query() query: QueryIncomeDto) {
    return this.incomeService.findAllIncomesByUserId(reqUser.sub, query);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyInfo(@CurrentUser() reqUser: JwtPayload) {
    return reqUser;
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_READ_OWN)
  getIncomeById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) incomeId: number,
  ) {
    return this.incomeService.getIncomeById(user.sub, incomeId);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_READ_OWN)
  updateIncome(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) incomeId: number,
    @Body() body: UpdateIncomeDto,
  ) {
    return this.incomeService.updateOwnIncome(user.sub, incomeId, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_READ_OWN)
  replaceIncome(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) incomeId: number,
    @Body() body: ReplaceIncomeDto,
  ) {
    return this.incomeService.replaceOwnIncome(user.sub, incomeId, body);
  }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_CREATE_OWN)
  @Post('with-history')
  createIncomeWithHistory(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateIncomeDto,
  ) {
    return this.incomeService.createIncomeWithHistory(user.sub, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.INCOME_DELETE_OWN)
  @Delete(':id')
  deleteIncome(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.incomeService.deleteOwnIncome(user.sub, id);
  }
}
