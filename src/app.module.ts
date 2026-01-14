import { Module } from '@nestjs/common';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [ReservationsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
