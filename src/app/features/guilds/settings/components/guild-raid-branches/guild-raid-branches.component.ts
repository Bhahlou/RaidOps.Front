import { Component, computed, inject, input, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { GuildBranchRaidSettingsCardComponent } from '../guild-branch-raid-settings-card/guild-branch-raid-settings-card.component';

/** Default raid signup mode configuration for every active guild branch — the "Raids" settings tab. */
@Component({
  selector: 'app-guild-raid-branches',
  imports: [GuildBranchRaidSettingsCardComponent, TranslocoPipe],
  templateUrl: './guild-raid-branches.component.html',
  styleUrl: './guild-raid-branches.component.scss',
})
export class GuildRaidBranchesComponent implements OnInit {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildBranchesStore);

  readonly activeBranches = computed(() => this.#store.branches().filter((b) => b.isActive));

  ngOnInit(): void {
    this.#store.load(this.guildId());
  }
}
