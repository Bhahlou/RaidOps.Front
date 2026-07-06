import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
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

  // ── loadArticleContent / content ─────────────────────────────────────────

  describe('loadArticleContent', () => {
    it('is empty before any path is set', () => {
      TestBed.tick();
      expect(store.content()).toBe('');
    });

    it('GETs the given path as plain text', async () => {
      store.loadArticleContent('assets/manual/en/welcome/onboarding.md');
      TestBed.tick();

      const req = controller.expectOne('assets/manual/en/welcome/onboarding.md');
      expect(req.request.method).toBe('GET');
      req.flush('# Hello');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.content()).toBe('# Hello');
    });

    it('re-fetches when given a different path', async () => {
      store.loadArticleContent('assets/manual/en/welcome/onboarding.md');
      TestBed.tick();
      controller.expectOne('assets/manual/en/welcome/onboarding.md').flush('# Hello');
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadArticleContent('assets/manual/fr/welcome/onboarding.md');
      TestBed.tick();
      controller.expectOne('assets/manual/fr/welcome/onboarding.md').flush('# Bonjour');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.content()).toBe('# Bonjour');
    });

    it('clears the content when given undefined', async () => {
      store.loadArticleContent('assets/manual/en/welcome/onboarding.md');
      TestBed.tick();
      controller.expectOne('assets/manual/en/welcome/onboarding.md').flush('# Hello');
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadArticleContent(undefined);
      TestBed.tick();

      expect(store.content()).toBe('');
    });
  });
});
