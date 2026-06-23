import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { EnvBrandingService, resolveEnvBranding } from './env-branding.service';

describe('resolveEnvBranding', () => {
  it('returns the production logo with no badge or accent color', () => {
    expect(resolveEnvBranding('production')).toEqual({
      logoPath: 'assets/Logo no background.svg',
      badgeLabel: null,
      accentColor: null,
    });
  });

  it('returns the dev logo, "Dev" badge, and green accent color', () => {
    expect(resolveEnvBranding('development')).toEqual({
      logoPath: 'assets/Logo no background DEV.svg',
      badgeLabel: 'Dev',
      accentColor: '#2cf63d',
    });
  });

  it('returns the ACC logo, "Acc" badge, and blue accent color', () => {
    expect(resolveEnvBranding('acceptance')).toEqual({
      logoPath: 'assets/Logo no background ACC.svg',
      badgeLabel: 'Acc',
      accentColor: '#4b7ca4',
    });
  });

  it('falls back to the production logo with no badge or accent color for an unknown envName', () => {
    expect(resolveEnvBranding('staging')).toEqual({
      logoPath: 'assets/Logo no background.svg',
      badgeLabel: null,
      accentColor: null,
    });
  });
});

describe('EnvBrandingService', () => {
  it('exposes branding resolved for the current environment', () => {
    const service = TestBed.inject(EnvBrandingService);
    const expected = resolveEnvBranding(environment.envName);

    expect(service.envName).toBe(environment.envName);
    expect(service.logoPath).toBe(expected.logoPath);
    expect(service.badgeLabel).toBe(expected.badgeLabel);
    expect(service.accentColor).toBe(expected.accentColor);
  });
});
