import { OnModuleInit } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from 'socket.io'
import { MatchMakingService } from "../matchmaking/matchmaking.service";
import { Socket } from "socket.io"
import { JwtService } from "@nestjs/jwt";
import { GamesService } from "./games.service";
import { CardType } from "./games.types";

@WebSocketGateway()
export class GameGateway implements OnModuleInit
{
    constructor(
        private _gamesService: GamesService,
        private _matchMakingService: MatchMakingService,
        private _jwtService: JwtService,
    )
     {}
    @WebSocketServer()
    server: Server

    onModuleInit()
    {
        this.server.on('connection', (socket) => {
            socket.on("disconnect", (reason) => {
                this._matchMakingService.removeFromQueue(socket.id)
            })
        })
    }

        afterInit(server: Server)
    {
        server.use((socket, next) => {
            const token = socket.handshake.auth.token;

            try {
                const payload = this._jwtService.verify(token);

                socket.data.userId = payload.sub;
                socket.data.username = payload.username

                next();
            }
            catch
            {
                next(new Error("Unauthorized"));
            }
        });
    }


    @SubscribeMessage('queue')
    onQueue(client: Socket, deck: CardType[])
    {
        const match = this._matchMakingService.addIntoQueue(client.id, deck)
        client.data.deck = deck
        if (!match) return

        const [player1id, player2id] = match.players

        const player1 = this.server.sockets.sockets.get(player1id)
        const player2 = this.server.sockets.sockets.get(player2id)

        if (!player1 || !player2) throw new Error("couldn't get the players to match")

        player1.data.gameId = match.gameId
        player2.data.gameId = match.gameId

        player1.join(match.gameId)
        player2.join(match.gameId)

        this.server
            .to(match.gameId)
            .emit('match_start', {
                players: [player1.data.username, player2.data.username],
                gameId: match.gameId,
                firstTurn: player1.id
            });
        
        this._gamesService.createRoom([{id: player1id, deck: player1.data.deck}, {id: player2id, deck: player2.data.deck}], match.gameId)
    }

    @SubscribeMessage('leave_queue')
    onLeaveQueue(client: Socket)
    {
        this._matchMakingService.removeFromQueue(client.id)
    }

    @SubscribeMessage('make_move')
    makeMove(client: Socket, makeMoveData: string)
    {
        const move = this._gamesService.makeMove(client.id, client.data.gameId, makeMoveData)
        if (!move)
        {
            client.emit("invalid")
            return
        }
        
        this.server.to(client.data.gameId).emit("made_move", {
            cardName: move.card,
            destination: move.position
        })
    }
}