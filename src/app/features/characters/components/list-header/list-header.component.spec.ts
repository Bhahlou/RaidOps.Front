import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { ListHeaderComponent } from './list-header.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { CharacterStore } from '../../stores/character.store';
import { User } from '../../../../core/models/user.model';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { BnetAccount } from '../../models/bnet-account.model';

describe('ListHeaderComponent', () => {
  let storeMock: { confirmAndUnlinkBnetAccount: ReturnType<typeof vi.fn> };

  const setup = (user: User | null) => {
    storeMock = { confirmAndUnlinkBnetAccount: vi.fn().mockReturnValue(of(true)) };

    TestBed.configureTestingModule({
      imports: [ListHeaderComponent],
      providers: [
        { provide: AuthStore, useValue: { user: signal(user) } },
        { provide: CharacterStore, useValue: storeMock },
      ],
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

  // ── unlink ────────────────────────────────────────────────────────────────

  describe('unlink', () => {
    it('delegates to the store', () => {
      const account: BnetAccount = { bnetId: '1', battleTag: 'Bhahlou#1234', region: 'eu', tokenExpiry: '2026-01-01T00:00:00Z' };
      const component = setup(null);

      component.unlink(account);

      expect(storeMock.confirmAndUnlinkBnetAccount).toHaveBeenCalledWith(account);
    });
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
