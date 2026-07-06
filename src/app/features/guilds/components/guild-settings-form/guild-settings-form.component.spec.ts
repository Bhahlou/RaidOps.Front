import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { FormRoot } from '@angular/forms/signals';
import { of, Subject, throwError } from 'rxjs';

import { GuildSettingsFormComponent, buildTimezoneOption } from './guild-settings-form.component';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildStore } from '../../stores/guild.store';
import { OfficerThresholdStore } from '../../stores/officer-threshold.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildSettings } from '../../models/guild-settings.model';
import { OfficerThreshold } from '../../models/officer-threshold.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { DiscordRole } from '../../../../shared/models/discord-role.model';

const role = (id: string, color = 0, iconHash: string | null = null): DiscordRole =>
  ({ id, name: `Role ${id}`, color, iconHash });

const settings = (overrides?: Partial<GuildSettings>): GuildSettings => ({
  timezone: 'Europe/Paris',
  rosterMode: RosterMode.Open,
  minRosterRoleId: null,
  ...overrides,
});

const officerThreshold = (overrides?: Partial<OfficerThreshold>): OfficerThreshold => ({
  minOfficerRoleId: null,
  ...overrides,
});

const toggleChange = (value: RosterMode): MatButtonToggleChange =>
  ({ value }) as MatButtonToggleChange;

describe('buildTimezoneOption', () => {
  it('falls back to the raw timezone id as the label when Intl.DateTimeFormat rejects it', () => {
    expect(buildTimezoneOption('Not/ARealZone')).toEqual({ id: 'Not/ARealZone', label: 'Not/ARealZone' });
  });

  it('falls back to an empty offset when the formatted parts have no timeZoneName part', () => {
    const spy = vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
      { type: 'literal', value: '' },
    ]);

    expect(buildTimezoneOption('Europe/Paris')).toEqual({ id: 'Europe/Paris', label: 'Europe/Paris ()' });

    spy.mockRestore();
  });
});

describe('GuildSettingsFormComponent', () => {
  let fixture: ComponentFixture<GuildSettingsFormComponent>;
  let component: GuildSettingsFormComponent;
  let settingsService: {
    getDiscordRoles: ReturnType<typeof vi.fn>;
    updateSettings: ReturnType<typeof vi.fn>;
    updateOfficerThreshold: ReturnType<typeof vi.fn>;
  };
  let guildStore: {
    loadSettings: ReturnType<typeof vi.fn>;
    patchSettings: ReturnType<typeof vi.fn>;
  };
  let officerThresholdStore: {
    loadOfficerThreshold: ReturnType<typeof vi.fn>;
    patchOfficerThreshold: ReturnType<typeof vi.fn>;
  };
  let authStore: { loadUser: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const setup = (
    guildId = 'g1',
    storeSettings = settings(),
    storeOfficerThreshold = officerThreshold(),
  ) => {
    settingsService = {
      getDiscordRoles:        vi.fn().mockReturnValue(of([])),
      updateSettings:         vi.fn().mockReturnValue(of(undefined)),
      updateOfficerThreshold: vi.fn().mockReturnValue(of(undefined)),
    };
    guildStore = {
      loadSettings:   vi.fn().mockReturnValue(of(storeSettings)),
      patchSettings:  vi.fn(),
    };
    officerThresholdStore = {
      loadOfficerThreshold:  vi.fn().mockReturnValue(of(storeOfficerThreshold)),
      patchOfficerThreshold: vi.fn(),
    };
    authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildSettingsFormComponent],
      providers: [
        { provide: GuildSettingsService,   useValue: settingsService },
        { provide: GuildStore,             useValue: guildStore },
        { provide: OfficerThresholdStore,  useValue: officerThresholdStore },
        { provide: AuthStore,              useValue: authStore },
        { provide: SnackbarService,        useValue: snackbar },
      ],
    }).overrideComponent(GuildSettingsFormComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildSettingsFormComponent);
    fixture.componentRef.setInput('guildId', guildId);
    component = fixture.componentInstance;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('pre-fills the form with settings from the store', () => {
      setup('g1', settings({ timezone: 'UTC', rosterMode: RosterMode.Open }));
      fixture.detectChanges();

      expect(component.settingsForm.timezone().value()).toBe('UTC');
      expect(component.settingsForm.rosterMode().value()).toBe(RosterMode.Open);
    });

    it('keeps the local timezone when the store returns an empty timezone', () => {
      setup('g1', settings({ timezone: '' }));
      fixture.detectChanges();

      expect(component.settingsForm.timezone().value()).not.toBe('');
    });

    it('pre-fills minOfficerRoleId from the officer threshold store', () => {
      setup('g1', settings(), officerThreshold({ minOfficerRoleId: 'r9' }));
      fixture.detectChanges();

      expect(component.settingsForm.minOfficerRoleId().value()).toBe('r9');
    });

    it('loads Discord roles eagerly, regardless of roster mode', () => {
      setup();
      const roles = [role('r1'), role('r2')];
      settingsService.getDiscordRoles.mockReturnValue(of(roles));

      fixture.detectChanges();

      expect(settingsService.getDiscordRoles).toHaveBeenCalledWith('g1');
      expect(component.availableRoles()).toEqual(roles);
      expect(component.rolesLoading()).toBe(false);
    });

    it('shows snackbar error and clears loading flag when role fetch fails', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(throwError(() => new Error('role fetch failed')));

      fixture.detectChanges();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.rolesLoading()).toBe(false);
    });

    it('leaves the timezone empty when the browser cannot resolve one and the store has none either', () => {
      const intlSpy = vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
        resolvedOptions: () => ({ timeZone: undefined }),
      } as unknown as Intl.DateTimeFormat);

      setup('g1', settings({ timezone: '' }));
      fixture.detectChanges();

      expect(component.settingsForm.timezone().value()).toBe('');

      intlSpy.mockRestore();
    });
  });

  // ── isDiscordRoleMode ─────────────────────────────────────────────────────

  describe('isDiscordRoleMode', () => {
    it('is false when rosterMode is Open', () => {
      setup();
      fixture.detectChanges();

      expect(component.isDiscordRoleMode()).toBe(false);
    });

    it('is true when rosterMode is DiscordRoleOnly', () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.rosterMode().value.set(RosterMode.DiscordRoleOnly);

      expect(component.isDiscordRoleMode()).toBe(true);
    });
  });

  // ── filteredTimezones ─────────────────────────────────────────────────────

  describe('filteredTimezones', () => {
    it('returns options that match the current timezone input', () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('Europe/Paris');

      expect(component.filteredTimezones().some(tz => tz.id === 'Europe/Paris')).toBe(true);
    });

    it('returns an empty array when no timezone matches', () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('ZZZ_NOT_REAL');

      expect(component.filteredTimezones()).toEqual([]);
    });
  });

  // ── onRosterModeChange ────────────────────────────────────────────────────

  describe('onRosterModeChange', () => {
    it('clears minRosterRoleId when switching back to Open', () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.minRosterRoleId().value.set('r1');

      component.onRosterModeChange(toggleChange(RosterMode.Open));

      expect(component.settingsForm.minRosterRoleId().value()).toBeNull();
    });

    it('keeps minRosterRoleId when switching to DiscordRoleOnly', () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.minRosterRoleId().value.set('r1');

      component.onRosterModeChange(toggleChange(RosterMode.DiscordRoleOnly));

      expect(component.settingsForm.minRosterRoleId().value()).toBe('r1');
      expect(component.settingsForm.rosterMode().value()).toBe(RosterMode.DiscordRoleOnly);
    });
  });

  // ── sortedRoles ───────────────────────────────────────────────────────────

  describe('sortedRoles', () => {
    it('returns available roles in the same order', () => {
      setup();
      component.availableRoles.set([role('r1'), role('r2'), role('r3')]);

      expect(component.sortedRoles()).toEqual([role('r1'), role('r2'), role('r3')]);
    });
  });

  // ── displayTimezone ───────────────────────────────────────────────────────

  describe('displayTimezone', () => {
    it('returns the formatted label for a known timezone id', () => {
      setup();
      expect(component.displayTimezone('Europe/Paris')).toContain('Europe/Paris');
    });

    it('returns the id itself when the timezone is not in the list', () => {
      setup();
      expect(component.displayTimezone('Nowhere/Place')).toBe('Nowhere/Place');
    });
  });

  // ── submit ────────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when the form is invalid', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('');

      await component.submit();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
      expect(settingsService.updateOfficerThreshold).not.toHaveBeenCalled();
    });

    it('does nothing when minOfficerRoleId is not set (required)', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');

      await component.submit();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
      expect(settingsService.updateOfficerThreshold).not.toHaveBeenCalled();
    });

    it('does not submit a second time while already submitting', async () => {
      setup();
      const pending = new Subject<void>();
      settingsService.updateSettings.mockReturnValue(pending.asObservable());
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.minOfficerRoleId().value.set('r1');

      const first = component.submit();
      const second = component.submit();
      pending.next();
      pending.complete();
      await Promise.all([first, second]);

      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);
    });

    it('calls updateSettings and updateOfficerThreshold with the correct payloads', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.minOfficerRoleId().value.set('r1');

      await component.submit();

      expect(settingsService.updateSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC', rosterMode: RosterMode.Open, minRosterRoleId: null }),
      );
      expect(settingsService.updateOfficerThreshold).toHaveBeenCalledWith('g1', { minOfficerRoleId: 'r1' });
    });

    it('sends minRosterRoleId when rosterMode is DiscordRoleOnly', async () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(of([role('r1')]));
      fixture.detectChanges();
      component.settingsForm.rosterMode().value.set(RosterMode.DiscordRoleOnly);
      component.settingsForm.minRosterRoleId().value.set('r1');
      component.settingsForm.minOfficerRoleId().value.set('r1');

      await component.submit();

      const [, sent] = settingsService.updateSettings.mock.calls[0] as [string, GuildSettings];
      expect(sent.minRosterRoleId).toBe('r1');
    });

    it('forces minRosterRoleId to null when rosterMode is Open', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.minOfficerRoleId().value.set('r1');
      // rosterMode stays Open while minRosterRoleId is (incorrectly) populated —
      // submit() must still null it out regardless of what's in the model.
      component.settingsForm.minRosterRoleId().value.set('r1');

      await component.submit();

      const [, sent] = settingsService.updateSettings.mock.calls[0] as [string, GuildSettings];
      expect(sent.minRosterRoleId).toBeNull();
    });

    it('patches both stores, resyncs the user and emits saved on success', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.minOfficerRoleId().value.set('r1');
      const savedSpy = vi.spyOn(component.saved, 'emit');

      await component.submit();

      expect(guildStore.patchSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC' }),
      );
      expect(officerThresholdStore.patchOfficerThreshold).toHaveBeenCalledWith('g1', { minOfficerRoleId: 'r1' });
      expect(authStore.loadUser).toHaveBeenCalledOnce();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.saveSuccess');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('shows snackbar error and resets submitting flag when either call fails', async () => {
      setup();
      settingsService.updateSettings.mockReturnValue(throwError(() => new Error('update failed')));
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.minOfficerRoleId().value.set('r1');

      await component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });

  // ── real <form> submission wiring ────────────────────────────────────────
  //
  // Every test above overrides the template to '', so none of them exercise the actual <form>
  // element — which is exactly how a real bug slipped through: (ngSubmit) was left in the
  // template after ReactiveFormsModule was removed, with nothing left to back it, so clicking
  // submit fell through to the browser's native (page-reloading) form submission instead of
  // ever calling the component. These tests render the real [formRoot] wrapper (not the full
  // production template, to avoid dragging in mat-autocomplete/mat-button-toggle rendering) and
  // dispatch a genuine DOM 'submit' event, the same way a user's click on the submit button does.

  describe('real <form> submission wiring', () => {
    const setupRealForm = () => {
      settingsService = {
        getDiscordRoles:        vi.fn().mockReturnValue(of([])),
        updateSettings:         vi.fn().mockReturnValue(of(undefined)),
        updateOfficerThreshold: vi.fn().mockReturnValue(of(undefined)),
      };
      guildStore = {
        loadSettings:  vi.fn().mockReturnValue(of(settings())),
        patchSettings: vi.fn(),
      };
      officerThresholdStore = {
        loadOfficerThreshold:  vi.fn().mockReturnValue(of(officerThreshold())),
        patchOfficerThreshold: vi.fn(),
      };
      authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };
      snackbar = { error: vi.fn(), success: vi.fn() };

      TestBed.configureTestingModule({
        imports: [GuildSettingsFormComponent],
        providers: [
          { provide: GuildSettingsService,  useValue: settingsService },
          { provide: GuildStore,            useValue: guildStore },
          { provide: OfficerThresholdStore, useValue: officerThresholdStore },
          { provide: AuthStore,             useValue: authStore },
          { provide: SnackbarService,       useValue: snackbar },
        ],
      }).overrideComponent(GuildSettingsFormComponent, {
        set: { template: `<form [formRoot]="settingsForm"><button type="submit">Save</button></form>`, imports: [FormRoot] },
      });

      fixture = TestBed.createComponent(GuildSettingsFormComponent);
      fixture.componentRef.setInput('guildId', 'g1');
      component = fixture.componentInstance;
      fixture.detectChanges();
    };

    const dispatchSubmit = (): Event => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      fixture.nativeElement.querySelector('form')!.dispatchEvent(event);
      return event;
    };

    it('prevents the native page submission and calls the backend when the form is valid', async () => {
      setupRealForm();
      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.minOfficerRoleId().value.set('r1');

      const event = dispatchSubmit();
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(true);
      expect(settingsService.updateSettings).toHaveBeenCalled();
    });

    it('prevents the native page submission but does not call the backend when the form is invalid', async () => {
      setupRealForm();
      // minOfficerRoleId left unset — required, so the form is invalid.

      const event = dispatchSubmit();
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(true);
      expect(settingsService.updateSettings).not.toHaveBeenCalled();
    });
  });
});
