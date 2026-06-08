import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { GuildSettingsFormComponent } from '../../components/guild-settings-form/guild-settings-form.component';

@Component({
  selector: 'app-guild-settings',
  imports: [GuildSettingsFormComponent, TranslocoPipe],
  templateUrl: './guild-settings.component.html',
  styleUrl: './guild-settings.component.scss',
})
export class GuildSettingsComponent {
  readonly guildId = inject(ActivatedRoute).parent!.snapshot.paramMap.get('id')!;
}
