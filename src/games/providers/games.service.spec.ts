import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { CardsService } from '../../cards/cards.service';
import { BasicPlayerData } from '../../matchmaking/matchmaking.types';


describe('GamesService', () => {
  let service: GamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesService],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GamesService', () => {
    let service: GamesService;

    const player1: BasicPlayerData = {
      socketId: 'player1',
      name: 'meow',
      deckIds: { unitIds: ['1'], spellIds: ['2']},
    };

    const player2: BasicPlayerData = {
      socketId: 'player2',
      name: 'meow',
      deckIds: { unitIds: ['3'], spellIds: ['4', '5']},
    };

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [GamesService, CardsService],
      }).compile();

      service = module.get(GamesService);
    });
  });
});
