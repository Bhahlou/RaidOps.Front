import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';

/**
 * One tab per raid event in the visible date range — replaces the vertically-stacked
 * spreadsheet layout so only a single event's grid (and its `CdkDropList`s) is ever mounted.
 */
@Component({
  selector: 'app-raid-event-tabs',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './raid-event-tabs.component.html',
  styleUrl: './raid-event-tabs.component.scss',
})
export class RaidEventTabsComponent {
  readonly events = input.required<RaidEvent[]>();
  readonly activeEventId = input<number | null>(null);
  /** True for non-officer viewers — hides the "add event" tab. */
  readonly disabled = input(false);

  readonly select = output<number>();
  readonly createEvent = output<void>();

  readonly #transloco = inject(TranslocoService);
  readonly RaidStatus = RaidEventStatus;
  readonly PublicationStatus = RaidPublicationStatus;

  readonly sortedEvents = computed(() => [...this.events()].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc)));

  tabLabel(event: RaidEvent): string {
    this.#transloco.activeLang(); // depend on language changes so the label stays in sync
    const lang = this.#transloco.getActiveLang();
    const date = new Date(event.startsAtUtc);
    const dayFormatter = new Intl.DateTimeFormat(lang, { weekday: 'short', day: '2-digit', month: '2-digit' });
    const timeFormatter = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
    const zones = event.raidZones.map((z) => z.shortCode).join('/');
    const dateLabel = `${dayFormatter.format(date)} ${timeFormatter.format(date)}`;
    return zones ? `${event.name} — ${zones} — ${dateLabel}` : `${event.name} — ${dateLabel}`;
  }
}
