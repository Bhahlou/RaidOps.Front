import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { RequiresAuthBadgeComponent } from './requires-auth-badge.component';

describe('RequiresAuthBadgeComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({
      imports: [
        RequiresAuthBadgeComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    });

    const fixture = TestBed.createComponent(RequiresAuthBadgeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
