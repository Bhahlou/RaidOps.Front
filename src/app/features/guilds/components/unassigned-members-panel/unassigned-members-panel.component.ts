import { Component, input, model } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { CharacterRaidSpecsComponent } from '../../../characters/components/character-raid-specs/character-raid-specs.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { UnassignedMember } from '../../models/raid-event.model';

/** Collapsible drawer listing guild members assigned to no raid event within the visible date range. */
@Component({
  selector: 'app-unassigned-members-panel',
  standalone: true,
  imports: [WowClassIconComponent, CharacterRaidSpecsComponent, EmptyHintComponent, NgOptimizedImage, TranslocoPipe],
  templateUrl: './unassigned-members-panel.component.html',
  styleUrl: './unassigned-members-panel.component.scss',
})
export class UnassignedMembersPanelComponent {
  readonly members = input.required<UnassignedMember[]>();
  readonly isLoading = input(false);
  readonly collapsed = model(false);

  toggle(): void {
    this.collapsed.update((c) => !c);
  }
}
