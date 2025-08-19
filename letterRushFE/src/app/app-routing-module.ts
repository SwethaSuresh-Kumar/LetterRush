import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game-component/game-component';
import { Lobby } from './lobby/lobby';
import { GameLobby } from './game-lobby/game-lobby';

const routes: Routes = [
  {path:'',component:Lobby},
  {path:'game-lobby', component:GameLobby},
  {path:'game', component:GameComponent},
  {path:'join-game',component:GameLobby}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
