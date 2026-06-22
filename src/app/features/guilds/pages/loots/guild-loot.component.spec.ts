import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { GuildLootComponent } from './guild-loot.component';
import { AuthStore } from '../../../../core/stores/auth.store';

const setup = (guildId: string | null) => {
  TestBed.configureTestingModule({
    imports: [GuildLootComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          parent: {
            snapshot: { paramMap: { get: () => guildId } },
            paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
          },
        },
      },
      { provide: AuthStore, useValue: { user: signal(null) } },
    ],
  }).overrideComponent(GuildLootComponent, { set: { template: '', imports: [] } });

  return TestBed.createComponent(GuildLootComponent).componentInstance;
};

describe('GuildLootComponent', () => {
  it('should create', () => {
    expect(setup('g1')).toBeTruthy();
  });

  it('extracts guildId from the parent route', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  it('sets i18nKey to sidenav.guild.loot on the last breadcrumb', () => {
    expect(setup('g1').breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.loot');
  });
});
