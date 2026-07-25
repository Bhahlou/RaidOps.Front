import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export interface TabDefinition {
  id: string;
  /** i18n key, resolved via the `transloco` pipe in the template — never a pre-resolved string (see `TranslocoService.translate()` gotcha below). */
  labelKey: string;
}

/**
 * Presentational tab strip, same philosophy as StepperHeaderComponent: it only renders the
 * strip and emits selection — the consumer owns the active tab signal and renders panels itself
 * via `@if`/`@switch`, so this stays a single-responsibility UI piece with no panel/content
 * projection machinery.
 *
 * Labels are i18n keys resolved via the `transloco` pipe, not pre-resolved strings: a consumer
 * calling `TranslocoService.translate()` inside a `computed()` would freeze on the raw key if
 * translations aren't loaded yet on first read, since `translate()` isn't itself a tracked signal
 * — `computed()` has nothing to react to and never recomputes.
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly tabs = input.required<TabDefinition[]>();
  readonly activeTabId = input.required<string>();

  readonly tabChange = output<string>();

  select(id: string): void {
    if (id !== this.activeTabId()) this.tabChange.emit(id);
  }
}
