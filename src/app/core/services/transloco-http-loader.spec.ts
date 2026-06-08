import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TranslocoHttpLoader } from './transloco-http-loader';

describe('TranslocoHttpLoader', () => {
  let loader: TranslocoHttpLoader;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    loader = TestBed.inject(TranslocoHttpLoader);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('sends GET /assets/i18n/:lang.json and returns the translation', () => {
    const mockTranslation = { hello: 'Hello', world: 'World' };

    let result: Record<string, string> | undefined;
    loader.getTranslation('en').subscribe(t => { result = t as Record<string, string>; });

    const req = controller.expectOne('/assets/i18n/en.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockTranslation);

    expect(result).toEqual(mockTranslation);
  });

  it('builds the correct URL for each language code', () => {
    loader.getTranslation('fr').subscribe();
    const req = controller.expectOne('/assets/i18n/fr.json');
    req.flush({});
  });
});
