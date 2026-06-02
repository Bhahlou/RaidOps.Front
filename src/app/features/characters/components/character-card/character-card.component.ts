import { Component, input } from '@angular/core';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { WowFactionIconComponent } from '../../../../shared/components/wow-faction-icon/wow-faction-icon.component';
import { Character } from '../../models/character.model';

/** Displays a single imported WoW character as a compact card. */
@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [WowClassIconComponent, WowFactionIconComponent],
  templateUrl: './character-card.component.html',
  styleUrl: './character-card.component.scss',
})
export class CharacterCardComponent {
  readonly character = input.required<Character>();
}
