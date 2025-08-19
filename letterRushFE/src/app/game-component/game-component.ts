import { Component } from '@angular/core';
import { SocketService } from '../services/socket-service';
import { PlayerProgress, PlayerUpdate } from '../dto/PlayerProgress';
import { GameOverData } from '../dto/GameOverData';
import { ActivatedRoute, Router } from '@angular/router';
import { Room } from '../model/rooms';

@Component({
  selector: 'app-game-component',
  standalone: false,
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  roomId = '';
  username = '';
  players: PlayerProgress[] = [];
  countdown: number | null = null;
  gameStarted = false;
  gameOver = false;
  text = 'This is a sample sentence for your typing game.';
  typedText = '';
  roomData: Room = new Room();

  constructor(
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.roomId = params['roomId'] || '';
      this.socketService.getRoomById(this.roomId).subscribe((room: Room) => {
        this.roomData = room;
        console.log(room);
      });
    });

    this.socketService.onRoomUpdate().subscribe((data: PlayerUpdate) => {
      this.players = data; // data is already PlayerProgress[]
    });

    this.socketService.onCountdown().subscribe((num) => (this.countdown = num));

    // Start game
    this.socketService.onGameStarted().subscribe((payload) => {
      this.gameStarted = true;
      this.text = payload.text;
      this.countdown = null;
    });

    // Player updates (wpm & completion)
    this.socketService
      .onPlayerUpdate()
      .subscribe((players: PlayerProgress[]) => {
        this.players = players;
      });

    // Game over
    this.socketService.onGameOver().subscribe((data: GameOverData) => {
      this.gameOver = true;
      this.players = data.results;
      this.gameStarted = false;
    });
  }

  startGame() {
    if (this.roomId) this.socketService.startGame(this.roomId);
  }

  onTyping() {
    if (!this.gameStarted) return;

    const wordsTyped = this.typedText.trim().split(/\s+/).length;
    const totalWords = this.text.split(/\s+/).length;
    const completed = Math.min((wordsTyped / totalWords) * 100, 100);

    const minutes = 1 / 60; // For example, if using elapsed time dynamically, replace this
    const wpm = Math.round(wordsTyped / minutes);

    this.socketService.playerFinished(this.roomId, wpm, completed);

    // Optionally, emit progress to other players
    this.socketService.socket.emit('playerUpdate', {
      name: this.username,
      wpm,
      completed,
    });
  }
}
