import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'app-character-gear',
  standalone: true,
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardTitle],
  templateUrl: './character-gear.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-gear.component.scss',
})
export class CharacterGearComponent {
  readonly characterId = input.required<number>();
}
