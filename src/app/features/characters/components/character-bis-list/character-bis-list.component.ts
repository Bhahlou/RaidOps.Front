import { Component, input } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'app-character-bis-list',
  standalone: true,
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardTitle],
  templateUrl: './character-bis-list.component.html',
  styleUrl: './character-bis-list.component.scss',
})
export class CharacterBisListComponent {
  readonly characterId = input.required<number>();
}
