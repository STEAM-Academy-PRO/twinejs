import { Module } from '@nestjs/common';
import { AssetModule } from './asset/asset.module';

@Module({
  imports: [AssetModule],
  controllers: [],
  providers: [],
})
export class AppModule {}