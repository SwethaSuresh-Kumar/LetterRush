import { Component } from '@angular/core';
import { SocketService } from '../services/socket-service';
import { ActivatedRoute, Router } from '@angular/router';
import { Room } from '../model/rooms';

@Component({
  selector: 'app-game-lobby',
  standalone: false,
  templateUrl: './game-lobby.html',
  styleUrl: './game-lobby.css',
})
export class GameLobby {
  username = '';
  roomId = '';
  rooms: Room[] = [];
  showCreateRoom: boolean = false;

  constructor(
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.username = params['username'] || '';
    });
    this.socketService.getRooms().subscribe((rooms: Room[]) => {
      this.rooms = rooms;
    }
    );
  }

  joinRoom(roomId: string) {
    this.socketService.joinRoom(roomId, this.username).then((res) => {
      this.roomId = roomId;
      if (!res.success) alert(res.message);
      this.navigateToGame();
    });
  }

   createRoom() {
    this.socketService.createRoom(this.username).then((res) => {
      console.log(res.roomId);
      this.roomId = res.roomId;
      console.log('Room created with ID:', this.roomId);
      this.navigateToGame();
    });
   
    
  }

  navigateToGame() {
    this.router.navigate(['game'], {
      queryParams: { roomId: this.roomId, username: this.username },
    });
  }
  
}
