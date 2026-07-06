import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { WowFactionIconComponent } from '../../../../shared/components/wow-faction-icon/wow-faction-icon.component';
import { BnetIconComponent } from '../../../../shared/components/bnet-icon/bnet-icon.component';
import {
  PageHeaderComponent,
  BreadcrumbItem,
} from '../../../../shared/components/page-header/page-header.component';
import { CharacterStore } from '../../stores/character.store';
import { CharacterService } from '../../services/character.service';
import { CharacterDetail } from '../../models/character-detail.model';
import { CharacterGuildsComponent } from '../../components/character-guilds/character-guilds.component';
import { CharacterGearComponent } from '../../components/character-gear/character-gear.component';
import { CharacterBisListComponent } from '../../components/character-bis-list/character-bis-list.component';
import { CharacterRaidSpecsComponent } from '../../components/character-raid-specs/character-raid-specs.component';
import { ConfirmDeactivateDialogComponent } from '../../components/confirm-deactivate-dialog/confirm-deactivate-dialog.component';
import {
  SetRaidSpecsDialogComponent,
  SetRaidSpecsDialogData,
} from '../../components/set-raid-specs-dialog/set-raid-specs-dialog.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [
    NgOptimizedImage,
    MatCard,
    MatCardContent,
    MatButtonModule,
    MatIcon,
    TranslocoPipe,
    WowClassIconComponent,
    WowFactionIconComponent,
    BnetIconComponent,
    PageHeaderComponent,
    CharacterGuildsComponent,
    CharacterGearComponent,
    CharacterBisListComponent,
    CharacterRaidSpecsComponent,
  ],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.scss',
})
export class CharacterDetailComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #characterStore = inject(CharacterStore);
  readonly #characterService = inject(CharacterService);
  readonly #authStore = inject(AuthStore);
  readonly #dialog = inject(MatDialog);
  readonly #snackbar = inject(SnackbarService);

  readonly #branch = this.#route.snapshot.paramMap.get('branch') ?? '';
  readonly #realm = this.#route.snapshot.paramMap.get('realm') ?? '';
  readonly #name = this.#route.snapshot.paramMap.get('name') ?? '';

  /** Set only when the character isn't one of the viewer's own (fetched via the read API). */
  readonly #fetchedCharacter = signal<CharacterDetail | null>(null);

  readonly #ownCharacter = computed(() =>
    this.#characterStore
      .characterList()
      .find(
        (c) =>
          c.branchName.toLowerCase().replace(/[\s_]+/g, '-') === this.#branch &&
          c.realmSlug === this.#realm &&
          c.name.toLowerCase() === this.#name,
      ),
  );

  readonly character = computed<CharacterDetail | undefined>(() => {
    const own = this.#ownCharacter();
    if (own) return { ...own, isOwner: true, canEditRaidSpecs: true };
    return this.#fetchedCharacter() ?? undefined;
  });

  readonly isOwner = computed(() => this.character()?.isOwner ?? false);
  readonly canEditRaidSpecs = computed(() => this.character()?.canEditRaidSpecs ?? false);

  readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const user = this.#authStore.user();
    const char = this.character();
    return [
      {
        label: user?.name ?? '…',
        discordIcon: user
          ? { id: user.discordId, hash: user.avatarHash, type: DiscordIconType.User }
          : undefined,
      },
      { i18nKey: 'sidenav.account.characters', link: ['/characters'] },
      { label: char?.name ?? '…' },
    ];
  });

  ngOnInit(): void {
    if (this.#ownCharacter()) return;

    this.#characterService.getCharacter(this.#branch, this.#realm, this.#name).subscribe({
      next: (detail) => this.#fetchedCharacter.set(detail),
      error: () => this.#router.navigate(['/characters']),
    });
  }

  resyncCharacter(): void {
    const id = this.character()?.id;
    if (id === undefined) return;

    this.#characterStore.resyncCharacter(id).subscribe({
      next: () => this.#snackbar.success('characters.card.resyncSuccess'),
      error: () => this.#snackbar.error('characters.card.resyncError'),
    });
  }

  deactivateCharacter(): void {
    const id = this.character()?.id;
    if (id === undefined) return;

    const dialogRef = this.#dialog.open(ConfirmDeactivateDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.#characterStore.deactivateCharacter(id).subscribe({
        next: () => this.#router.navigate(['/characters']),
        error: () => this.#snackbar.error('characters.card.deactivateError'),
      });
    });
  }

  editRaidSpecs(): void {
    const char = this.character();
    if (!char) return;

    this.#dialog
      .open(SetRaidSpecsDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '85vh',
        data: { characters: [char], mode: 'edit' } satisfies SetRaidSpecsDialogData,
      })
      .afterClosed()
      .subscribe((result?: { success?: boolean; error?: boolean }) => {
        if (result?.success) {
          this.#snackbar.success('characters.raidSpecs.submitSuccess');
        } else if (result?.error) {
          this.#snackbar.error('characters.raidSpecs.submitError');
        }
      });
  }
}
