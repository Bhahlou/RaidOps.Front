import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { GuildSettingsFormComponent } from './guild-settings-form.component';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildStore } from '../../stores/guild.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildSettings } from '../../models/guild-settings.model';
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

describe('GuildSettingsFormComponent', () => {
  let fixture: ComponentFixture<GuildSettingsFormComponent>;
  let component: GuildSettingsFormComponent;
  let settingsService: {
    getDiscordRoles: ReturnType<typeof vi.fn>;
    updateSettings: ReturnType<typeof vi.fn>;
  };
  let guildStore: {
    loadSettings: ReturnType<typeof vi.fn>;
    patchSettings: ReturnType<typeof vi.fn>;
  };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const setup = (guildId = 'g1', storeSettings = settings()) => {
    settingsService = {
      getDiscordRoles: vi.fn().mockReturnValue(of([])),
      updateSettings:  vi.fn().mockReturnValue(of(undefined)),
    };
    guildStore = {
      loadSettings:   vi.fn().mockReturnValue(of(storeSettings)),
      patchSettings:  vi.fn(),
    };
    snackbar = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildSettingsFormComponent],
      providers: [
        { provide: GuildSettingsService, useValue: settingsService },
        { provide: GuildStore,           useValue: guildStore },
        { provide: SnackbarService,      useValue: snackbar },
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
    it('loads Discord roles when switching to DiscordRoleOnly', () => {
      setup();
      const roles = [role('r1'), role('r2')];
      settingsService.getDiscordRoles.mockReturnValue(of(roles));
      fixture.detectChanges();

      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);

      expect(settingsService.getDiscordRoles).toHaveBeenCalledWith('g1');
      expect(component.availableRoles()).toEqual(roles);
      expect(component.rolesLoading()).toBe(false);
    });

    it('does not re-fetch roles when they are already loaded', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(of([role('r1')]));
      fixture.detectChanges();

      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);
      component.form.controls.rosterMode.setValue(RosterMode.Open);
      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);

      expect(settingsService.getDiscordRoles).toHaveBeenCalledTimes(1);
    });

    it('clears minRosterRoleId when switching back to Open', () => {
      setup();
      fixture.detectChanges();
      component.form.controls.minRosterRoleId.setValue('r1');

      component.form.controls.rosterMode.setValue(RosterMode.Open);

      expect(component.form.value.minRosterRoleId).toBeNull();
    });

    it('shows snackbar error and clears loading flag when role fetch fails', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(throwError(() => new Error()));
      fixture.detectChanges();

      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.rolesLoading()).toBe(false);
    });
  });

  // ── role state methods ────────────────────────────────────────────────────

  describe('role state methods', () => {
    const setupWithRoles = () => {
      setup();
      fixture.detectChanges();
      component.availableRoles.set([role('r1'), role('r2'), role('r3')]);
      component.form.controls.minRosterRoleId.setValue('r2');
    };

    describe('isThreshold', () => {
      it('returns true only for the current threshold role', () => {
        setupWithRoles();

        expect(component.isThreshold(role('r2'))).toBe(true);
        expect(component.isThreshold(role('r1'))).toBe(false);
        expect(component.isThreshold(role('r3'))).toBe(false);
      });
    });

    describe('isRoleIncluded', () => {
      it('returns true for roles at or before the threshold index', () => {
        setupWithRoles();

        expect(component.isRoleIncluded(role('r1'))).toBe(true);
        expect(component.isRoleIncluded(role('r2'))).toBe(true);
        expect(component.isRoleIncluded(role('r3'))).toBe(false);
      });

      it('returns false when no threshold is set', () => {
        setup();
        fixture.detectChanges();
        component.availableRoles.set([role('r1')]);
        component.form.controls.minRosterRoleId.setValue(null);

        expect(component.isRoleIncluded(role('r1'))).toBe(false);
      });
    });

    describe('isRoleExcluded', () => {
      it('returns true for roles after the threshold index', () => {
        setupWithRoles();

        expect(component.isRoleExcluded(role('r1'))).toBe(false);
        expect(component.isRoleExcluded(role('r2'))).toBe(false);
        expect(component.isRoleExcluded(role('r3'))).toBe(true);
      });

      it('returns false when no threshold is set', () => {
        setup();
        fixture.detectChanges();
        component.availableRoles.set([role('r1')]);
        component.form.controls.minRosterRoleId.setValue(null);

        expect(component.isRoleExcluded(role('r1'))).toBe(false);
      });
    });
  });

  // ── selectThreshold ───────────────────────────────────────────────────────

  describe('selectThreshold', () => {
    it('sets minRosterRoleId to the selected role', () => {
      setup();
      fixture.detectChanges();
      component.selectThreshold('r1');

      expect(component.form.value.minRosterRoleId).toBe('r1');
    });

    it('clears minRosterRoleId when the same role is selected again (toggle off)', () => {
      setup();
      fixture.detectChanges();
      component.form.controls.minRosterRoleId.setValue('r1');
      component.selectThreshold('r1');

      expect(component.form.value.minRosterRoleId).toBeNull();
    });
  });

  // ── roleColor ─────────────────────────────────────────────────────────────

  describe('roleColor', () => {
    it('returns a 6-digit lowercase hex string for a non-zero color', () => {
      setup();
      expect(component.roleColor(role('r1', 0xff0000))).toBe('#ff0000');
    });

    it('zero-pads the hex string to 6 characters', () => {
      setup();
      expect(component.roleColor(role('r1', 0x0000ff))).toBe('#0000ff');
    });

    it('returns null for a zero color', () => {
      setup();
      expect(component.roleColor(role('r1', 0))).toBeNull();
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

  // ── roleIconUrl ───────────────────────────────────────────────────────────

  describe('roleIconUrl', () => {
    it('returns a Discord CDN URL containing the role id and icon hash', () => {
      setup();
      const url = component.roleIconUrl(role('r1', 0, 'abc123'));

      expect(url).toContain('/role-icons/r1/abc123');
    });

    it('returns null when iconHash is null', () => {
      setup();
      expect(component.roleIconUrl(role('r1', 0, null))).toBeNull();
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
    });

    it('does not submit a second time while already submitting', () => {
      setup();
      const pending = new Subject<void>();
      settingsService.updateSettings.mockReturnValue(pending.asObservable());
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC' });

      component.submit();
      component.submit();

      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);
    });

    it('calls updateSettings with the correct payload on success', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', rosterMode: RosterMode.Open });

      component.submit();

      expect(settingsService.updateSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC', rosterMode: RosterMode.Open, minRosterRoleId: null }),
      );
    });

    it('sends minRosterRoleId when rosterMode is DiscordRoleOnly', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(of([role('r1')]));
      fixture.detectChanges();
      component.form.controls.rosterMode.setValue(RosterMode.DiscordRoleOnly);
      component.form.controls.minRosterRoleId.setValue('r1');

      component.submit();

      const [, sent] = settingsService.updateSettings.mock.calls[0] as [string, GuildSettings];
      expect(sent.minRosterRoleId).toBe('r1');
    });

    it('forces minRosterRoleId to null when rosterMode is Open', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC', rosterMode: RosterMode.Open });
      // Bypass rosterMode subscription to sneak a value into the control
      component.form.controls.minRosterRoleId.setValue('r1', { emitEvent: false });

      component.submit();

      const [, sent] = settingsService.updateSettings.mock.calls[0] as [string, GuildSettings];
      expect(sent.minRosterRoleId).toBeNull();
    });

    it('patches the store and emits saved on success', () => {
      setup();
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC' });
      const savedSpy = vi.spyOn(component.saved, 'emit');

      component.submit();

      expect(guildStore.patchSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC' }),
      );
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.saveSuccess');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('shows snackbar error and resets submitting flag on failure', () => {
      setup();
      settingsService.updateSettings.mockReturnValue(throwError(() => new Error()));
      fixture.detectChanges();
      component.form.patchValue({ timezone: 'UTC' });

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });
});
