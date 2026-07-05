import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

describe('HeaderComponent', () => {
  let signup: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let events: Subject<NavigationEnd>;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;

  const setup = (authenticated = false, url = '/home') => {
    signup = vi.fn();
    logout = vi.fn().mockReturnValue(of(undefined));
    navigate = vi.fn().mockResolvedValue(true);
    navigateByUrl = vi.fn().mockResolvedValue(true);
    events = new Subject<NavigationEnd>();
    isAuthenticated = signal(authenticated);

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthStore, useValue: { isAuthenticated: isAuthenticated.asReadonly(), user: signal(null), logout } },
        { provide: AuthService, useValue: { signup } },
        { provide: Router, useValue: { navigate, navigateByUrl, url, events } },
      ],
    })
    .overrideComponent(HeaderComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  /** Simulates the router finishing a navigation to `url`. */
  const navigateTo = (url: string, id = 1) => events.next(new NavigationEnd(id, url, url));

  const fakeClickEvent = () => ({ preventDefault: vi.fn() }) as unknown as Event;

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('iconType is DiscordIconType.User', () => {
    expect(setup().iconType).toBe(DiscordIconType.User);
  });

  it('isAuthenticated is wired from AuthStore', () => {
    const component = setup(true);
    expect(component.isAuthenticated()).toBe(true);
  });

  describe('onLoginClick', () => {
    it('signs up with returnTo=home when not on get-started', () => {
      setup(false, '/home').onLoginClick();
      expect(signup).toHaveBeenCalledWith('home');
    });

    it('signs up with returnTo=get-started when on get-started', () => {
      setup(false, '/get-started').onLoginClick();
      expect(signup).toHaveBeenCalledWith('get-started');
    });
  });

  describe('onLogoutClick', () => {
    it('calls AuthStore.logout and navigates to /home on success', () => {
      setup().onLogoutClick();

      expect(logout).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  // ── onHelpClick / onChangelogClick (toggle-back navigation) ──────────────

  describe('onHelpClick', () => {
    it('does nothing when not currently on /manual', () => {
      const component = setup(false, '/guilds');
      const event = fakeClickEvent();

      component.onHelpClick(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('navigates back to the route open before entering /manual', () => {
      const component = setup(false, '/guilds');
      navigateTo('/manual/getting-started/create-character');
      const event = fakeClickEvent();

      component.onHelpClick(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });

    it('falls back to "/" when /manual was entered before any navigation was observed', () => {
      const component = setup(false, '/manual/welcome/onboarding');

      component.onHelpClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('keeps the pre-manual return url stable while moving between manual articles', () => {
      const component = setup(false, '/guilds');
      navigateTo('/manual/welcome/onboarding');
      navigateTo('/manual/guild/roster', 2);

      component.onHelpClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });
  });

  describe('onChangelogClick', () => {
    it('does nothing when not currently on /changelog', () => {
      const component = setup(false, '/guilds');
      const event = fakeClickEvent();

      component.onChangelogClick(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('navigates back to the route open before entering /changelog', () => {
      const component = setup(false, '/guilds');
      navigateTo('/changelog');
      const event = fakeClickEvent();

      component.onChangelogClick(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });

    it('tracks the manual and changelog return urls independently', () => {
      const component = setup(false, '/guilds');
      navigateTo('/manual/welcome/onboarding');
      navigateTo('/changelog', 2);

      component.onChangelogClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/manual/welcome/onboarding');
    });

    it('keeps the pre-changelog return url stable while re-entering /changelog', () => {
      const component = setup(false, '/guilds');
      navigateTo('/changelog');
      navigateTo('/changelog', 2);

      component.onChangelogClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });
  });

  describe('onRoadmapClick', () => {
    it('does nothing when not currently on /roadmap', () => {
      const component = setup(false, '/guilds');
      const event = fakeClickEvent();

      component.onRoadmapClick(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('navigates back to the route open before entering /roadmap', () => {
      const component = setup(false, '/guilds');
      navigateTo('/roadmap');
      const event = fakeClickEvent();

      component.onRoadmapClick(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });

    it('tracks the changelog and roadmap return urls independently', () => {
      const component = setup(false, '/guilds');
      navigateTo('/changelog');
      navigateTo('/roadmap', 2);

      component.onRoadmapClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/changelog');
    });

    it('keeps the pre-roadmap return url stable while re-entering /roadmap', () => {
      const component = setup(false, '/guilds');
      navigateTo('/roadmap');
      navigateTo('/roadmap', 2);

      component.onRoadmapClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });
  });
});
