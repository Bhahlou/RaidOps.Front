import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordRole } from '../../../../shared/models/discord-role.model';
import { formatDiscordColor } from '../../../../shared/utils/discord-color.util';

/**
 * Discord-role position threshold picker: the selected role and every role above it in the
 * Discord hierarchy are "included", everything below is "excluded". Shared between the roster
 * access threshold and the Officer access threshold — the meaning of "included" is entirely up
 * to the caller, this component only renders the list and reports the selected role ID.
 *
 * Implements Signal Forms' FormValueControl so it can be bound directly via [formField].
 */
@Component({
  selector: 'app-role-threshold-picker',
  imports: [MatIconModule, MatProgressSpinnerModule, TranslocoPipe],
  templateUrl: './role-threshold-picker.component.html',
  styleUrl: './role-threshold-picker.component.scss',
})
export class RoleThresholdPickerComponent implements FormValueControl<string | null> {
  readonly roles = input<DiscordRole[]>([]);
  readonly loading = input(false);

  readonly value = model<string | null>(null);

  isIncluded(role: DiscordRole): boolean {
    const thresholdId = this.value();
    if (!thresholdId) return false;
    const roles = this.roles();
    return roles.findIndex((r) => r.id === role.id) <= roles.findIndex((r) => r.id === thresholdId);
  }

  isThreshold(role: DiscordRole): boolean {
    return role.id === this.value();
  }

  isExcluded(role: DiscordRole): boolean {
    const thresholdId = this.value();
    if (!thresholdId) return false;
    const roles = this.roles();
    return roles.findIndex((r) => r.id === role.id) > roles.findIndex((r) => r.id === thresholdId);
  }

  select(roleId: string): void {
    this.value.set(this.value() === roleId ? null : roleId);
  }

  roleColor(role: DiscordRole): string | null {
    return formatDiscordColor(role.color);
  }

  roleIconUrl(role: DiscordRole): string | null {
    return role.iconHash
      ? `https://cdn.discordapp.com/role-icons/${role.id}/${role.iconHash}.webp?size=32`
      : null;
  }
}
