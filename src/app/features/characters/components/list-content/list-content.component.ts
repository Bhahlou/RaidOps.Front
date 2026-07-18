import { Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BnetLinkButtonComponent } from '../../../../shared/components/buttons/bnet-link-button/bnet-link-button.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { CharacterCardComponent } from '../character-card/character-card.component';
import { Character } from '../../models/character.model';
import { BranchGroup } from '../../models/branch-group.model';

/**
 * Content area for the characters list page.
 * Handles loading/empty states and renders characters grouped by branch and realm.
 */
@Component({
  selector: 'app-character-list-content',
  standalone: true,
  imports: [TranslocoPipe, BnetLinkButtonComponent, ButtonComponent, CharacterCardComponent],
  templateUrl: './list-content.component.html',
  styleUrl: './list-content.component.scss',
})
export class ListContentComponent {
  readonly isBnetLoading = input.required<boolean>();
  readonly isBnetLinked = input.required<boolean>();
  readonly isCharactersLoading = input.required<boolean>();
  readonly characters = input.required<Character[]>();

  readonly linkBnet = output<string>();
  readonly openImport = output<void>();
  readonly deactivateCharacter = output<number>();
  readonly resyncCharacter = output<number>();
  readonly editRaidSpecs = output<number>();

  readonly branchGroups = computed<BranchGroup[]>(() => {
    const branches = new Map<string, Map<string, Character[]>>();
    for (const char of this.characters()) {
      if (!branches.has(char.branchName)) branches.set(char.branchName, new Map());
      const realms = branches.get(char.branchName)!;
      if (!realms.has(char.realmName)) realms.set(char.realmName, []);
      realms.get(char.realmName)!.push(char);
    }
    return Array.from(branches.entries()).map(([branchName, realms]) => ({
      branchName,
      realms: Array.from(realms.entries()).map(([realmName, characters]) => ({
        realmName,
        characters,
      })),
    }));
  });
}
