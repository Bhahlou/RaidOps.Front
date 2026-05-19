import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guild-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './guild-layout.component.html',
  styleUrl: './guild-layout.component.scss',
})
export class GuildLayoutComponent {}
