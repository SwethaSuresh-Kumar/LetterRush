import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { GameOverData } from '../dto/GameOverData';
import { PlayerProgress, PlayerUpdate } from '../dto/PlayerProgress';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket;
  private baseURL = 'http://localhost:5000';

  constructor( private http: HttpClient) {
    this.socket = io(this.baseURL, { transports: ['websocket', 'polling'] });

    this.socket.on('connect', () => console.log('Connected to server'));
    this.socket.on('disconnect', () => console.log('Disconnected from server'));
  }

   getRooms(): Observable<any[]> {
    return this.http.get<{ rooms: any[] }>(`${this.baseURL}/rooms`).pipe(
      map((res: { rooms: any; }) => res.rooms)
    );
  }

  createRoom(username: string): Promise<{ roomId: string }> {
    return new Promise(resolve =>
      this.socket.emit('createRoom', username, (res: { roomId: string }) => resolve(res))
    );
  }

  joinRoom(roomId: string, username: string): Promise<{ success: boolean; roomId?: string; message?: string }> {
    return new Promise(resolve =>
      this.socket.emit('joinRoom', roomId, username, (res: any) => resolve(res))
    );
  }

  startGame(roomId: string) {
    this.socket.emit('startGame', roomId);
  }

  onCountdown(): Observable<number> {
    return new Observable(subscriber => {
      const handler = (num: number) => subscriber.next(num);
      this.socket.on('countdown', handler);
      return () => this.socket.off('countdown', handler);
    });
  }

  onGameStarted(): Observable<{ text: string }> {
    return new Observable(subscriber => {
      const handler = (payload: { text: string }) => subscriber.next(payload);
      this.socket.on('gameStarted', handler);
      return () => this.socket.off('gameStarted', handler);
    });
  }

  onPlayerJoined(): Observable<PlayerUpdate> {
    return new Observable(sub => {
      const handler = (players: any) => {
        const arr: PlayerProgress[] = Object.values(players).map((p: any) => ({
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

getRoomById(roomId: string): Observable<any> {
  return this.http.get<any>(`${this.baseURL}/getRoom/${roomId}`);
}



  playerFinished(roomId: string, wpm: number, completed: number) {
    this.socket.emit('playerFinished', roomId, { wpm, completed });
  }

onRoomUpdate(): Observable<PlayerUpdate> {
  return new Observable(subscriber => {
    const handler = (players: PlayerProgress[]) => {
      subscriber.next(players); // already an array
    };
    this.socket.on('roomUpdate', handler);
    return () => this.socket.off('roomUpdate', handler);
  });
}



  onPlayerUpdate(): Observable<PlayerUpdate> {
    return new Observable(sub => {
      const handler = (players: any) => {
        const arr: PlayerProgress[] = Object.values(players).map((p: any) => ({
          name: p.name,
          wpm: p.wpm || 0,
          completion: p.completed ? 100 : 0,
        }));
        sub.next(arr);
      };
      this.socket.on('playerUpdate', handler);
      return () => this.socket.off('playerUpdate', handler);
    });
  }

  onGameOver(): Observable<GameOverData> {
  return new Observable(sub => {
    const handler = (data: any) => {
      const results = Object.values(data.results || {}).map((p: any) => ({
        name: p.name,
        wpm: p.wpm || 0,
        completion: p.completed ? 100 : 0,  // ✅ match GameOverData
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
