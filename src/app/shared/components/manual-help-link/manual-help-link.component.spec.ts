import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { By } from '@angular/platform-browser';

import { ManualHelpLinkComponent } from './manual-help-link.component';

describe('ManualHelpLinkComponent', () => {
  const setup = (category: string, article: string): ComponentFixture<ManualHelpLinkComponent> => {
    TestBed.configureTestingModule({
      imports: [
        ManualHelpLinkComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { header: { help: 'Help' } } },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(ManualHelpLinkComponent);
    fixture.componentRef.setInput('category', category);
    fixture.componentRef.setInput('article', article);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup('guild', 'roster').componentInstance).toBeTruthy();
  });

  it('builds the routerLink from the category and article inputs', () => {
    const fixture = setup('guild', 'roster');
    const link = fixture.debugElement.query(By.css('a'));

    expect(link.nativeElement.getAttribute('href')).toBe('/manual/guild/roster');
  });

  it('rebuilds the routerLink when the inputs change', () => {
    const fixture = setup('guild', 'roster');
    fixture.componentRef.setInput('article', 'settings');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('href')).toBe('/manual/guild/settings');
  });
});
