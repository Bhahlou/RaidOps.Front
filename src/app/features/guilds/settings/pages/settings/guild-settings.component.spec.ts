import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { GuildSettingsComponent } from './guild-settings.component';
import { AuthStore } from '../../../../../core/stores/auth.store';

const setup = (guildId: string | null, tab: string | null = null, router: { navigate: ReturnType<typeof vi.fn> } = { navigate: vi.fn() }) => {
  const route = {
    paramMap: of(convertToParamMap(tab ? { tab } : {})),
    parent: {
      snapshot: { paramMap: { get: () => guildId } },
      paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
    },
  };

  TestBed.configureTestingModule({
    imports: [GuildSettingsComponent],
    providers: [
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      { provide: AuthStore, useValue: { user: signal(null) } },
    ],
  }).overrideComponent(GuildSettingsComponent, { set: { template: '', imports: [] } });

  return TestBed.createComponent(GuildSettingsComponent).componentInstance;
};

describe('GuildSettingsComponent', () => {
  it('should create', () => {
    expect(setup('g1')).toBeTruthy();
  });

  it('extracts guildId from the parent route', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  it('sets i18nKey to sidenav.guild.settings on the last breadcrumb', () => {
    expect(setup('g1').breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.settings');
  });

  // ── activeTab ───────────────────────────────────────────────────────────

  describe('activeTab', () => {
    it('defaults to general when the route has no tab segment', () => {
      expect(setup('g1').activeTab()).toBe('general');
    });

    it('reads notifications from the route segment', () => {
      expect(setup('g1', 'notifications').activeTab()).toBe('notifications');
    });

    it('reads roster from the route segment', () => {
      expect(setup('g1', 'roster').activeTab()).toBe('roster');
    });

    it('reads raids from the route segment', () => {
      expect(setup('g1', 'raids').activeTab()).toBe('raids');
    });

    it('falls back to general for an unknown tab segment', () => {
      expect(setup('g1', 'bogus').activeTab()).toBe('general');
    });
  });

  // ── onTabChange ─────────────────────────────────────────────────────────

  describe('onTabChange', () => {
    it('navigates to the sibling tab route', () => {
      const router = { navigate: vi.fn() };
      const component = setup('g1', 'general', router);

      component.onTabChange('notifications');

      expect(router.navigate).toHaveBeenCalledWith(['..', 'notifications'], { relativeTo: expect.anything() });
    });
  });
});
