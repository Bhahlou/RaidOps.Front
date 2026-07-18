import { Component, input } from '@angular/core';

/**
 * Bordered card with a notch-style label embedded in its top border (same fieldset/legend
 * technique as shared/components/select), meant to group a field's tip/hint + its actual
 * control(s) — and any directly-dependent sub-controls — under one uniform, compact container.
 *
 * Deliberately plain `display: block` on the fieldset itself (no flex/grid directly on it) —
 * combining a native <legend> with a flex/grid fieldset produced a browser-inconsistent gap
 * that no margin value could cleanly cancel (see guild-settings-form's roster-toggle history).
 * Layout for projected content lives on the inner .form-field-card-content div instead.
 */
@Component({
  selector: 'app-form-field-card',
  templateUrl: './form-field-card.component.html',
  styleUrl: './form-field-card.component.scss',
})
export class FormFieldCardComponent {
  readonly label = input<string | undefined>(undefined);
}
