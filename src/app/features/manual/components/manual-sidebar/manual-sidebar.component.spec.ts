import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { ManualSidebarComponent } from './manual-sidebar.component';
import { ManualStore } from '../../stores/manual.store';
import { ManualCategory } from '../../models/manual-article.model';

describe('ManualSidebarComponent', () => {
  let back: ReturnType<typeof vi.fn>;

  const categories: ManualCategory[] = [
    { id: 'welcome', labelKey: 'manual.category.welcome', icon: 'waving_hand', articles: [] },
    { id: 'account', labelKey: 'manual.category.account', icon: 'discord', articles: [] },
  ];

  const setup = () => {
    back = vi.fn();

    TestBed.configureTestingModule({
      imports: [ManualSidebarComponent],
      providers: [
        { provide: ManualStore, useValue: { categories } },
        { provide: Location, useValue: { back } },
      ],
    }).overrideComponent(ManualSidebarComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ManualSidebarComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── categories ────────────────────────────────────────────────────────────

  describe('categories', () => {
    it('exposes the categories from the store', () => {
      expect(setup().categories).toBe(categories);
    });
  });

  // ── openCategoryIds ───────────────────────────────────────────────────────

  describe('openCategoryIds', () => {
    it('starts with every category open', () => {
      const component = setup();

      expect(component.openCategoryIds()).toEqual(new Set(['welcome', 'account']));
    });
  });

  // ── toggleCategory ────────────────────────────────────────────────────────

  describe('toggleCategory', () => {
    it('closes an open category', () => {
      const component = setup();

      component.toggleCategory('welcome');

      expect(component.openCategoryIds().has('welcome')).toBe(false);
    });

    it('reopens a closed category', () => {
      const component = setup();

      component.toggleCategory('welcome');
      component.toggleCategory('welcome');

      expect(component.openCategoryIds().has('welcome')).toBe(true);
    });

    it('does not affect other categories', () => {
      const component = setup();

      component.toggleCategory('welcome');

      expect(component.openCategoryIds().has('account')).toBe(true);
    });
  });

  // ── goBack ────────────────────────────────────────────────────────────────

  describe('goBack', () => {
    it('delegates to Location.back', () => {
      setup().goBack();

      expect(back).toHaveBeenCalledOnce();
    });
  });
});
