import { CardInstance } from './cards/card.types';
import { CardsService } from './cards/cards.service';
import { PlaceUnitDto } from './dto/place-unit.dto';
import { GameState, Player, PlayerState } from './games.types';

export class GamesService {
  constructor(private readonly _cardsService: CardsService) {}
  private Rooms: GameState[] = [];

  createRoom(players: Player[], gameId: string) {
    const [player1, player2] = players;

    const player1State = this.initializePlayerState(player1);
    const player2State = this.initializePlayerState(player2);

    const room: GameState = {
      players: [player1State, player2State],
      board: [],
      gameId: gameId,
      player1Turn: true,
    };

    this.Rooms.push(room);

    return room;
  }

  private initializePlayerState(player: Player) {
    const player1Cards = player.deck.map((cardId) =>
      this._cardsService.createCardFromId(cardId),
    );

    const playerState: PlayerState = {
      deck: player1Cards,
      hp: 20,
      bench: [],
      hand: [],
      id: player.id,
    };

    return playerState;
  }

  getRoom(gameId: string) {
    const game = this.Rooms.find((room) => room.gameId == gameId);
    if (!game) throw new Error("Game doesn't exist");
    return game;
  }

  placeUnit(playerID: string, gameId: string, placeUnitData: PlaceUnitDto) {
    const context = this.getPlayerGame(playerID, gameId);
    const { isPlayer1, bench, game } = context;

    const { id, boardIndex } = placeUnitData;

    const translatedDestination = isPlayer1
      ? boardIndex
      : game.board.length - 1 - boardIndex;

    this.throwIfPlaceUnitInvalid(game, translatedDestination);

    const card: CardInstance | undefined = bench.find((card) => {
      card.id == id;
    });
    if (!card) throw new Error("card doesn't exist");

    game.board[translatedDestination] = card;

    return {
      card: card,
      position: boardIndex,
    };
  }

  private throwIfPlaceUnitInvalid(game: GameState, boardIndex: number) {
    if (boardIndex > game.board.length || boardIndex < 0)
      throw new Error('out of bounds');
    if (game.board[boardIndex] != null) throw new Error('slot taken');
  }

  endTurn(playerID: string, gameID: string) {
    const context = this.getPlayerGame(playerID, gameID);
    const game = context.game;

    game.player1Turn = !game.player1Turn;
  }

  getPlayerGame(playerID: string, gameID: string) {
    const game = this.getRoom(gameID);

    if (
      !game.players.find((player) => {
        player.id == playerID;
      })
    )
      throw new Error('player not in game');

    const isPlayer1 = playerID === game.players[0].id;
    const playerState = isPlayer1 ? game.players[0] : game.players[1];
    const isPlayerTurn = isPlayer1 === game.player1Turn;

    if (!isPlayerTurn) throw new Error("not player's turn");

    return {
      isPlayer1,
      hand: playerState.hand,
      bench: playerState.bench,
      game,
    };
  }

  getUpdatedHand(playerID: string, gameID: string) {
    const context = this.getPlayerGame(playerID, gameID);
    return context.hand;
  }

  getUpdatedBench(playerID: string, gameID: string) {
    const context = this.getPlayerGame(playerID, gameID);
    return context.bench;
  }

  getUpdatedBoard(gameID: string) {
    const game = this.getRoom(gameID);
    return game.board;
  }
}
