import { TestBed } from '@angular/core/testing';

import { MarkdownRendererComponent } from './markdown-renderer.component';

describe('MarkdownRendererComponent', () => {
  const setup = (content = '') => {
    TestBed.configureTestingModule({
      imports: [MarkdownRendererComponent],
    });

    const fixture = TestBed.createComponent(MarkdownRendererComponent);
    fixture.componentRef.setInput('content', content);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup().componentInstance).toBeTruthy();
  });

  // ── renderedHtml ──────────────────────────────────────────────────────────

  describe('renderedHtml', () => {
    it('defaults to empty content', () => {
      expect(setup().componentInstance.renderedHtml()).toBe('');
    });

    it('renders markdown headings as HTML', () => {
      const html = setup('# Title').componentInstance.renderedHtml();

      expect(html).toContain('<h1>Title</h1>');
    });

    it('renders markdown links as anchor tags', () => {
      const html = setup('[RaidOps](https://raidops.example)').componentInstance.renderedHtml();

      expect(html).toContain('<a href="https://raidops.example">RaidOps</a>');
    });

    it('re-renders when the content input changes', () => {
      const fixture = setup('# First');
      expect(fixture.componentInstance.renderedHtml()).toContain('First');

      fixture.componentRef.setInput('content', '# Second');
      fixture.detectChanges();

      expect(fixture.componentInstance.renderedHtml()).toContain('Second');
    });

    it('binds the rendered HTML into the template via innerHTML', () => {
      const fixture = setup('# Title');

      expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe('Title');
    });
  });
});
