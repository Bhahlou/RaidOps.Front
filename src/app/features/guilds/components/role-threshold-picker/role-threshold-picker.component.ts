import { Component, input, output } from '@angular/core';
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
 */
@Component({
  selector: 'app-role-threshold-picker',
  imports: [MatIconModule, MatProgressSpinnerModule, TranslocoPipe],
  templateUrl: './role-threshold-picker.component.html',
  styleUrl: './role-threshold-picker.component.scss',
})
export class RoleThresholdPickerComponent {
  readonly roles = input<DiscordRole[]>([]);
  readonly selectedRoleId = input<string | null>(null);
  readonly loading = input(false);

  readonly thresholdChange = output<string | null>();

  isIncluded(role: DiscordRole): boolean {
    const thresholdId = this.selectedRoleId();
    if (!thresholdId) return false;
    const roles = this.roles();
    return roles.findIndex((r) => r.id === role.id) <= roles.findIndex((r) => r.id === thresholdId);
  }

  isThreshold(role: DiscordRole): boolean {
    return role.id === this.selectedRoleId();
  }

  isExcluded(role: DiscordRole): boolean {
    const thresholdId = this.selectedRoleId();
    if (!thresholdId) return false;
    const roles = this.roles();
    return roles.findIndex((r) => r.id === role.id) > roles.findIndex((r) => r.id === thresholdId);
  }

  select(roleId: string): void {
    this.thresholdChange.emit(this.selectedRoleId() === roleId ? null : roleId);
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
