import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { MANUAL_CATEGORIES } from '../data/manual-content.data';
import { ManualArticle, ManualCategory } from '../models/manual-article.model';

@Service()
export class ManualStore {
  readonly categories: readonly ManualCategory[] = MANUAL_CATEGORIES;

  readonly #contentPath = signal<string | undefined>(undefined);

  readonly #contentResource = httpResource.text(() => this.#contentPath());

  readonly content = computed(() => this.#contentResource.value() ?? '');

  getArticle(categoryId: string, articleId: string): ManualArticle | undefined {
    return this.categories
      .find((category) => category.id === categoryId)
      ?.articles.find((article) => article.id === articleId);
  }

  /** Points the store at an article's markdown file for the given language, or clears it (`undefined`) when no article is resolved. */
  loadArticleContent(path: string | undefined): void {
    this.#contentPath.set(path);
  }
}
