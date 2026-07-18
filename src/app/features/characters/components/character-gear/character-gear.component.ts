import { Component, input } from '@angular/core';

@Component({
  selector: 'app-character-gear',
  standalone: true,
  imports: [],
  templateUrl: './character-gear.component.html',
  styleUrl: './character-gear.component.scss',
})
export class CharacterGearComponent {
  readonly characterId = input.required<number>();
}
