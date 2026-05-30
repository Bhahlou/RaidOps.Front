import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

@Component({
  selector: 'app-discord-icon',
  imports: [MatIconModule],
  templateUrl: './discord-icon.component.html',
  styleUrl: './discord-icon.component.scss',
})
export class DiscordIconComponent {
  id = input.required<string>();
  hash = input<string | null>();
  type = input.required<DiscordIconType>();

  get url() {
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
