import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

describe('HeaderComponent', () => {
  let signup: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;

  const setup = (authenticated = false) => {
    signup = vi.fn();
    logout = vi.fn().mockReturnValue(of(undefined));
    navigate = vi.fn().mockResolvedValue(true);
    isAuthenticated = signal(authenticated);

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthStore, useValue: { isAuthenticated: isAuthenticated.asReadonly(), user: signal(null), logout } },
        { provide: AuthService, useValue: { signup } },
        { provide: Router, useValue: { navigate } },
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
    it('calls AuthService.signup', () => {
      setup().onLoginClick();
      expect(signup).toHaveBeenCalledOnce();
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
