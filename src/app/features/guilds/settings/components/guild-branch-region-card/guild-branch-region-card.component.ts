import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildBranch, GuildBranchRegion } from '../../../models/guild-branch.model';
import { GuildBranchesService } from '../../../services/guild-branches.service';

const REGIONS: GuildBranchRegion[] = ['eu', 'us', 'kr', 'tw'];

/**
 * Blizzard API region editor for one active guild branch — determines its weekly raid-lockout
 * reset schedule. Auto-saves as soon as a region is picked from the dropdown — that event only
 * ever fires from a real user selection (see `SelectComponent.onListboxValueChange`), never from
 * the initial `ngOnInit` hydration off `branch().region`, so there's no risk of persisting a
 * value nobody actually chose.
 */
@Component({
  selector: 'app-guild-branch-region-card',
  imports: [FormFieldCardComponent, TranslocoPipe, SelectComponent],
  templateUrl: './guild-branch-region-card.component.html',
  styleUrl: './guild-branch-region-card.component.scss',
})
export class GuildBranchRegionCardComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly branch = input.required<GuildBranch>();
  readonly saved = output<void>();

  readonly #branchesService = inject(GuildBranchesService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);

  readonly region = signal<GuildBranchRegion | null>(null);
  readonly submitting = signal(false);

  readonly regionOptions = computed<SelectOption<GuildBranchRegion>[]>(() =>
    REGIONS.map((region) => ({ value: region, label: this.#transloco.translate(`guildSettings.branches.region.options.${region}`) })),
  );

  ngOnInit(): void {
    this.region.set(this.branch().region);
  }

  async onRegionChange(region: GuildBranchRegion): Promise<void> {
    this.region.set(region);
    if (region === this.branch().region) return;

    this.submitting.set(true);
    try {
      await firstValueFrom(this.#branchesService.updateRegion(this.guildId(), this.branch().id, region));
      this.#snackbar.success('guildSettings.branches.regionSettings.saveSuccess');
      this.saved.emit();
    } catch {
      this.#snackbar.error('errors.server');
    } finally {
      this.submitting.set(false);
    }
  }
}
