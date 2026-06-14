import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GuildCalendarComponent } from './guild-calendar.component';
import { AuthStore } from '../../../../core/stores/auth.store';

const setup = (guildId: string | null) => {
  TestBed.configureTestingModule({
    imports: [GuildCalendarComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { parent: { snapshot: { paramMap: { get: () => guildId } } } },
      },
      { provide: AuthStore, useValue: { user: signal(null) } },
    ],
  }).overrideComponent(GuildCalendarComponent, { set: { template: '', imports: [] } });

  return TestBed.createComponent(GuildCalendarComponent).componentInstance;
};

describe('GuildCalendarComponent', () => {
  it('should create', () => {
    expect(setup('g1')).toBeTruthy();
  });

  it('extracts guildId from the parent route', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  it('sets i18nKey to sidenav.guild.calendar on the last breadcrumb', () => {
    expect(setup('g1').breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.calendar');
  });
});
