import { Component, computed, input } from '@angular/core';
import { marked } from 'marked';

/**
 * Renders Markdown as HTML via a plain [innerHTML] binding, so Angular's DomSanitizer still runs
 * on the output — a safety net in case a markdown source ever contains raw HTML (marked passes
 * inline HTML through untouched), even though content is always first-party/authored.
 */
@Component({
  selector: 'app-markdown-renderer',
  templateUrl: './markdown-renderer.component.html',
  styleUrl: './markdown-renderer.component.scss',
})
export class MarkdownRendererComponent {
  readonly content = input<string>('');

  readonly renderedHtml = computed(() => marked.parse(this.content(), { async: false }));
}
