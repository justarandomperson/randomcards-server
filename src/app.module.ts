import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UsersModule, GamesModule, MongooseModule.forRoot("placeholder"), AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
