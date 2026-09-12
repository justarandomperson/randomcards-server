import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { CardsService } from './cards/cards.service';
import { Player } from './games.types';


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

    const player1: Player = {
      id: 'player1',
      deck: ['1', '2'],
    };

    const player2: Player = {
      id: 'player2',
      deck: ['3'],
    };

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [GamesService, CardsService],
      }).compile();

      service = module.get(GamesService);
    });

    describe('makeMove', () => {
      it('should move a card from the bench onto the board', () => {
        const game = service.createRoom([player1, player2], 'game1');

        const result = service.playUnit('player1', 'game1', {
          id: '1',
          boardIndex: 1,
        });

        expect(result).toEqual({
          made: true,
          card: 'Skeleton',
          position: 1,
        });

        expect(game.board[1]).toEqual(player1.deck[0]);
      });
    });
  });
});
