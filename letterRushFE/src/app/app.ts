import { Component } from '@angular/core';
import { SocketService } from './services/socket-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
title = 'Letter Rush';
}
