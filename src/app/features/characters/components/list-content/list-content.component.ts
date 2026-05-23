import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { BnetLinkButtonComponent } from '../../../../shared/components/bnet-link-button/bnet-link-button.component';
import { CharacterCardComponent } from '../character-card/character-card.component';
import { CharacterDto } from '../../models/character.model';

/**
 * Content area for the characters list page.
 * Handles loading/empty states and renders the character grid.
 */
@Component({
  selector: 'app-character-list-content',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslocoPipe,
    BnetLinkButtonComponent,
    CharacterCardComponent,
  ],
  templateUrl: './list-content.component.html',
  styleUrl: './list-content.component.scss',
})
export class ListContentComponent {
  readonly isBnetLoading = input.required<boolean>();
  readonly isBnetLinked = input.required<boolean>();
  readonly isCharactersLoading = input.required<boolean>();
  readonly characters = input.required<CharacterDto[]>();

  readonly linkBnet = output<string>();
  readonly openImport = output<void>();
}
