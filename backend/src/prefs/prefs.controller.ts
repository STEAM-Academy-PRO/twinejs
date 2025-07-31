import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrefsService } from './prefs.service';

@Controller('prefs')
@UseGuards(AuthGuard)
export class PrefsController {
  constructor(private readonly prefsService: PrefsService) {}

  @Get()
  async load(): Promise<any> {
    return await this.prefsService.load();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async save(@Body() data: any): Promise<void> {
    await this.prefsService.save(data);
  }
}
