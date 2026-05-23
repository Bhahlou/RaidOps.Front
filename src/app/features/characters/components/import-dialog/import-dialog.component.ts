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
import { BranchDto } from '../../../../shared/models/branch.model';
import { AvailableCharacterDto, CharacterToImportDto } from '../../models/available-character.model';

type DialogStep = 'branches' | 'characters';
type LoadState = 'loading' | 'idle' | 'error';

interface RealmGroup {
  realmSlug: string;
  realmName: string;
  characters: AvailableCharacterDto[];
}

/** WoW class colors keyed by Blizzard class ID. */
const CLASS_COLORS: Record<number, string> = {
  1:  '#C69B3A', // Warrior
  2:  '#F48CBA', // Paladin
  3:  '#AAD372', // Hunter
  4:  '#FFF468', // Rogue
  5:  '#d0d0d0', // Priest
  6:  '#C41E3A', // Death Knight
  7:  '#0070DD', // Shaman
  8:  '#3FC7EB', // Mage
  9:  '#8788EE', // Warlock
  10: '#00FF98', // Monk
  11: '#FF7C0A', // Druid
  12: '#A330C9', // Demon Hunter
  13: '#33937F', // Evoker
};

/** Two-step dialog for importing WoW characters from Battle.net. */
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

  readonly step = signal<DialogStep>('branches');
  readonly loadState = signal<LoadState>('loading');

  readonly branches = signal<BranchDto[]>([]);
  readonly selectedBranch = signal<BranchDto | null>(null);

  readonly characters = signal<AvailableCharacterDto[]>([]);
  readonly searchQuery = signal('');

  /** All characters grouped by realm (unfiltered — used by toggle logic). */
  readonly realmGroups = computed<RealmGroup[]>(() => {
    const map = new Map<string, RealmGroup>();
    for (const char of this.characters()) {
      if (!map.has(char.realmSlug)) {
        map.set(char.realmSlug, { realmSlug: char.realmSlug, realmName: char.realmName, characters: [] });
      }
      map.get(char.realmSlug)!.characters.push(char);
    }
    return [...map.values()];
  });

  /** Realm groups filtered by the current search query (drives the template). */
  readonly filteredRealmGroups = computed<RealmGroup[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.realmGroups();
    return this.realmGroups()
      .map(g => ({ ...g, characters: g.characters.filter(c => c.name.toLowerCase().includes(query)) }))
      .filter(g => g.characters.length > 0);
  });

  readonly selectedIds = signal<Set<number>>(new Set());
  readonly isImporting = signal(false);
  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allCharactersAlreadyImported = computed(() =>
    this.characters().length > 0 && this.characters().every(c => c.alreadyImported),
  );

  ngOnInit(): void {
    this.#service.getBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.loadState.set('idle');
      },
      error: () => this.loadState.set('error'),
    });
  }

  selectBranch(branch: BranchDto): void {
    this.selectedBranch.set(branch);
    this.step.set('characters');
    this.loadState.set('loading');

    this.#service.getAvailableCharacters(branch.id).subscribe({
      next: (chars) => {
        this.characters.set(chars);
        this.selectedIds.set(new Set());
        this.searchQuery.set('');
        this.loadState.set('idle');
      },
      error: () => this.loadState.set('error'),
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleCharacter(char: AvailableCharacterDto): void {
    if (char.alreadyImported) return;
    const ids = new Set(this.selectedIds());
    ids.has(char.bnetCharacterId) ? ids.delete(char.bnetCharacterId) : ids.add(char.bnetCharacterId);
    this.selectedIds.set(ids);
  }

  toggleAll(group: RealmGroup): void {
    const importable = group.characters.filter(c => !c.alreadyImported);
    const allSelected = importable.every(c => this.selectedIds().has(c.bnetCharacterId));
    const ids = new Set(this.selectedIds());
    for (const char of importable) {
      allSelected ? ids.delete(char.bnetCharacterId) : ids.add(char.bnetCharacterId);
    }
    this.selectedIds.set(ids);
  }

  isGroupAllSelected(group: RealmGroup): boolean {
    return group.characters.filter(c => !c.alreadyImported).every(c => this.selectedIds().has(c.bnetCharacterId));
  }

  isGroupIndeterminate(group: RealmGroup): boolean {
    const importable = group.characters.filter(c => !c.alreadyImported);
    const count = importable.filter(c => this.selectedIds().has(c.bnetCharacterId)).length;
    return count > 0 && count < importable.length;
  }

  goBack(): void {
    this.step.set('branches');
    this.selectedBranch.set(null);
    this.characters.set([]);
    this.selectedIds.set(new Set());
    this.searchQuery.set('');
    this.loadState.set('idle');
  }

  import(): void {
    const branch = this.selectedBranch();
    if (!branch || this.selectedCount() === 0) return;

    const toImport: CharacterToImportDto[] = this.characters()
      .filter(c => this.selectedIds().has(c.bnetCharacterId))
      .map(c => ({
        bnetCharacterId: c.bnetCharacterId,
        name: c.name,
        realmSlug: c.realmSlug,
        realmName: c.realmName,
        classId: c.classId,
        raceId: c.raceId,
        faction: c.faction,
        level: c.level,
      }));

    this.isImporting.set(true);
    this.#service.importCharacters(branch.id, toImport).subscribe({
      next: () => this.#dialogRef.close({ imported: toImport.length }),
      error: () => {
        this.isImporting.set(false);
        this.#dialogRef.close({ error: true });
      },
    });
  }

  classColor(classId: number): string {
    return CLASS_COLORS[classId] ?? '#e2e2e5';
  }

}
