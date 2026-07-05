import { MANUAL_CATEGORIES } from './manual-content.data';

describe('MANUAL_CATEGORIES', () => {
  const allArticles = MANUAL_CATEGORIES.flatMap((category) => category.articles);

  it('has at least one category with at least one article', () => {
    expect(MANUAL_CATEGORIES.length).toBeGreaterThan(0);
    expect(allArticles.length).toBeGreaterThan(0);
  });

  it.each(allArticles.map((article) => [article.id, article] as const))(
    'contentPath for "%s" resolves to a per-language markdown asset for every locale',
    (_id, article) => {
      for (const lang of ['fr', 'en', 'de']) {
        expect(article.contentPath(lang)).toBe(article.contentPath(lang));
        expect(article.contentPath(lang)).toMatch(new RegExp(`^assets/manual/${lang}/.+\\.md$`));
      }
    },
  );
});
