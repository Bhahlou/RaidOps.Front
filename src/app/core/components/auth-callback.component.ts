import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

/**
 * Landing component for the /authcallback route.
 *
 * The backend redirects here after a successful Discord OAuth2 flow.
 * The HttpOnly cookies are already set — we just need to load the user profile
 * and navigate to the appropriate route.
 */
@Component({
  selector: 'app-auth-callback',
  template: '',
  styles: [],
})
export class AuthCallbackComponent implements OnInit {
  readonly #authStore = inject(AuthStore);
  readonly #router = inject(Router);

  ngOnInit(): void {
    this.#authStore.loadUser().subscribe({
      next: () => this.#router.navigate(['/get-started']),
      error: () => this.#router.navigate(['/home']),
    });
  }
}
