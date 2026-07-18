import { Service, signal } from '@angular/core';

/**
 * Shared mobile-drawer open state for the sidenav — HeaderComponent (hamburger trigger) and
 * SidenavComponent (drawer) are sibling components with no parent/child relationship to pass an
 * input/output through directly.
 */
@Service()
export class SidenavService {
  readonly isMobileOpen = signal(false);

  toggle(): void {
    this.isMobileOpen.update((v) => !v);
  }

  close(): void {
    this.isMobileOpen.set(false);
  }
}
