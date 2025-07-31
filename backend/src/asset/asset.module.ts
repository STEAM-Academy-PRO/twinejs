import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [AssetController],
  providers: [AuthService],
})
export class AssetModule {}
