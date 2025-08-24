import { Component } from '@angular/core';
import { SocketService } from '../services/socket-service';
import { Player } from '../dto/Player';
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
  players: Player[] = [];
  countdown: number | null = null;
  gameStarted = false;
  gameOver = false;
  text = '';
  typedText = '';
  roomData: Room = new Room();
  winner: any;
  startTime: number | undefined;

  constructor(
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.roomId = params['roomId'] || '';
      this.username = params['username'] || '';
      this.socketService.getRoomById(this.roomId).subscribe((room: Room) => {
        this.roomData = room;
        console.log(room);
      });
    });
      this.socketService.onGameOver().subscribe((data) => {
      this.winner = data.winner;
      alert(`🎉 Game Over! Winner: ${data.winner.name}`);
      this.gameStarted = false;
    });
    this.socketService.onCountdown().subscribe((num) => (this.countdown = num));
    this.socketService.onGameStarted().subscribe((payload) => {
      this.gameStarted = true;
      console.log(payload.text);
      this.text = payload.text;
      this.countdown = null;
    });
    this.socketService.onPlayerUpdate().subscribe((players: Player[]) => {
        this.players = players;
      });
    this.socketService.onPlayerJoined().subscribe((players) => {
      this.players = players;
    });
  }

  startGame() {
    if (this.roomId) this.socketService.startGame(this.roomId);
  }

calculateWPM(typedText: string, referenceText: string, elapsedMinutes: number): number {
  let correctChars = 0;
  for (let i = 0; i < typedText.length && i < referenceText.length; i++) {
    if (typedText[i] === referenceText[i]) {
      correctChars++;
    } else {
      break;
    }
  }
  const wordsTyped = correctChars / 5;
  return Math.max(0, Math.round(wordsTyped / elapsedMinutes));
}

calculateCompletion(typedText: string, referenceText: string): number {
  let correctChars = 0;
  for (let i = 0; i < typedText.length && i < referenceText.length; i++) {
    if (typedText[i] === referenceText[i]) {
      correctChars++;
    } else {
      break;
    }
  }
  return Math.min(Math.round((correctChars / referenceText.length) * 100), 100);
}


onTyping() {
  if (!this.startTime) this.startTime = Date.now();
  console.log(this.players);
  const elapsedMinutes = (Date.now() - this.startTime) / 60000;
  const wpm = this.calculateWPM(this.typedText, this.text, elapsedMinutes);
  const completion = this.calculateCompletion(this.typedText, this.text);
  if (completion >= 100) {
    this.socketService.playerFinished(this.roomId, wpm, completion);
    this.gameOver = true;
  }
  this.socketService.sendProgress(this.roomId, {
    name: this.username,
    wpm,
    completion
  });
     this.socketService.onPlayerUpdate().subscribe((players) => {
    this.players = players;
  });
}

  getHighlightedText() {
    let result = '';
    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i];
      if (i < this.typedText.length) {
        if (char === this.typedText[i]) {
          result += `<span class="correct">${char}</span>`;
        } else {
          result += `<span class="wrong">${char}</span>`;
        }
      } else {
        result += char;
      }
    }
    return result;
  }

  navigateTo(route:string){
    this.text='';
    this.socketService.onLeaveRoom(this.roomId);
    this.router.navigate([route]);
  }
}
