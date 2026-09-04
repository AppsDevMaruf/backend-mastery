import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  async getUserById(id: number): Promise<{
    success: boolean;
    message: string;
    data: UserEntity;
  }> {
    const user = await this.userRepository.findByIdWithIncomes(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      success: !!user,
      message: user ? 'User found' : 'User not found',
      data: user,
    };
  }
}
