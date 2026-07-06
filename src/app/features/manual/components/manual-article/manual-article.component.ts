import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ManualStore } from '../../stores/manual.store';
import { AccessLevelBadgeComponent } from '../../../../shared/components/access-level-badge/access-level-badge.component';
import { RequiresAuthBadgeComponent } from '../../../../shared/components/requires-auth-badge/requires-auth-badge.component';
import { MarkdownRendererComponent } from '../../../../shared/components/markdown-renderer/markdown-renderer.component';

@Component({
  selector: 'app-manual-article',
  imports: [
    TranslocoPipe,
    AccessLevelBadgeComponent,
    RequiresAuthBadgeComponent,
    MarkdownRendererComponent,
  ],
  templateUrl: './manual-article.component.html',
  styleUrl: './manual-article.component.scss',
})
export class ManualArticleComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #manualStore = inject(ManualStore);
  readonly #transloco = inject(TranslocoService);

  readonly #params = toSignal(this.#route.paramMap, { requireSync: true });

  readonly article = computed(() => {
    const params = this.#params();
    return this.#manualStore.getArticle(params.get('categoryId')!, params.get('articleId')!);
  });

  readonly #activeLang = toSignal(this.#transloco.langChanges$, {
    initialValue: this.#transloco.getActiveLang(),
  });

  readonly content = this.#manualStore.content;

  constructor() {
    // Points the store at the resolved article's content path whenever the article or the active
    // language changes — the store owns the actual fetch (see ManualStore).
    effect(() => {
      const article = this.article();
      const lang = this.#activeLang();
      this.#manualStore.loadArticleContent(article ? article.contentPath(lang) : undefined);
    });
  }
}
