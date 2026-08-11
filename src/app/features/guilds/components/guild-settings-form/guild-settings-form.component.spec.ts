import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormRoot } from '@angular/forms/signals';
import { of, Subject, throwError } from 'rxjs';

import { GuildSettingsFormComponent, buildTimezoneOption } from './guild-settings-form.component';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildStore } from '../../stores/guild.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LanguageService } from '../../../../core/services/language.service';
import { GuildSettings } from '../../models/guild-settings.model';

const settings = (overrides?: Partial<GuildSettings>): GuildSettings => ({
  timezone: 'Europe/Paris',
  language: 'en',
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
  let settingsService: { updateSettings: ReturnType<typeof vi.fn> };
  let guildStore: {
    settings: ReturnType<typeof signal<GuildSettings | null>>;
    loadSettings: ReturnType<typeof vi.fn>;
    patchSettings: ReturnType<typeof vi.fn>;
  };
  let authStore: { loadUser: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const setup = (guildId = 'g1', storeSettings = settings()) => {
    settingsService = { updateSettings: vi.fn().mockReturnValue(of(undefined)) };
    guildStore = {
      settings: signal<GuildSettings | null>(null),
      loadSettings: vi.fn(),
      patchSettings: vi.fn(),
    };
    guildStore.loadSettings.mockImplementation(() => guildStore.settings.set(storeSettings));
    authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildSettingsFormComponent],
      providers: [
        { provide: GuildSettingsService, useValue: settingsService },
        { provide: GuildStore, useValue: guildStore },
        { provide: AuthStore, useValue: authStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: LanguageService, useValue: { activeLang: 'en', availableLangs: ['fr', 'en', 'de'], setLang: vi.fn() } },
      ],
    }).overrideComponent(GuildSettingsFormComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildSettingsFormComponent);
    fixture.componentRef.setInput('guildId', guildId);
    component = fixture.componentInstance;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('pre-fills the form with settings from the store', () => {
      setup('g1', settings({ timezone: 'UTC' }));
      fixture.detectChanges();

      expect(component.settingsForm.timezone().value()).toBe('UTC');
    });

    it('keeps the local timezone when the store returns an empty timezone', () => {
      setup('g1', settings({ timezone: '' }));
      fixture.detectChanges();

      expect(component.settingsForm.timezone().value()).not.toBe('');
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

  // ── constructor effect ──────────────────────────────────────────────────

  describe('constructor effect', () => {
    it('leaves the form model untouched while settings have not resolved yet', () => {
      setup();
      guildStore.loadSettings.mockImplementation(() => {}); // simulate the httpResource still pending

      fixture.detectChanges();

      expect(guildStore.settings()).toBeNull();
      expect(component.settingsForm.timezone().value().length).toBeGreaterThan(0); // untouched local default, not blown away
    });
  });

  // ── languageOptions ───────────────────────────────────────────────────────

  describe('languageOptions', () => {
    it('falls back to the raw language code when it has no native-language label', () => {
      TestBed.configureTestingModule({
        imports: [GuildSettingsFormComponent],
        providers: [
          { provide: GuildSettingsService, useValue: { updateSettings: vi.fn().mockReturnValue(of(undefined)) } },
          { provide: GuildStore, useValue: { settings: signal(null), loadSettings: vi.fn() } },
          { provide: AuthStore, useValue: { loadUser: vi.fn() } },
          { provide: SnackbarService, useValue: { error: vi.fn(), success: vi.fn() } },
          { provide: LanguageService, useValue: { activeLang: 'en', availableLangs: ['en', 'es'], setLang: vi.fn() } },
        ],
      }).overrideComponent(GuildSettingsFormComponent, { set: { template: '', imports: [] } });

      const testFixture = TestBed.createComponent(GuildSettingsFormComponent);
      testFixture.componentRef.setInput('guildId', 'g1');

      expect(testFixture.componentInstance.languageOptions).toContainEqual({ value: 'es', label: 'es' });
    });
  });

  // ── languageNotYetSaved ───────────────────────────────────────────────────

  describe('languageNotYetSaved', () => {
    it('is false before settings have loaded', () => {
      setup();

      expect(component.languageNotYetSaved()).toBe(false);
    });

    it('is true once settings have loaded with no language saved', () => {
      setup('g1', settings({ language: '' }));
      fixture.detectChanges();

      expect(component.languageNotYetSaved()).toBe(true);
    });

    it('is false once settings have loaded with a language saved', () => {
      setup('g1', settings({ language: 'fr' }));
      fixture.detectChanges();

      expect(component.languageNotYetSaved()).toBe(false);
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
    });

    it('does not submit a second time while already submitting', async () => {
      setup();
      const pending = new Subject<void>();
      settingsService.updateSettings.mockReturnValue(pending.asObservable());
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');

      const first = component.submit();
      const second = component.submit();
      pending.next();
      pending.complete();
      await Promise.all([first, second]);

      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);
    });

    it('calls updateSettings with the correct payload', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');

      await component.submit();

      expect(settingsService.updateSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC' }),
      );
    });

    it('patches the store, resyncs the user and emits saved on success', async () => {
      setup();
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');
      const savedSpy = vi.spyOn(component.saved, 'emit');

      await component.submit();

      expect(guildStore.patchSettings).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ timezone: 'UTC' }),
      );
      expect(authStore.loadUser).toHaveBeenCalledOnce();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.saveSuccess');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('shows snackbar error and resets submitting flag when the call fails', async () => {
      setup();
      settingsService.updateSettings.mockReturnValue(throwError(() => new Error('update failed')));
      fixture.detectChanges();
      component.settingsForm.timezone().value.set('UTC');

      await component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });

  // ── autoSave mode ─────────────────────────────────────────────────────────

  describe('autoSave mode', () => {
    it('does not auto-submit when autoSave is off, even once dirty', () => {
      setup();
      fixture.detectChanges();

      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.timezone().markAsDirty();
      fixture.detectChanges();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('does not auto-submit a value pick that has not been marked dirty', () => {
      setup();
      fixture.componentRef.setInput('autoSave', true);
      fixture.detectChanges();

      component.settingsForm.timezone().value.set('UTC');
      fixture.detectChanges();

      expect(settingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('auto-submits once a bound control is picked and marked dirty', () => {
      setup();
      fixture.componentRef.setInput('autoSave', true);
      fixture.detectChanges();

      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.timezone().markAsDirty();
      fixture.detectChanges();

      expect(settingsService.updateSettings).toHaveBeenCalledWith('g1', expect.objectContaining({ timezone: 'UTC' }));
    });

    it('does not fire a second auto-submit while one is still in flight', () => {
      setup();
      const pending = new Subject<void>();
      settingsService.updateSettings.mockReturnValue(pending.asObservable());
      fixture.componentRef.setInput('autoSave', true);
      fixture.detectChanges();

      component.settingsForm.timezone().value.set('UTC');
      component.settingsForm.timezone().markAsDirty();
      fixture.detectChanges();
      // A second pick while the first save is still pending re-runs the effect (value read
      // changed again) — submitting() is read untracked, so this must not re-trigger submit().
      component.settingsForm.language().value.set('fr');
      component.settingsForm.language().markAsDirty();
      fixture.detectChanges();

      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);

      pending.next();
      pending.complete();
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
      settingsService = { updateSettings: vi.fn().mockReturnValue(of(undefined)) };
      guildStore = {
        settings: signal<GuildSettings | null>(null),
        loadSettings: vi.fn(),
        patchSettings: vi.fn(),
      };
      guildStore.loadSettings.mockImplementation(() => guildStore.settings.set(settings()));
      authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };
      snackbar = { error: vi.fn(), success: vi.fn() };

      TestBed.configureTestingModule({
        imports: [GuildSettingsFormComponent],
        providers: [
          { provide: GuildSettingsService, useValue: settingsService },
          { provide: GuildStore, useValue: guildStore },
          { provide: AuthStore, useValue: authStore },
          { provide: SnackbarService, useValue: snackbar },
          { provide: LanguageService, useValue: { activeLang: 'en', availableLangs: ['fr', 'en', 'de'], setLang: vi.fn() } },
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

      const event = dispatchSubmit();
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(true);
      expect(settingsService.updateSettings).toHaveBeenCalled();
    });

    it('prevents the native page submission but does not call the backend when the form is invalid', async () => {
      setupRealForm();
      component.settingsForm.timezone().value.set('');

      const event = dispatchSubmit();
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(true);
      expect(settingsService.updateSettings).not.toHaveBeenCalled();
    });
  });
});
