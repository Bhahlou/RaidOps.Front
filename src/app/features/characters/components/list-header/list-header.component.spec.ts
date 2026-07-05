import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ListHeaderComponent } from './list-header.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { User } from '../../../../core/models/user.model';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

describe('ListHeaderComponent', () => {
  const setup = (user: User | null) => {
    TestBed.configureTestingModule({
      imports: [ListHeaderComponent],
      providers: [{ provide: AuthStore, useValue: { user: signal(user) } }],
    });
    TestBed.overrideComponent(ListHeaderComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(ListHeaderComponent);
    fixture.componentRef.setInput('isBnetLoading', false);
    fixture.componentRef.setInput('isBnetLinked', false);
    return fixture.componentInstance;
  };

  it('creates the component', () => {
    expect(setup(null)).toBeTruthy();
  });

  it('exposes REGION_FLAGS for all four regions', () => {
    const flags = setup(null).regionFlags;
    expect(Object.keys(flags).sort()).toEqual(['eu', 'kr', 'tw', 'us']);
  });

  // ── breadcrumbs ───────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the user name and a discord icon when authenticated', () => {
      const user: User = {
        discordId: '123',
        name: 'Bhahlou',
        avatarHash: 'abc',
        guilds: [],
        notifications: [],
      };

      const [first] = setup(user).breadcrumbs();

      expect(first.label).toBe('Bhahlou');
      expect(first.discordIcon).toEqual({ id: '123', hash: 'abc', type: DiscordIconType.User });
    });

    it('falls back to a placeholder label with no icon when there is no user', () => {
      const [first] = setup(null).breadcrumbs();

      expect(first.label).toBe('…');
      expect(first.discordIcon).toBeUndefined();
    });

    it('always ends with the characters list title crumb', () => {
      const crumbs = setup(null).breadcrumbs();

      expect(crumbs[1]).toEqual({ i18nKey: 'characters.list.title' });
    });
  });
});
