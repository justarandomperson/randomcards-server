import { Injectable } from '@nestjs/common';
import { UnitInstance } from './cards/card.types';
import { CardsService } from './cards/card.service';
import { EffectTrigger } from './cards/effect.types';
import { GameActions } from './cards/game-actions';
import { GameState, Player, PlayerState } from './games.types';
import { PlayUnitDto } from './dto/play-unit.dto';


@Injectable()
export class GamesService {
  private Rooms: GameState[] = [];

  private readonly actions: GameActions;

  constructor(private readonly _cardsService: CardsService) {
    this.actions = new GameActions(_cardsService)
  }

  createRoom(players: Player[], gameID: string) {
    const [player1, player2] = players;

    const player1State = this.initializePlayerState(player1);
    const player2State = this.initializePlayerState(player2);

    const room: GameState = {
      players: new Map([
        [player1.id, player1State],
        [player2.id, player2State]
      ]),
      board: [],
      gameID: gameID,
      playerTurnID: player1.id,
    };

    this.Rooms.push(room);

    return room;
  }

  private initializePlayerState(player: Player) {
    const playerCards = player.deck.map((cardId) =>
      this._cardsService.createCardFromId(cardId, player.id),
    );

    const playerState: PlayerState = {
      drawpile: [],
      hp: 20, //? maybe make this a constant
      money: 0, //? maybe make this a constant
      bench: playerCards,
      hand: [],
      id: player.id,
    };

    return playerState;
  }

  getRoom(gameID: string) {
    const game = this.Rooms.find((room) => room.gameID == gameID);
    if (!game) throw new Error("Game doesn't exist");
    return game;
  }

  playUnit(playerID: string, gameID: string, playUnitData: PlayUnitDto) {
    const context = this.getPlayerGame(playerID, gameID);
    const { isPlayer1, bench, game } = context;

    const { id, boardIndex } = playUnitData;

    const translatedDestination = isPlayer1
      ? boardIndex
      : game.board.length - 1 - boardIndex;

    this.throwIfPlayUnitInvalid(game, translatedDestination);

    const card: UnitInstance | undefined = bench.find((card) => {
      card.id == id;
    });
    if (!card) throw new Error("card doesn't exist");

    game.board[translatedDestination] = card;

    return {
      card: card,
      position: boardIndex,
    };
  }

  private throwIfPlayUnitInvalid(game: GameState, boardIndex: number) {
    if (boardIndex > game.board.length || boardIndex < 0) 
      throw new Error('out of bounds');
    if (game.board[boardIndex] != null) throw new Error('slot taken');
  }

  startTurn(playerID: string, gameID: string)
  {
    const context = this.getPlayerGame(playerID, gameID)
    const game = context.game

    this.triggerUnits(game, playerID, "onTurnStart")
  }

  endTurn(playerID: string, gameID: string) {
    const context = this.getPlayerGame(playerID, gameID);
    const game = context.game;

    const playerIds = game.players.keys()
    const playerIndex = Array.from(playerIds).indexOf(playerID)
    const nextIndex = (playerIndex + 1) % game.players.size
    const nextID = playerIds[nextIndex]

    game.playerTurnID = nextID
    this.triggerUnits(game, playerID, "onTurnEnd")
  }

  getPlayerGame(playerID: string, gameID: string) {
    const game = this.getRoom(gameID);

    if (!game.players.has(playerID))
      throw new Error('player not in game');

    const isPlayer1 = playerID === game.players.entries().next().value?.[1].id
    const playerState = game.players.get(playerID) as PlayerState

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

  private triggerUnits(game: GameState, playerID: string, trigger: EffectTrigger)
  {
      const summonedUnits = game.board.filter(
    (unit): unit is UnitInstance => unit?.ownerID === playerID
    );
    summonedUnits.map((unit) => {
      unit.effects.map((effect) => {
        if (effect.trigger.includes(trigger))
        {
          effect.execute({game: game, playerId: playerID, actions: this.actions, source: unit})
        }
      })
    })
  }

  // TODO: make combat system later
  attack(playerID: string, gameID: string, attackerID: string, targetID: string)
  {
    const context = this.getPlayerGame(playerID, gameID)
    const { game } = context

    const attackerInstance = this.actions.findUnitInstance(game, attackerID)
    const targetInstance = this.actions.findUnitInstance(game, targetID)

    if (attackerInstance.ownerID != playerID || targetInstance.ownerID == playerID) throw new Error("Invalid targets")

    this.actions.dealDamageToUnitInstance(game, targetInstance, attackerInstance.atk)
    this.actions.dealDamageToUnitInstance(game, attackerInstance, targetInstance.atk)
  }
}
