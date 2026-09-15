import { Component, computed, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Renders a spell icon from a `Spell.iconUrl` (or any other RaidOps-hosted icon URL) — the seeded
 * reference table already resolves the URL server-side, this component just displays it.
 * Accepts an optional `label` for accessibility and an optional `size` in pixels (default: 24).
 * When `spellId` is set, the icon links to the spell's Wowhead page and shows a native Wowhead
 * tooltip on hover (see `index.html`'s `wow.zamimg.com/js/tooltips.js` include), scoped to TBC
 * data and to the app's active language (`{lang}.tbc.wowhead.com`, confirmed via testing against
 * the live script to serve fully localized tooltip content; plain `tbc` for English).
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

  readonly wowheadUrl = computed(() => {
    const id = this.spellId();
    return id ? `https://www.wowhead.com/spell=${id}` : null;
  });

  readonly wowheadDomain = computed(() => {
    const lang = this.#transloco.activeLang();
    return lang === 'en' ? 'tbc' : `${lang}.tbc`;
  });
}
