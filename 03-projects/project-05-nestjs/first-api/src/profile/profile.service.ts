import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
  getProfile() {
    return {
      name: 'Maruf Alam',
      age: 30,
      email: 'maruf.alam@example.com',
    };
  }
}
