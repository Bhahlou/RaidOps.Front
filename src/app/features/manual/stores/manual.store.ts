import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MANUAL_CATEGORIES } from '../data/manual-content.data';
import { ManualArticle, ManualCategory } from '../models/manual-article.model';

@Injectable({ providedIn: 'root' })
export class ManualStore {
  readonly #http = inject(HttpClient);

  readonly categories: readonly ManualCategory[] = MANUAL_CATEGORIES;

  getArticle(categoryId: string, articleId: string): ManualArticle | undefined {
    return this.categories
      .find((category) => category.id === categoryId)
      ?.articles.find((article) => article.id === articleId);
  }

  loadArticleContent(path: string): Observable<string> {
    return this.#http.get(path, { responseType: 'text' });
  }
}
