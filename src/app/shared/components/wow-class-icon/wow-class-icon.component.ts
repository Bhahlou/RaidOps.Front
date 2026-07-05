import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/** Blizzard CDN icon slug keyed by class ID. */
const CLASS_ICON_NAMES: Record<number, string> = {
  1: 'warrior',
  2: 'paladin',
  3: 'hunter',
  4: 'rogue',
  5: 'priest',
  6: 'deathknight',
  7: 'shaman',
  8: 'mage',
  9: 'warlock',
  10: 'monk',
  11: 'druid',
  12: 'demonhunter',
  13: 'evoker',
};

/** Official Blizzard class colors keyed by class ID. */
export const CLASS_COLORS: Record<number, string> = {
  1: '#C79C6E',
  2: '#F58CBA',
  3: '#ABD473',
  4: '#FFF569',
  5: '#FFFFFF',
  6: '#C41F3B',
  7: '#0070DE',
  8: '#69CCF0',
  9: '#9482C9',
  10: '#00FF96',
  11: '#FF7D0A',
  12: '#A330C9',
  13: '#33937F',
};

/**
 * Renders a WoW class icon from the Blizzard CDN.
 * Accepts a `classId` (Blizzard's numeric ID), an optional `className` for
 * accessibility, and an optional `size` in pixels (default: 24).
 */
@Component({
  selector: 'app-wow-class-icon',
  standalone: true,
  imports: [],
  templateUrl: './wow-class-icon.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './wow-class-icon.component.scss',
})
export class WowClassIconComponent {
  readonly classId = input.required<number>();
  readonly className = input('');
  /** Side length in pixels. The icon is always square. */
  readonly size = input(24);

  get iconUrl(): string {
    const name = CLASS_ICON_NAMES[this.classId()];
    return name ? `https://render.worldofwarcraft.com/us/icons/56/classicon_${name}.jpg` : '';
  }
}
