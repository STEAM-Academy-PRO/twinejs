import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';

@Module({
  controllers: [AssetController],
  providers: [],
})
export class AssetModule {}
