import { Player } from "../dto/Player";

export class Room{
    roomId: string= '';
    players: Player[]= [];
    gameStarted: boolean= false;
    gameOver: boolean= false;
}