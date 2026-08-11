import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EnvBrandingService } from './core/services/env-branding.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styles: [],
})
export class App {
  constructor() {
    // LanguageService is instantiated by the app initializer in app.config.ts (needs to resolve
    // and load the active language before the first render, not just before this component).
    const document = inject(DOCUMENT);
    const branding = inject(EnvBrandingService);

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) favicon.href = branding.logoPath;

    // Same env-dependent swap as the favicon above, so an installed PWA gets the right
    // name/icons/theme color for the environment it was installed from (prod/acc/dev).
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifest) manifest.href = branding.manifestPath;

    // Chromium colors an installed PWA's title bar live from this tag (not just from the
    // manifest's theme_color at install time), and draws the window icon on top of it. In a
    // regular browser tab there's no icon overlaid, so the env accent color is a safe, useful
    // cue there — but in standalone/installed mode it would repaint the same color as the
    // (also env-colored) icon, making it invisible. Force the dark app background there instead.
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const standaloneQuery = document.defaultView?.matchMedia('(display-mode: standalone)');
    if (themeColor && standaloneQuery) {
      // Right after "Open in app"/install, the window can still report display-mode as
      // browser/minimal-ui for a moment before Chromium finishes promoting it to standalone.
      // A `change` listener alone isn't enough — that event doesn't reliably fire for this
      // specific transition — so a delayed re-check is the actual fix, with the listener kept
      // as a bonus for the cases where a change event does arrive.
      const applyThemeColor = () => {
        themeColor.content = standaloneQuery.matches ? '#0f1117' : (branding.accentColor ?? '#ffb74d');
      };
      applyThemeColor();
      standaloneQuery.addEventListener('change', applyThemeColor);
      document.defaultView?.setTimeout(applyThemeColor, 500);
    }
  }
}
