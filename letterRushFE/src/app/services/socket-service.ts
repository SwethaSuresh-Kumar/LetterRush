import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket :Socket;
  
  private baseURL = 'http://localhost:5000';

  constructor(){
    this.socket = io(this.baseURL);
    this.socket.on('connect', () => {
      console.log('Connected to server');
    }
    );
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    }
    );

  }
  sendPing() {
    this.socket.emit('ping');
  }

  onPong(): Observable<void> {
    return new Observable((subscriber) => {
      this.socket.on('pong', () => {
        subscriber.next();
      });
    });
  }
  
}
