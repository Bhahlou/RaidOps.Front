import { Component, computed, OnInit, inject, output, signal } from '@angular/core';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { WowFactionIconComponent } from '../../../../shared/components/icons/wow-faction-icon/wow-faction-icon.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { DialogStateComponent } from '../../../../shared/components/feedback/dialog-state/dialog-state.component';
import { CharacterService } from '../../services/character.service';
import { SyncedCharacter } from '../../models/synced-character.model';

type LoadState = 'loading' | 'idle' | 'error';

interface RealmGroup {
  realmName: string;
  characters: SyncedCharacter[];
}

interface BranchGroup {
  branchName: string;
  realms: RealmGroup[];
}

/**
 * Synced-characters picker + activation flow. Presentational — no dialog dependency, so it can be
 * reused both inside {@link ../import-dialog/import-dialog.component!ImportDialogComponent} and
 * inline in the get-started stepper. The activate/sync trigger buttons live in the host (dialog
 * footer or stepper actions) and drive this panel via its public signals/methods.
 */
@Component({
  selector: 'app-character-activation-panel',
  standalone: true,
  imports: [
    CdkAccordion,
    CdkAccordionItem,
    TranslocoPipe,
    WowClassIconComponent,
    WowFactionIconComponent,
    CheckboxComponent,
    IconButtonComponent,
    DialogStateComponent,
  ],
  templateUrl: './character-activation-panel.component.html',
  styleUrl: './character-activation-panel.component.scss',
})
export class CharacterActivationPanelComponent implements OnInit {
  readonly #service = inject(CharacterService);

  /** Emitted once the selected characters have been activated. */
  readonly activated = output<{ activated: number; activatedCharacterIds: number[] }>();
  /** Emitted when activation fails. */
  readonly activateError = output<void>();
  /** Emitted when the user wants to (re)sync from BNet instead of activating. */
  readonly openSyncRequested = output<void>();

  readonly loadState = signal<LoadState>('loading');
  readonly characters = signal<SyncedCharacter[]>([]);
  readonly searchQuery = signal('');
  readonly selectedIds = signal<Set<number>>(new Set());
  readonly isActivating = signal(false);

  /** Tracks which branch panels were manually collapsed (key = branchName). */
  readonly #collapsedBranches = signal<Set<string>>(new Set());
  /** Tracks which realm panels were manually collapsed (key = "branchName|realmName"). */
  readonly #collapsedRealms = signal<Set<string>>(new Set());

  readonly branchGroups = computed<BranchGroup[]>(() => {
    const branchMap = new Map<string, Map<string, SyncedCharacter[]>>();

    for (const char of this.characters()) {
      if (!branchMap.has(char.branchName)) branchMap.set(char.branchName, new Map());
      const realmMap = branchMap.get(char.branchName)!;
      if (!realmMap.has(char.realmName)) realmMap.set(char.realmName, []);
      realmMap.get(char.realmName)!.push(char);
    }

    return [...branchMap.entries()].map(([branchName, realmMap]) => ({
      branchName,
      realms: [...realmMap.entries()].map(([realmName, chars]) => ({
        realmName,
        characters: [...chars].sort((a, b) => b.level - a.level),
      })),
    }));
  });

  readonly filteredBranchGroups = computed<BranchGroup[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.branchGroups();

    return this.branchGroups()
      .map((branch) => ({
        ...branch,
        realms: branch.realms
          .map((realm) => ({
            ...realm,
            characters: realm.characters.filter((c) => c.name.toLowerCase().includes(query)),
          }))
          .filter((r) => r.characters.length > 0),
      }))
      .filter((b) => b.realms.length > 0);
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allAlreadyActive = computed(
    () => this.characters().length > 0 && this.characters().every((c) => c.isActive),
  );

  ngOnInit(): void {
    this.#service.getSyncedCharacters().subscribe({
      next: (chars) => {
        this.characters.set(chars);
        this.loadState.set('idle');
      },
      error: () => this.loadState.set('error'),
    });
  }

  isBranchExpanded(branchName: string): boolean {
    return !!this.searchQuery() || !this.#collapsedBranches().has(branchName);
  }

  isRealmExpanded(branchName: string, realmName: string): boolean {
    return !!this.searchQuery() || !this.#collapsedRealms().has(`${branchName}|${realmName}`);
  }

  toggleBranchPanel(branchName: string, opened: boolean): void {
    if (this.searchQuery()) return;
    const set = new Set(this.#collapsedBranches());
    opened ? set.delete(branchName) : set.add(branchName);
    this.#collapsedBranches.set(set);
  }

  toggleRealmPanel(branchName: string, realmName: string, opened: boolean): void {
    if (this.searchQuery()) return;
    const key = `${branchName}|${realmName}`;
    const set = new Set(this.#collapsedRealms());
    opened ? set.delete(key) : set.add(key);
    this.#collapsedRealms.set(set);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleCharacter(char: SyncedCharacter): void {
    if (char.isActive) return;
    const ids = new Set(this.selectedIds());
    ids.has(char.id) ? ids.delete(char.id) : ids.add(char.id);
    this.selectedIds.set(ids);
  }

  toggleAllInRealm(realm: RealmGroup): void {
    const activatable = realm.characters.filter((c) => !c.isActive);
    const allSelected = activatable.every((c) => this.selectedIds().has(c.id));
    const ids = new Set(this.selectedIds());
    for (const char of activatable) {
      allSelected ? ids.delete(char.id) : ids.add(char.id);
    }
    this.selectedIds.set(ids);
  }

  isRealmAllSelected(realm: RealmGroup): boolean {
    const activatable = realm.characters.filter((c) => !c.isActive);
    return activatable.length > 0 && activatable.every((c) => this.selectedIds().has(c.id));
  }

  isRealmIndeterminate(realm: RealmGroup): boolean {
    const activatable = realm.characters.filter((c) => !c.isActive);
    const count = activatable.filter((c) => this.selectedIds().has(c.id)).length;
    return count > 0 && count < activatable.length;
  }

  activate(): void {
    if (this.selectedCount() === 0) return;
    const activatedCharacterIds = [...this.selectedIds()];
    this.isActivating.set(true);
    this.#service.activateCharacters(activatedCharacterIds).subscribe({
      next: () => this.activated.emit({ activated: this.selectedCount(), activatedCharacterIds }),
      error: () => {
        this.isActivating.set(false);
        this.activateError.emit();
      },
    });
  }

  openSync(): void {
    this.openSyncRequested.emit();
  }
}
