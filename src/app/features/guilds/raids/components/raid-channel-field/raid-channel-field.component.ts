import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { DiscordChannel } from '../../../../../shared/models/discord-channel.model';
import { DiscordCategory } from '../../../../../shared/models/discord-category.model';
import { buildRaidChannelName } from '../../utils/raid-channel-name.util';

export type RaidChannelMode = 'existing' | 'new';

/**
 * The "dedicated Discord channel" field-group shared by the create/edit raid event dialogs and the
 * raid series dialog — existing/new toggle, existing-channel picker, and the category+name pair for
 * creating one on the fly. The parent owns fetching `channels`/`categories` and actually creating
 * the channel at submit time — this component is presentation + the auto-suggestion only, mirroring
 * `RaidZoneFieldComponent`.
 *
 * The name field (auto-suggested from `raidName`/`startsAtLocal`/`guildLanguage`, editable) only
 * makes sense when "new" means "create one channel right now" (the event dialogs) — for the series
 * dialog, "new" instead means "auto-create a fresh channel per materialized occurrence", so there's
 * no name to type up front; set `showNewChannelName` to `false` to hide it and skip the suggestion.
 */
@Component({
  selector: 'app-raid-channel-field',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, SelectComponent],
  templateUrl: './raid-channel-field.component.html',
  styleUrl: './raid-channel-field.component.scss',
})
export class RaidChannelFieldComponent {
  readonly channels = input.required<DiscordChannel[]>();
  readonly categories = input.required<DiscordCategory[]>();
  readonly canCreateRootChannel = input.required<boolean>();

  readonly showNewChannelName = input(true);
  /** Only meaningful when `showNewChannelName` is true. */
  readonly raidName = input('');
  readonly startsAtLocal = input('');
  readonly guildLanguage = input('en');
  /** Optional descriptive text shown under the toggle while in "new" mode (e.g. explaining the per-occurrence behavior for a series). */
  readonly newChannelHint = input<string | null>(null);

  readonly channelMode = model.required<RaidChannelMode>();
  readonly selectedChannelId = model.required<string | null>();
  readonly selectedCategoryId = model.required<string | null>();
  readonly newChannelName = model.required<string>();

  /** Whether the bot can create a channel at the currently selected category (or root) — lets the parent gate submit before Discord returns a 403. */
  readonly canCreateAtSelectionChange = output<boolean>();

  readonly #newChannelNameTouched = signal(false);

  readonly channelOptions = computed<SelectOption<string>[]>(() =>
    [...this.channels()]
      .sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? '') || a.name.localeCompare(b.name))
      .map((c) => ({ value: c.id, label: c.missingPermissions.length === 0 ? c.name : `⚠️ ${c.name}`, group: c.categoryName ?? undefined })),
  );

  readonly categoryOptions = computed<SelectOption<string>[]>(() =>
    [...this.categories()].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: c.canCreateChannel ? c.name : `⚠️ ${c.name}` })),
  );

  readonly canCreateAtSelection = computed(() => {
    const categoryId = this.selectedCategoryId();
    if (categoryId === null) return this.canCreateRootChannel();
    return this.categories().find((c) => c.id === categoryId)?.canCreateChannel ?? true;
  });

  constructor() {
    effect(() => {
      if (!this.showNewChannelName()) return;
      const suggestion = buildRaidChannelName(this.raidName(), this.startsAtLocal(), this.guildLanguage());
      if (!this.#newChannelNameTouched()) this.newChannelName.set(suggestion);
    });
    effect(() => this.canCreateAtSelectionChange.emit(this.canCreateAtSelection()));
  }

  onNewChannelNameInput(value: string): void {
    this.#newChannelNameTouched.set(true);
    this.newChannelName.set(value);
  }
}
