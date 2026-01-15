import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';

type AuthenticatedRequest = Request & { user?: { id: number } };

@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    return this.reservationsService.list(this.requireUserId(req));
  }

  @Get(':id')
  async getById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.reservationsService.getById(
      this.requireUserId(req),
      this.parseId(id),
    );
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() data: CreateReservationDto) {
    return this.reservationsService.create(this.requireUserId(req), data);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateReservationDto,
  ) {
    return this.reservationsService.update(
      this.requireUserId(req),
      this.parseId(id),
      data,
    );
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.reservationsService.remove(
      this.requireUserId(req),
      this.parseId(id),
    );
  }

  private requireUserId(req: AuthenticatedRequest): number {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    return req.user.id;
  }

  private parseId(id: string): number {
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('Invalid id');
    }
    return parsed;
  }
}
