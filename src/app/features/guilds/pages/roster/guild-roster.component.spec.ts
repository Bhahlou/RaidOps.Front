import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GuildRosterComponent } from './guild-roster.component';
import { AuthStore } from '../../../../core/stores/auth.store';

const setup = (guildId: string | null) => {
  TestBed.configureTestingModule({
    imports: [GuildRosterComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { parent: { snapshot: { paramMap: { get: () => guildId } } } },
      },
      { provide: AuthStore, useValue: { user: signal(null) } },
    ],
  }).overrideComponent(GuildRosterComponent, { set: { template: '', imports: [] } });

  return TestBed.createComponent(GuildRosterComponent).componentInstance;
};

describe('GuildRosterComponent', () => {
  it('should create', () => {
    expect(setup('g1')).toBeTruthy();
  });

  it('extracts guildId from the parent route', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  it('sets i18nKey to sidenav.guild.roster on the last breadcrumb', () => {
    expect(setup('g1').breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.roster');
  });
});
