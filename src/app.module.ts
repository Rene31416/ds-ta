import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [AuthModule, ReservationsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
