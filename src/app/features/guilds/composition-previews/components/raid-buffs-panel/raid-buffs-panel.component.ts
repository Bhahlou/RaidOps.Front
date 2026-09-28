import { Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidBuffDefinition } from '../../../../../shared/models/raid-buff-definition.model';
import { raidBuffLabel, raidBuffSpellName } from '../../../../../shared/utils/raid-buff.util';
import { RaidBuffCoverage, RaidBuffCoverageItem } from '../../utils/raid-buff-coverage.util';

interface PanelSection {
  key: 'buffs' | 'debuffs' | 'individual';
  items: RaidBuffCoverageItem[];
  /** Most icons any entry of the section shows — every entry reserves that width so labels line up. */
  iconSlots: number;
}

function maxIconCount(items: RaidBuffCoverageItem[]): number {
  const counts = items.flatMap((item) => (item.kind === 'entry' ? [item.entry.icons.length] : item.pool.entries.map((e) => e.icons.length)));
  return Math.max(1, ...counts);
}

/**
 * The raid-wide buffs, debuffs and individual buffs a composition brings, shown below the grid and
 * the class palette (which stays next to the slots for drag and drop). Every effect is listed: covered ones normally, missing ones greyed out, so the
 * panel doubles as a checklist of what the composition still lacks.
 */
@Component({
  selector: 'app-raid-buffs-panel',
  imports: [NgTemplateOutlet, SpellIconComponent, TranslocoPipe],
  templateUrl: './raid-buffs-panel.component.html',
  styleUrl: './raid-buffs-panel.component.scss',
})
export class RaidBuffsPanelComponent {
  readonly #transloco = inject(TranslocoService);

  readonly coverage = input.required<RaidBuffCoverage>();
  /** The expansion the spells belong to — picks the Wowhead sub-site of their tooltips. */
  readonly expansionId = input<number | null>(null);

  /** Sections without any definition are dropped, so an expansion with no curated list shows nothing. */
  readonly sections = computed<PanelSection[]>(() => {
    const coverage = this.coverage();
    const sections: PanelSection[] = [
      { key: 'buffs' as const, items: coverage.buffs },
      { key: 'debuffs' as const, items: coverage.debuffs },
      { key: 'individual' as const, items: coverage.individual },
    ]
      .filter((section) => section.items.length > 0)
      .map((section) => ({ ...section, iconSlots: maxIconCount(section.items) }));
    return sections;
  });

  label(definition: RaidBuffDefinition): string {
    return raidBuffLabel(definition, this.#transloco.getActiveLang());
  }

  spellName(definition: RaidBuffDefinition): string {
    return definition.spell ? raidBuffSpellName(definition.spell, this.#transloco.getActiveLang()) : '';
  }

  /** A pool's display name; an unknown pool key is shown as-is rather than as a missing translation. */
  poolLabel(key: string): string {
    const i18nKey = `compositionPreviews.buffs.pools.${key}`;
    const translated = this.#transloco.translate(i18nKey);
    return translated === i18nKey ? key : translated;
  }
}
