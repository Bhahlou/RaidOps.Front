import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { NavIconLinkComponent } from './nav-icon-link.component';

describe('NavIconLinkComponent', () => {
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let events: Subject<NavigationEnd>;

  const setup = (url = '/home') => {
    navigateByUrl = vi.fn().mockResolvedValue(true);
    events = new Subject<NavigationEnd>();

    TestBed.configureTestingModule({
      imports: [NavIconLinkComponent],
      providers: [{ provide: Router, useValue: { navigateByUrl, url, events } }],
    }).overrideComponent(NavIconLinkComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(NavIconLinkComponent);
    fixture.componentRef.setInput('route', '/manual');
    fixture.componentRef.setInput('icon', 'help');
    fixture.componentRef.setInput('label', 'Help');
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  /** Simulates the router finishing a navigation to `url`. */
  const navigateTo = (url: string, id = 1) => events.next(new NavigationEnd(id, url, url));

  const fakeClickEvent = () => ({ preventDefault: vi.fn() }) as unknown as Event;

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('onClick', () => {
    it('does nothing when not currently on its route', () => {
      const component = setup('/guilds');
      const event = fakeClickEvent();

      component.onClick(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('navigates back to the route open before entering its section', () => {
      const component = setup('/guilds');
      navigateTo('/manual/getting-started/create-character');
      const event = fakeClickEvent();

      component.onClick(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });

    it('falls back to "/" when the section was entered before any navigation was observed', () => {
      const component = setup('/manual/welcome/onboarding');

      component.onClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('keeps the pre-section return url stable while moving between its own sub-routes', () => {
      const component = setup('/guilds');
      navigateTo('/manual/welcome/onboarding');
      navigateTo('/manual/guild/roster', 2);

      component.onClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });

    it('keeps the pre-section return url stable while re-entering the same section', () => {
      const component = setup('/guilds');
      navigateTo('/manual/welcome/onboarding');
      navigateTo('/manual/welcome/onboarding', 2);

      component.onClick(fakeClickEvent());

      expect(navigateByUrl).toHaveBeenCalledWith('/guilds');
    });
  });
});
