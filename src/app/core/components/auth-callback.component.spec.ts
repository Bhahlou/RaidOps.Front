import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthCallbackComponent } from './auth-callback.component';
import { AuthStore } from '../stores/auth.store';

describe('AuthCallbackComponent', () => {
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let navigate: ReturnType<typeof vi.fn>;

  const setup = (loadUser: () => ReturnType<typeof of>) => {
    navigate = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthStore, useValue: { loadUser } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    fixture = TestBed.createComponent(AuthCallbackComponent);
  };

  it('should create', () => {
    setup(() => of(undefined));
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('navigates to /guilds on successful loadUser', () => {
    setup(() => of(undefined));

    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/guilds']);
  });

  it('navigates to /home when loadUser fails', () => {
    setup(() => throwError(() => new Error('auth failed')));

    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/home']);
  });
});
