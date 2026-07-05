import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterSpec } from '../../models/character-spec.model';

/** Renders a character's raid-viable specs as a row of icon badges, main spec highlighted. */
@Component({
  selector: 'app-character-raid-specs',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './character-raid-specs.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-raid-specs.component.scss',
})
export class CharacterRaidSpecsComponent {
  readonly specs = input.required<CharacterSpec[]>();
}
