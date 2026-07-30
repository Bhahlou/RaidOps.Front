import { Component, computed, inject, input, model } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { buildScopeOptions, scopeToKey } from '../../utils/availability-scope.util';

/**
 * Scope picker for a declaration being created (Global or one of the user's active-character
 * branches, grouped by guild) — or, once a declaration exists, a read-only label of its scope,
 * since scope is immutable after creation (the back end drops it entirely from Update commands).
 */
@Component({
  selector: 'app-availability-scope-field',
  imports: [TranslocoPipe, SelectComponent],
  templateUrl: './availability-scope-field.component.html',
  styleUrl: './availability-scope-field.component.scss',
})
export class AvailabilityScopeFieldComponent {
  readonly #authStore = inject(AuthStore);
  readonly #transloco = inject(TranslocoService);

  /** `true` when creating (scope is pickable); `false` once a declaration exists (scope is fixed). */
  readonly editable = input.required<boolean>();
  /** The declaration's current scope, for the read-only label — ignored while `editable()`. */
  readonly guildId = input<string | null>(null);
  readonly guildBranchId = input<number | null>(null);

  /** The picked scope key while `editable()` — see {@link scopeFromKey} to read it back out. */
  readonly value = model(scopeToKey({ guildId: null, guildBranchId: null }));

  readonly options = computed<SelectOption<string>[]>(() =>
    buildScopeOptions(this.#authStore.user()?.guilds ?? [], this.#transloco.translate('calendar.scope.global')),
  );

  readonly readonlyLabel = computed(() => {
    const guildId = this.guildId();
    if (guildId === null) return this.#transloco.translate('calendar.scope.global');

    const guild = this.#authStore.user()?.guilds.find((g) => g.id === guildId);
    const branch = guild?.branches.find((b) => b.id === this.guildBranchId());
    return guild && branch ? `${guild.name} — ${branch.branchName}` : this.#transloco.translate('calendar.scope.global');
  });
}
