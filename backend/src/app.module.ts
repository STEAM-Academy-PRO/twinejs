import { Module } from '@nestjs/common';
import { AssetModule } from './asset/asset.module';
import { StoryModule } from './story/story.module';
import { PrefsModule } from './prefs/prefs.module';
import { StoryFormatModule } from './story-format/story-format.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AssetModule, StoryModule, PrefsModule, StoryFormatModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}