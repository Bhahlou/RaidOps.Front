import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export const LOGO_BY_ENV: Record<string, string> = {
  production: 'assets/Logo no background.svg',
  acceptance: 'assets/Logo no background ACC.svg',
  development: 'assets/Logo no background DEV.svg',
};

export const BADGE_LABEL_BY_ENV: Record<string, string> = {
  acceptance: 'Acc',
  development: 'Dev',
};

// Dominant fill color of each logo SVG, so the header text/badge visually match the logo.
export const ACCENT_COLOR_BY_ENV: Record<string, string> = {
  acceptance: '#4b7ca4',
  development: '#2cf63d',
};

export interface EnvBranding {
  logoPath: string;
  badgeLabel: string | null;
  accentColor: string | null;
}

/**
 * Pure lookup extracted out of the service so the fallback-to-production behavior
 * (unknown/missing envName) is unit-testable without depending on which environment
 * file happens to be active at test-run time.
 */
export function resolveEnvBranding(envName: string): EnvBranding {
  return {
    logoPath: LOGO_BY_ENV[envName] ?? LOGO_BY_ENV['production'],
    badgeLabel: BADGE_LABEL_BY_ENV[envName] ?? null,
    accentColor: ACCENT_COLOR_BY_ENV[envName] ?? null,
  };
}

/** Centralizes the env-dependent branding (favicon, header logo, header badge) so app.ts and HeaderComponent stay in sync. */
@Injectable({ providedIn: 'root' })
export class EnvBrandingService {
  readonly envName = environment.envName;

  private readonly branding = resolveEnvBranding(this.envName);

  readonly logoPath = this.branding.logoPath;
  readonly badgeLabel = this.branding.badgeLabel;
  readonly accentColor = this.branding.accentColor;
}
