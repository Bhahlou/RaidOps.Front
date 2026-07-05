import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guild-layout',
  imports: [RouterOutlet],
  templateUrl: './guild-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guild-layout.component.scss',
})
export class GuildLayoutComponent {}
