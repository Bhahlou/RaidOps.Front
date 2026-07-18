import { Component, input } from '@angular/core';

@Component({
  selector: 'app-character-bis-list',
  standalone: true,
  imports: [],
  templateUrl: './character-bis-list.component.html',
  styleUrl: './character-bis-list.component.scss',
})
export class CharacterBisListComponent {
  readonly characterId = input.required<number>();
}
