import { CardType, GameState, Player } from "./games.types"

export class GamesService 
{
    constructor() {}
    private Rooms: GameState[] = []

    createRoom(players: Player[], gameId: string)
    {
        const [player1, player2] = players
        const room: GameState = {
            player1ID: player1.id,
            player2ID: player2.id,

            player1Deck: this.getPlayerSpells(player1),
            player2Deck: this.getPlayerSpells(player2),

            player1Hand: [],
            player2Hand: [],

            player1Bench: this.getPlayerUnits(player1),
            player2Bench: this.getPlayerUnits(player2),

            board: [],
            gameId: gameId,
            player1Turn: true
        }
        
        this.Rooms.push(room)

        return room
    }

    getRoom(gameId: string)
    {
        return this.Rooms.find(room => room.gameId == gameId)
    }

    makeMove(playerID: string, gameId: string,makeMoveData: string)
    {
        const game = this.getRoom(gameId)

        if (!game) 
        {
            console.log("no games")
            return game
        }
        if (playerID != game.player1ID && playerID != game.player2ID ) return

        const isPlayer1 = playerID == game.player1ID;
        const isPlayerTurn = isPlayer1 == game.player1Turn;

        const hand = isPlayer1 ? game.player1Hand : game.player2Hand;
        const bench = isPlayer1 ? game.player1Bench : game.player2Bench;

        if (!isPlayerTurn)
        {
            console.log("not your turn")
            return
        }

        const source = makeMoveData[0]
        const origin = Number(makeMoveData[1])
        const destination = Number(makeMoveData[2])

        const translatedDestination = isPlayer1
        ? destination
        : game.board.length - 1 - destination;

        if (destination > game.board.length + 1 || destination < 0) 
        {
            console.log("out of bounds")
            return
        }
        
        //unique "player" attack, will return for now
        if (destination == 0 || destination == game.board.length)
        {
            console.log("attack player")
            return
        }

        const sources = {
            b: bench,
            h: hand,
            c: game.board,
        };



        const card: CardType = sources[source][origin]
        if (!card) 
        {
            console.log("no card at that place")
            return
        }

        //attack logic
        if (source == "c")
        {

        } else 
        {
            if (game.board[translatedDestination] != null) 
            {
                console.log("slot taken")
                return
            }

            game.board[translatedDestination] = card
            console.log("made move")

        }

        game.player1Turn = !game.player1Turn
        return {
            made: true,
            card: card.cardName,
            position: destination
        } 
    }

    getPlayerUnits(player: Player)
    {
        return player.deck.filter((card: CardType) => card.isUnit)
    }

    getPlayerSpells(player: Player)
    {
        return player.deck.filter((card:CardType) => !card.isUnit)
    }
}