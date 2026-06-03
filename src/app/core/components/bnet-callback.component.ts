import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Lightweight relay page opened inside the BNet OAuth popup.
 * Reads the callback query params, posts the result to the parent window, then closes.
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

    if (window.opener) {
      // Opened as a popup
      window.opener.postMessage(message, window.location.origin);
      window.close();
    } else if (window.parent !== window) {
      // Loaded in a hidden iframe
      window.parent.postMessage(message, window.location.origin);
    }
  }
}
