import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { GameOverData } from '../dto/GameOverData';
import { Player } from '../dto/Player';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';


@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket;
  arr:Player[]=[];
private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {
    this.socket = io(this.baseUrl, { transports: ['websocket', 'polling'] });

    this.socket.on('connect', () => console.log('Connected to server'));
    this.socket.on('disconnect', () => console.log('Disconnected from server'));
  }

  getRooms(): Observable<any[]> {
    return this.http
      .get<{ rooms: any[] }>(`${this.baseUrl}/rooms`)
      .pipe(map((res: { rooms: any }) => res.rooms));
  }

  createRoom(username: string): Promise<{ roomId: string }> {
    return new Promise((resolve) =>
      this.socket.emit('createRoom', username, (res: { roomId: string }) =>
        resolve(res)
      )
    );
  }

  onLeaveRoom(roomId:string):Promise<{roomId:string}>{
    return new Promise((resolve)=>{
      this.socket.emit('leaveRoom', roomId, (res:{roomId:string})=>{
        resolve(res)
      })
    });
  }

  joinRoom(
    roomId: string,
    username: string
  ): Promise<{ success: boolean; roomId?: string; message?: string }> {
    return new Promise((resolve) =>
      this.socket.emit('joinRoom', roomId, username, (res: any) => resolve(res))
    );
  }

  startGame(roomId: string) {
    this.socket.emit('startGame', roomId);
  }

  onCountdown(): Observable<number> {
    return new Observable((subscriber) => {
      const handler = (num: number) => subscriber.next(num);
      this.socket.on('countdown', handler);
      return () => this.socket.off('countdown', handler);
    });
  }

  onGameStarted(): Observable<{ text: string }> {
    return new Observable((subscriber) => {
      const handler = (payload: { text: string }) => subscriber.next(payload);
      this.socket.on('gameStarted', handler);
      return () => this.socket.off('gameStarted', handler);
    });
  }

  onPlayerJoined(): Observable<Player[]> {
    return new Observable((sub) => {
      const handler = (players: any) => {
        const arr: Player[] = Object.values(players).map((p: any) => ({
          name: p.name,
          wpm: p.wpm || 0,
          completion: p.completed ? 100 : 0,
        }));
        sub.next(arr);
      };
      this.socket.on('playerJoined', handler);
      return () => this.socket.off('playerJoined', handler);
    });
  }

sendProgress(roomId: string, progress: Player) {
  console.log(`Sending progress for room ${roomId}:`, progress);
  this.socket.emit('playerProgress', { roomId, progress });
}


  getRoomById(roomId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getRoom/${roomId}`);
  }


  playerFinished(roomId: string, wpm: number, completed: number) {
    this.socket.emit('playerFinished', roomId, { wpm, completed });
  }

  onRoomUpdate(): Observable<Player[]> {
    return new Observable((subscriber) => {
      const handler = (players: Player[]) => {
        subscriber.next(players); // already an array
      };
      this.socket.on('roomUpdate', handler);
      return () => this.socket.off('roomUpdate', handler);
    });
  }

onPlayerUpdate(): Observable<Player[]> {

  return new Observable((sub) => {
    const handler = (players: Array<{ name: string; wpm?: number; completion?: number }>) => {
      this.arr= players.map((p) => ({
        name: p.name,
        wpm: p.wpm ?? 0,
        completion: p.completion ?? 0,
      }));
      sub.next(this.arr);
    };

    console.log('Player update received in service:', this.arr); // ✅ log here
    this.socket.on("playerUpdate", handler);
    return () => {
      this.socket.off("playerUpdate", handler);
    };
  });
}



  onGameOver(): Observable<GameOverData> {
    return new Observable((sub) => {
      const handler = (data: any) => {
        const results = Object.values(data.results || {}).map((p: any) => ({
          name: p.name,
          wpm: p.wpm || 0,
          completion: p.completed ? 100 : 0, // ✅ match GameOverData
        }));

        const winner = {
          name: data.winner.name,
          wpm: data.winner.wpm || 0,
          completion: data.winner.completed ? 100 : 0,
        };

        sub.next({ winner, results });
      };
      this.socket.on('gameOver', handler);
      return () => this.socket.off('gameOver', handler);
    });
  }
}
