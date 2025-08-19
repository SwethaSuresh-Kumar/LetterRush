import { PlayerProgress } from "../dto/PlayerProgress";

export class Room{
    roomId: string= '';
    players: PlayerProgress[]= [];
    gameStarted: boolean= false;
    gameOver: boolean= false;
}