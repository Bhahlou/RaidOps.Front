import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, of, switchMap } from 'rxjs';
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

  /** Re-fetches whenever the resolved article or the active language changes. */
  readonly content = toSignal(
    combineLatest([toObservable(this.article), toObservable(this.#activeLang)]).pipe(
      switchMap(([article, lang]) =>
        article ? this.#manualStore.loadArticleContent(article.contentPath(lang)) : of(''),
      ),
    ),
    { initialValue: '' },
  );
}
