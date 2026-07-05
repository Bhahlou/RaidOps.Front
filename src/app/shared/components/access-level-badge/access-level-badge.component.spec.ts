import { TestBed } from '@angular/core/testing';

import { AccessLevelBadgeComponent } from './access-level-badge.component';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

describe('AccessLevelBadgeComponent', () => {
  const setup = (level: GuildAccessLevel) => {
    TestBed.configureTestingModule({
      imports: [AccessLevelBadgeComponent],
    }).overrideComponent(AccessLevelBadgeComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(AccessLevelBadgeComponent);
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup(GuildAccessLevel.Public)).toBeTruthy();
  });

  // ── labelKey ──────────────────────────────────────────────────────────────

  describe('labelKey', () => {
    it.each([
      [GuildAccessLevel.Public, 'accessLevelBadge.public'],
      [GuildAccessLevel.Roster, 'accessLevelBadge.roster'],
      [GuildAccessLevel.Officer, 'accessLevelBadge.officer'],
    ])('maps %s to %s', (level, expected) => {
      expect(setup(level).labelKey()).toBe(expected);
    });
  });

  // ── icon ──────────────────────────────────────────────────────────────────

  describe('icon', () => {
    it.each([
      [GuildAccessLevel.Public, 'public'],
      [GuildAccessLevel.Roster, 'groups'],
      [GuildAccessLevel.Officer, 'shield'],
    ])('maps %s to the %s icon', (level, expected) => {
      expect(setup(level).icon()).toBe(expected);
    });
  });

  // ── cssClass ──────────────────────────────────────────────────────────────

  describe('cssClass', () => {
    it('is level-<lowercased level>', () => {
      expect(setup(GuildAccessLevel.Officer).cssClass()).toBe('level-officer');
    });
  });
});
