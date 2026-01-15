import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleService } from './google.service';

@Module({
  imports: [PrismaModule],
  providers: [GoogleService, GoogleCalendarService],
  exports: [GoogleService, GoogleCalendarService],
})
export class GoogleModule {}
