import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Lightweight relay page opened inside the BNet OAuth popup.
 * Reads the callback query params, posts the result to the parent globalThis, then closes.
 */
@Component({
  selector: 'app-bnet-callback',
  standalone: true,
  template: '',
})
export class BnetCallbackComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);

  ngOnInit(): void {
    const params = this.#route.snapshot.queryParamMap;

    const message =
      params.get('bnet_linked') === 'true'
        ? { type: 'bnet_oauth' }
        : { type: 'bnet_oauth', error: params.get('error') ?? 'unknown' };

    if (globalThis.opener) {
      // Opened as a popup
      globalThis.opener.postMessage(message, globalThis.location.origin);
      globalThis.close();
    } else if (globalThis.parent !== globalThis.self) {
      // Loaded in a hidden iframe
      globalThis.parent.postMessage(message, globalThis.location.origin);
    }
  }
}
