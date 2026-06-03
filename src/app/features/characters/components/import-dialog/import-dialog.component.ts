import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { WowFactionIconComponent } from '../../../../shared/components/wow-faction-icon/wow-faction-icon.component';
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

/** Dialog for selecting synced characters to activate in RaidOps. */
@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    TranslocoPipe,
    WowClassIconComponent,
    WowFactionIconComponent,
  ],
  templateUrl: './import-dialog.component.html',
  styleUrl: './import-dialog.component.scss',
})
export class ImportDialogComponent implements OnInit {
  readonly #service = inject(CharacterService);
  readonly #dialogRef = inject(MatDialogRef<ImportDialogComponent>);

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
    this.isActivating.set(true);
    this.#service.activateCharacters([...this.selectedIds()]).subscribe({
      next: () => this.#dialogRef.close({ activated: this.selectedCount() }),
      error: () => {
        this.isActivating.set(false);
        this.#dialogRef.close({ error: true });
      },
    });
  }

  openSync(): void {
    this.#dialogRef.close({ openSync: true });
  }
}
