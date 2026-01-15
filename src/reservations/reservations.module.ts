import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleModule } from 'src/google/google.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuthModule, GoogleModule, PrismaModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
