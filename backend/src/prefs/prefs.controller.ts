import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrefsService } from './prefs.service';

@Controller('prefs')
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
