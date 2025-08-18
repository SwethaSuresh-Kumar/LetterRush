import { Component } from '@angular/core';
import { SocketService } from './services/socket-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected title = 'letterRush';
   pongReceived = false;

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.onPong().subscribe(() => {
      this.pongReceived = true;
    });
  }

  testConnection() {
    this.socketService.sendPing();
  }
}
