import { Component, computed, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { wowheadSpellUrl, wowheadTooltipDomain } from '../../../utils/wowhead.util';

/**
 * Renders a spell icon from a `Spell.iconUrl` (or any other RaidOps-hosted icon URL) — the seeded
 * reference table already resolves the URL server-side, this component just displays it.
 * Accepts an optional `label` for accessibility and an optional `size` in pixels (default: 24).
 * When `spellId` is set, the icon links to the spell's Wowhead page and shows a native Wowhead
 * tooltip on hover (see `index.html`'s `wow.zamimg.com/js/tooltips.js` include), in the app's active language.
 * The Wowhead sub-site follows `expansionId` (e.g. `forever`, `fr.forever`); without one it falls back to TBC.
 *
 * This has to be a real `<a href>` — confirmed by testing against the live script (an isolated
 * page with `data-wowhead` on a bare `<img>` produced no tooltip at all; the same attribute on an
 * `<a>` worked immediately). Any call site nesting this inside a `<button>` (invalid HTML for a
 * nested `<a>`) needs its own icon rendered as a sibling instead — see the spell picker's result
 * row, which puts the icon next to the button rather than inside it for exactly this reason.
 */
@Component({
  selector: 'app-spell-icon',
  imports: [],
  templateUrl: './spell-icon.component.html',
  styleUrl: './spell-icon.component.scss',
})
export class SpellIconComponent {
  readonly #transloco = inject(TranslocoService);

  readonly iconUrl = input.required<string>();
  readonly label = input('');
  /** Side length in pixels. The icon is always square. */
  readonly size = input(24);
  readonly spellId = input<number | null>(null);
  /** The expansion the spell belongs to — picks the Wowhead sub-site (tooltip data and link). Falls back to TBC when unset. */
  readonly expansionId = input<number | null>(null);

  readonly wowheadUrl = computed(() => {
    const id = this.spellId();
    return id ? wowheadSpellUrl(this.expansionId(), id) : null;
  });

  readonly wowheadDomain = computed(() => wowheadTooltipDomain(this.expansionId(), this.#transloco.activeLang()));
}
