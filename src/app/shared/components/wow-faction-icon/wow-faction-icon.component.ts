import { Component, input, ChangeDetectionStrategy } from '@angular/core';

const FACTION_ICONS: Record<string, string> = {
  ALLIANCE:
    'https://static.wikia.nocookie.net/wowpedia/images/7/7e/Alliance_64.png/revision/latest?cb=20110620204931',
  HORDE:
    'https://static.wikia.nocookie.net/wowpedia/images/9/92/Horde_64.png/revision/latest?cb=20110620204931',
};

/**
 * Renders a WoW faction icon (Alliance / Horde).
 * Always occupies its layout space — renders invisibly for unknown/neutral factions
 * so grid and flex parents keep their structure intact.
 */
@Component({
  selector: 'app-wow-faction-icon',
  standalone: true,
  imports: [],
  templateUrl: './wow-faction-icon.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './wow-faction-icon.component.scss',
})
export class WowFactionIconComponent {
  readonly faction = input.required<string>();
  /** Side length in pixels. The icon is always square. */
  readonly size = input(20);

  get iconUrl(): string {
    return FACTION_ICONS[this.faction().toUpperCase()] ?? '';
  }
}
