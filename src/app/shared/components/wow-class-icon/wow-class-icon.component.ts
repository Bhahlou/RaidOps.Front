import { Component, input } from '@angular/core';

/** Blizzard CDN icon slug keyed by class ID. */
const CLASS_ICON_NAMES: Record<number, string> = {
  1:  'warrior',
  2:  'paladin',
  3:  'hunter',
  4:  'rogue',
  5:  'priest',
  6:  'deathknight',
  7:  'shaman',
  8:  'mage',
  9:  'warlock',
  10: 'monk',
  11: 'druid',
  12: 'demonhunter',
  13: 'evoker',
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
  styleUrl: './wow-class-icon.component.scss',
})
export class WowClassIconComponent {
  readonly classId   = input.required<number>();
  readonly className = input('');
  /** Side length in pixels. The icon is always square. */
  readonly size      = input(24);

  get iconUrl(): string {
    const name = CLASS_ICON_NAMES[this.classId()];
    return name ? `https://render.worldofwarcraft.com/us/icons/56/classicon_${name}.jpg` : '';
  }
}
