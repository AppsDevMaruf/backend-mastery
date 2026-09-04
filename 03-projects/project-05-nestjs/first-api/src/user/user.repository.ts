import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  findById(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }
  findByIdWithIncomes(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        incomes: true,
      },
    });
  }
  findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  createUser(
    data: Omit<UserEntity, 'id' | 'incomes' | 'createdAt'>,
  ): Promise<UserEntity> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  findByReqUserId(reqUser: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: {
        id: reqUser,
      },
    });
  }
  async updateRefreshTokenHash(
    userId: number,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      refreshTokenHash,
    });
  }

  async clearRefreshTokenHash(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      refreshTokenHash: null,
    });
  }

  async findByIdWithRefreshToken(userId: number): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :userId', { userId })
      .getOne();
  }
}
