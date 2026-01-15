import { Module } from '@nestjs/common';
import { GoogleModule } from 'src/google/google.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth0JwtGuard } from './auth0-jwt.guard';

@Module({
  imports: [GoogleModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, Auth0JwtGuard],
  exports: [AuthService, Auth0JwtGuard],
})
export class AuthModule {}
