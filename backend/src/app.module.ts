import { Module } from '@nestjs/common';
import { AssetModule } from './asset/asset.module';
import { StoryModule } from './story/story.module';
import { PrefsModule } from './prefs/prefs.module';
import { StoryFormatModule } from './story-format/story-format.module';
import { AuthModule } from './auth/auth.module';
import { StaticModule } from './static/static.module';
import { SceneModule } from './scene/scene.module';

@Module({
  imports: [AssetModule, StoryModule, PrefsModule, StoryFormatModule, AuthModule, StaticModule, SceneModule],
  controllers: [],
  providers: [],
})
export class AppModule {}