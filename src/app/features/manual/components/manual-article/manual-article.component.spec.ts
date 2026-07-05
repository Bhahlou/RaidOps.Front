import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of, Subject } from 'rxjs';

import { ManualArticleComponent } from './manual-article.component';
import { ManualStore } from '../../stores/manual.store';
import { ManualArticle } from '../../models/manual-article.model';

describe('ManualArticleComponent', () => {
  let getArticle: ReturnType<typeof vi.fn>;
  let loadArticleContent: ReturnType<typeof vi.fn>;
  let langChanges$: Subject<string>;

  const article: ManualArticle = {
    id: 'onboarding',
    labelKey: 'manual.article.onboarding.title',
    contentPath: (lang) => `assets/manual/${lang}/welcome/onboarding.md`,
  };

  const setup = (categoryId: string | null, articleId: string | null) => {
    getArticle = vi.fn().mockReturnValue(article);
    loadArticleContent = vi.fn().mockReturnValue(of('# content'));
    langChanges$ = new Subject<string>();

    TestBed.configureTestingModule({
      imports: [ManualArticleComponent],
      providers: [
        { provide: ManualStore, useValue: { getArticle, loadArticleContent } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ categoryId: categoryId ?? '', articleId: articleId ?? '' })) },
        },
        {
          provide: TranslocoService,
          useValue: { langChanges$, getActiveLang: () => 'en' },
        },
      ],
    }).overrideComponent(ManualArticleComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ManualArticleComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup('welcome', 'onboarding').componentInstance).toBeTruthy();
  });

  // ── article ───────────────────────────────────────────────────────────────

  describe('article', () => {
    it('resolves via ManualStore.getArticle using the route params', () => {
      const component = setup('welcome', 'onboarding').componentInstance;

      expect(getArticle).toHaveBeenCalledWith('welcome', 'onboarding');
      expect(component.article()).toBe(article);
    });
  });

  // ── content ───────────────────────────────────────────────────────────────

  describe('content', () => {
    it('loads the article content for the initial active language', () => {
      const component = setup('welcome', 'onboarding').componentInstance;

      expect(loadArticleContent).toHaveBeenCalledWith('assets/manual/en/welcome/onboarding.md');
      expect(component.content()).toBe('# content');
    });

    it('is empty when no article resolves for the current route', () => {
      getArticle = vi.fn().mockReturnValue(undefined);
      loadArticleContent = vi.fn();
      langChanges$ = new Subject<string>();

      TestBed.configureTestingModule({
        imports: [ManualArticleComponent],
        providers: [
          { provide: ManualStore, useValue: { getArticle, loadArticleContent } },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of(convertToParamMap({ categoryId: 'nope', articleId: 'nope' })) },
          },
          { provide: TranslocoService, useValue: { langChanges$, getActiveLang: () => 'en' } },
        ],
      }).overrideComponent(ManualArticleComponent, { set: { template: '', imports: [] } });

      const fixture = TestBed.createComponent(ManualArticleComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.content()).toBe('');
      expect(loadArticleContent).not.toHaveBeenCalled();
    });

    it('re-fetches with the new language path when the active language changes', () => {
      const fixture = setup('welcome', 'onboarding');
      loadArticleContent.mockReturnValue(of('# french content'));

      langChanges$.next('fr');
      fixture.detectChanges();

      expect(loadArticleContent).toHaveBeenCalledWith('assets/manual/fr/welcome/onboarding.md');
      expect(fixture.componentInstance.content()).toBe('# french content');
    });
  });
});
