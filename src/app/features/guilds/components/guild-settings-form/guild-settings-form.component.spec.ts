import { ComponentFixture, TestBed } from '@angular/core/testing';
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

      expect(component.form.value.timezone).toBe('UTC');
      expect(component.form.value.rosterMode).toBe(RosterMode.Open);
    });

    it('keeps the local timezone when the store returns an empty timezone', () => {
      setup('g1', settings({ timezone: '' }));
      fixture.detectChanges();

      expect(component.form.value.timezone).not.toBe('');
    });

    it('pre-fills minOfficerRoleId from the officer threshold store', () => {
      setup('g1', settings(), officerThreshold({ minOfficerRoleId: 'r9' }));
      fixture.detectChanges();

      expect(component.form.value.minOfficerRoleId).toBe('r9');
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

      expect(component.form.value.timezone).toBe('');

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
      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);

      expect(component.isDiscordRoleMode()).toBe(true);
    });
  });

  // ── filteredTimezones ─────────────────────────────────────────────────────

  describe('filteredTimezones', () => {
    it('returns options that match the current timezone input', () => {
      setup();
      fixture.detectChanges();
      component.form.controls.timezone.setValue('Europe/Paris');

      expect(component.filteredTimezones().some(tz => tz.id === 'Europe/Paris')).toBe(true);
    });

    it('returns an empty array when no timezone matches', () => {
      setup();
      fixture.detectChanges();
      component.form.controls.timezone.setValue('ZZZ_NOT_REAL');

      expect(component.filteredTimezones()).toEqual([]);
    });
  });

  // ── rosterMode subscription ───────────────────────────────────────────────

  describe('rosterMode subscription', () => {
    it('clears minRosterRoleId when switching back to Open', () => {
      setup();
      fixture.detectChanges();
      component.form.controls.minRosterRoleId.setValue('r1');

      component.form.controls.rosterMode.setValue(RosterMode.Open);

      expect(component.form.value.minRosterRoleId).toBeNull();
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
    it('does nothing when the form is invalid', () => {
      setup();
      fixture.detectChanges();
      component.form.controls.timezone.setValue('');

      component.submit();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
      expect(settingsService.updateOfficerThreshold).not.toHaveBeenCalled();
    });

    it('does nothing when minOfficerRoleId is not set (required)', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC' });

      component.submit();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
      expect(settingsService.updateOfficerThreshold).not.toHaveBeenCalled();
    });

    it('does not submit a second time while already submitting', () => {
      setup();
      const pending = new Subject<void>();
      settingsService.updateSettings.mockReturnValue(pending.asObservable());
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', minOfficerRoleId: 'r1' });

      component.submit();
      component.submit();

      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);
    });

    it('calls updateSettings and updateOfficerThreshold with the correct payloads', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', rosterMode: RosterMode.Open, minOfficerRoleId: 'r1' });

      component.submit();

      expect(settingsService.updateSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC', rosterMode: RosterMode.Open, minRosterRoleId: null }),
      );
      expect(settingsService.updateOfficerThreshold).toHaveBeenCalledWith('g1', { minOfficerRoleId: 'r1' });
    });

    it('sends minRosterRoleId when rosterMode is DiscordRoleOnly', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(of([role('r1')]));
      fixture.detectChanges();
      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);
      component.form.controls.minRosterRoleId.setValue('r1');
      component.form.controls.minOfficerRoleId.setValue('r1');

      component.submit();

      const [, sent] = settingsService.updateSettings.mock.calls[0] as [string, GuildSettings];
      expect(sent.minRosterRoleId).toBe('r1');
    });

    it('forces minRosterRoleId to null when rosterMode is Open', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', rosterMode: RosterMode.Open, minOfficerRoleId: 'r1' });
      // Bypass rosterMode subscription to sneak a value into the control
      component.form.controls.minRosterRoleId.setValue('r1', { emitEvent: false });

      component.submit();

      const [, sent] = settingsService.updateSettings.mock.calls[0] as [string, GuildSettings];
      expect(sent.minRosterRoleId).toBeNull();
    });

    it('patches both stores, resyncs the user and emits saved on success', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', minOfficerRoleId: 'r1' });
      const savedSpy = vi.spyOn(component.saved, 'emit');

      component.submit();

      expect(guildStore.patchSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC' }),
      );
      expect(officerThresholdStore.patchOfficerThreshold).toHaveBeenCalledWith('g1', { minOfficerRoleId: 'r1' });
      expect(authStore.loadUser).toHaveBeenCalledOnce();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.saveSuccess');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('shows snackbar error and resets submitting flag when either call fails', () => {
      setup();
      settingsService.updateSettings.mockReturnValue(throwError(() => new Error('update failed')));
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', minOfficerRoleId: 'r1' });

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });
});
