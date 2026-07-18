import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { WowFactionIconComponent } from '../../../../shared/components/icons/wow-faction-icon/wow-faction-icon.component';
import { BnetIconComponent } from '../../../../shared/components/icons/bnet-icon/bnet-icon.component';
import { CharacterRaidSpecsComponent } from '../character-raid-specs/character-raid-specs.component';
import { Character } from '../../models/character.model';

/** Displays a single imported WoW character as a compact card with a context menu. */
@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLink,
    WowClassIconComponent,
    WowFactionIconComponent,
    BnetIconComponent,
    CharacterRaidSpecsComponent,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    TranslocoPipe,
  ],
  templateUrl: './character-card.component.html',
  styleUrl: './character-card.component.scss',
})
export class CharacterCardComponent {
  readonly character = input.required<Character>();

  readonly resync = output<void>();
  readonly deactivate = output<void>();
  readonly editRaidSpecs = output<void>();

  readonly charRoute = computed(() => {
    const c = this.character();
    const branch = c.branchName.toLowerCase().replace(/[\s_]+/g, '-');
    return ['/characters', branch, c.realmSlug, c.name.toLowerCase()];
  });
}
