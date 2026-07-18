import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

describe('HeaderComponent', () => {
  let signup: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let loadUser: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;

  const setup = (authenticated = false, url = '/home') => {
    signup = vi.fn();
    logout = vi.fn().mockReturnValue(of(undefined));
    loadUser = vi.fn().mockReturnValue(of(null));
    navigate = vi.fn().mockResolvedValue(true);
    isAuthenticated = signal(authenticated);

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthStore, useValue: { isAuthenticated: isAuthenticated.asReadonly(), user: signal(null), logout, loadUser } },
        { provide: AuthService, useValue: { signup } },
        { provide: Router, useValue: { navigate, url } },
      ],
    })
    .overrideComponent(HeaderComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

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

  describe('silent bootstrap auth check', () => {
    it('calls AuthStore.loadUser on init when not authenticated', () => {
      setup(false);
      expect(loadUser).toHaveBeenCalledOnce();
    });

    it('does not call AuthStore.loadUser on init when already authenticated', () => {
      setup(true);
      expect(loadUser).not.toHaveBeenCalled();
    });

    it('swallows the error silently when no valid cookie is present (genuinely logged out)', () => {
      loadUser = vi.fn().mockReturnValue(throwError(() => new Error('401')));
      isAuthenticated = signal(false);

      TestBed.configureTestingModule({
        imports: [HeaderComponent],
        providers: [
          { provide: AuthStore, useValue: { isAuthenticated: isAuthenticated.asReadonly(), user: signal(null), logout: vi.fn(), loadUser } },
          { provide: AuthService, useValue: { signup: vi.fn() } },
          { provide: Router, useValue: { navigate: vi.fn(), url: '/home' } },
        ],
      })
      .overrideComponent(HeaderComponent, { set: { template: '', imports: [] } });

      expect(() => {
        const fixture = TestBed.createComponent(HeaderComponent);
        fixture.detectChanges();
      }).not.toThrow();

      expect(loadUser).toHaveBeenCalledOnce();
    });
  });

  describe('onLogoutClick', () => {
    it('calls AuthStore.logout and navigates to /home on success', () => {
      setup().onLogoutClick();

      expect(logout).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith(['/home']);
    });
  });
});
