import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lobby',
  standalone: false,
  templateUrl: './lobby.html',
  styleUrl: './lobby.css'
})
export class Lobby {

  constructor(private router:Router){}

username = '';

  navigateTo(route: string, username: string) {
    this.router.navigate([route], { queryParams: { username  } });
  }

}
