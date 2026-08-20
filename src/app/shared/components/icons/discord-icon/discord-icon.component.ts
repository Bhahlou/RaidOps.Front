import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { DiscordIconType } from '../../../models/discord-icon-type.enum';

@Component({
  selector: 'app-discord-icon',
  imports: [NgOptimizedImage],
  templateUrl: './discord-icon.component.html',
  styleUrl: './discord-icon.component.scss',
})
export class DiscordIconComponent {
  id = input.required<string>();
  hash = input<string | null>();
  type = input.required<DiscordIconType>();
  size = input<number>(36);
  /** Pre-resolved URL (e.g. a per-guild avatar override) that takes priority over id/hash. */
  overrideUrl = input<string | null>(null);

  get url() {
    if (this.overrideUrl()) return this.overrideUrl();

    const baseUrl = 'https://cdn.discordapp.com';
    if (this.hash()) {
      if (this.type() === DiscordIconType.User) {
        return `${baseUrl}/avatars/${this.id()}/${this.hash()}.png`;
      } else {
        return `${baseUrl}/icons/${this.id()}/${this.hash()}.png`;
      }
    }

    const index = Number((BigInt(this.id()) >> 22n) % 6n);
    return `${baseUrl}/embed/avatars/${index}.png`;
  }
}
