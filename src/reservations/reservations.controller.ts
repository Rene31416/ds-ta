import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  async list() {
    return this.reservationsService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.reservationsService.getById(this.parseId(id));
  }

  @Post()
  async create(@Body() data: CreateReservationDto) {
    return this.reservationsService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateReservationDto) {
    return this.reservationsService.update(this.parseId(id), data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.reservationsService.remove(this.parseId(id));
  }

  private parseId(id: string): number {
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('Invalid id');
    }
    return parsed;
  }
}
