import { UnitInstance, SpellInstance } from '../cards/cards.types'
import { CardsService } from '../cards/cards.service'
import { EFFECT_TRIGGERS, EffectTrigger } from '../effects/effects.types'
import { GameActions } from './logic/gameActions'
import PlayUnitDto from "./dto/play-unit.dto"
import { GameState, ClientPlayerData, PlayerState, GamePhase } from '../games/shared/games.types'

export class GamesService {
  private Rooms: GameState[] = [];

  private readonly actions: GameActions;

  constructor(private readonly _cardsService: CardsService) {
  }

  createRoom(players: PlayerState[], gameID: string) {
    const [player1, player2] = players;

    const player1State = this.initializePlayerState(player1);
    const player2State = this.initializePlayerState(player2);

    const room: GameState = {
      players: new Map([
        [player1.socketId, player1State],
        [player2.socketId, player2State]
      ]),
      board: [],
      gameId: gameID,
      playerTurnId: player1.socketId,
      gamePhase: GamePhase.PLAY,
      shop: []
    };

    this.Rooms.push(room);

    return room;
  }

  private initializePlayerState(player: PlayerState) {
    //there is no deck field for player now
    const player1Cards = player.map((cardId) =>
      this._cardsService.createUnitInstance(cardId, player.socketId),
    );

    const playerState: PlayerState = {
      deck: player1Cards,
      hp: 20,
      bench: [],
      hand: [],
      id: player.socketId,
    };

    return playerState;
  }

  getRoom(gameID: string) {
    const game = this.Rooms.find((room) => room.gameId == gameID);
    if (!game) throw new Error("Game doesn't exist");
    return game;
  }

  placeUnit(playerID: string, gameID: string, placeUnitData: PlayUnitDto) {
    const context = this.getPlayerGame(playerID, gameID);
    const { isPlayer1, bench, game } = context;

    const { instanceId, boardIndex } = placeUnitData;

    const translatedDestination = isPlayer1
      ? boardIndex
      : game.board.length - 1 - boardIndex;

    this.throwIfPlaceUnitInvalid(game, translatedDestination);

    const card: UnitInstance | undefined = bench.find((card) => {
      card.id == instanceId;
    });
    if (!card) throw new Error("card doesn't exist");

    game.board[translatedDestination] = card;

    return {
      card: card,
      position: boardIndex,
    };
  }

  attack(playerID: string, gameID: string, attackerID: string, targetID: string)
  {
    const context = this.getPlayerGame(playerID, gameID)
    const { game } = context

    const attackerInstance = this.actions.findUnitInstance(game, attackerID)
    const targetInstance = this.actions.findUnitInstance(game, targetID)

    if (attackerInstance.ownerID != playerID || targetInstance.ownerID == playerID) throw new Error("Invalid targets")

    this.actions.damageUnit(targetInstance.id, attackerInstance.atk)
    this.actions.damageUnit(attackerInstance.id, targetInstance.atk)
  }

  private throwIfPlaceUnitInvalid(game: GameState, boardIndex: number) {
    if (boardIndex > game.board.length || boardIndex < 0)
      throw new Error('out of bounds');
    if (game.board[boardIndex] != null) throw new Error('slot taken');
  }

  startTurn(playerID: string, gameID: string)
  {
    const context = this.getPlayerGame(playerID, gameID)
    const game = context.game

    //this.triggerUnits(game, playerID, EFFECT_TRIGGERS.TURN_START)
  }

  endTurn(playerID: string, gameID: string) {
    const context = this.getPlayerGame(playerID, gameID);
    const game = context.game;

    const playerIds = game.players.keys()
    const playerIndex = Array.from(playerIds).indexOf(playerID)
    const nextIndex = (playerIndex + 1) % game.players.size
    const nextID = playerIds[nextIndex]

    game.playerTurnId = nextID
    //this.triggerUnits(game, playerID, EFFECT_TRIGGERS.TURN_END)
  }

  getPlayerGame(playerID: string, gameID: string) {
    const game = this.getRoom(gameID);

    if (
      !game.players.has(playerID)
    )
      throw new Error('player not in game');

    const isPlayer1 = playerID === game.players.entries().next().value?.[1].socketId
    const playerState = game.players[playerID]
    const isPlayerTurn = game.playerTurnId == playerID

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

  // private triggerUnits(game: GameState, playerID: string, trigger: EffectTrigger)
  // {
  //   const summonedUnits = game.board.filter(
  //     (unit): unit is UnitInstance => unit?.ownerId === playerID
  //   );
    
  //   summonedUnits.map((unit) => {
  //     unit.effects.map((effect) => {
  //       if (effect.trigger.includes(trigger))
  //       {
  //         e
  //       }
  //     })
  //   })
  // }
}
