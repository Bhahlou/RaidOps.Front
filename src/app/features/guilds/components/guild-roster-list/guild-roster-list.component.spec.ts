import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { GuildRosterListComponent } from './guild-roster-list.component';
import { GuildRosterStore } from '../../stores/guild-roster.store';

describe('GuildRosterListComponent', () => {
  let store: { isLoading: ReturnType<typeof signal>; members: ReturnType<typeof signal>;
    loadRoster: ReturnType<typeof vi.fn> };
  let transloco: { getActiveLang: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<GuildRosterListComponent>;

  const setup = (guildId = 'g1') => {
    store = {
      isLoading: signal(false),
      members: signal([]),
      loadRoster: vi.fn().mockReturnValue(of([])),
    };
    transloco = { getActiveLang: vi.fn(() => 'fr') };

    TestBed.configureTestingModule({
      imports: [GuildRosterListComponent],
      providers: [
        { provide: GuildRosterStore, useValue: store },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(GuildRosterListComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildRosterListComponent);
    fixture.componentRef.setInput('guildId', guildId);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('loads the roster for the given guildId', () => {
      setup('g42');

      expect(store.loadRoster).toHaveBeenCalledWith('g42');
    });
  });

  describe('formatDate', () => {
    it('formats the timestamp using the active app language', () => {
      const component = setup();

      component.formatDate('2026-01-01T00:00:00Z');

      expect(transloco.getActiveLang).toHaveBeenCalled();
    });
  });
});
