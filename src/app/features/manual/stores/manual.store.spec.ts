import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ManualStore } from './manual.store';
import { MANUAL_CATEGORIES } from '../data/manual-content.data';

describe('ManualStore', () => {
  let store: ManualStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ManualStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ManualStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── categories ────────────────────────────────────────────────────────────

  describe('categories', () => {
    it('exposes the static MANUAL_CATEGORIES data', () => {
      expect(store.categories).toBe(MANUAL_CATEGORIES);
    });
  });

  // ── getArticle ────────────────────────────────────────────────────────────

  describe('getArticle', () => {
    it('returns the article when the category and article ids both match', () => {
      const category = MANUAL_CATEGORIES[0];
      const article = category.articles[0];

      expect(store.getArticle(category.id, article.id)).toBe(article);
    });

    it('returns undefined when the category id does not exist', () => {
      expect(store.getArticle('does-not-exist', 'anything')).toBeUndefined();
    });

    it('returns undefined when the article id does not exist within an existing category', () => {
      const category = MANUAL_CATEGORIES[0];

      expect(store.getArticle(category.id, 'does-not-exist')).toBeUndefined();
    });
  });

  // ── loadArticleContent ────────────────────────────────────────────────────

  describe('loadArticleContent', () => {
    it('GETs the given path as plain text', () => {
      let result: string | undefined;
      store.loadArticleContent('assets/manual/en/welcome/onboarding.md').subscribe((r) => (result = r));

      const req = controller.expectOne('assets/manual/en/welcome/onboarding.md');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('text');
      req.flush('# Hello');

      expect(result).toBe('# Hello');
    });
  });
});
