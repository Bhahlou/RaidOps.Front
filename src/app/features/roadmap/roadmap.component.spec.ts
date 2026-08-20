import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { RoadmapComponent } from './roadmap.component';
import { ROADMAP_SECTIONS } from './data/roadmap-sections.data';
import { RoadmapItemStatus, RoadmapSection } from './models/roadmap-section.model';

describe('RoadmapComponent', () => {
  let back: ReturnType<typeof vi.fn>;

  const setup = () => {
    back = vi.fn();

    TestBed.configureTestingModule({
      imports: [RoadmapComponent],
      providers: [{ provide: Location, useValue: { back } }],
    }).overrideComponent(RoadmapComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(RoadmapComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── sections ──────────────────────────────────────────────────────────────

  describe('sections', () => {
    it('exposes the static ROADMAP_SECTIONS data', () => {
      expect(setup().sections).toBe(ROADMAP_SECTIONS);
    });
  });

  // ── ItemStatus ────────────────────────────────────────────────────────────

  describe('ItemStatus', () => {
    it('exposes the RoadmapItemStatus enum for the template', () => {
      expect(setup().ItemStatus).toBe(RoadmapItemStatus);
    });
  });

  // ── goBack ────────────────────────────────────────────────────────────────

  describe('goBack', () => {
    it('delegates to Location.back', () => {
      setup().goBack();

      expect(back).toHaveBeenCalledOnce();
    });
  });

  // ── isExpanded / setExpanded ─────────────────────────────────────────────

  describe('isExpanded', () => {
    it('defaults to true before any explicit toggle', () => {
      expect(setup().isExpanded('s1')).toBe(true);
    });

    it('reflects an explicit setExpanded(false)', () => {
      const component = setup();

      component.setExpanded('s1', false);

      expect(component.isExpanded('s1')).toBe(false);
    });

    it('reflects an explicit setExpanded(true) after a prior collapse', () => {
      const component = setup();

      component.setExpanded('s1', false);
      component.setExpanded('s1', true);

      expect(component.isExpanded('s1')).toBe(true);
    });

    it('tracks each section independently', () => {
      const component = setup();

      component.setExpanded('s1', false);

      expect(component.isExpanded('s1')).toBe(false);
      expect(component.isExpanded('s2')).toBe(true);
    });
  });

  // ── doneCount ─────────────────────────────────────────────────────────────

  describe('doneCount', () => {
    const buildSection = (statuses: RoadmapItemStatus[]): RoadmapSection => ({
      id: 'test-section',
      titleKey: 'roadmap.section.test.title',
      items: statuses.map((status, i) => ({
        id: `item-${i}`,
        titleKey: `roadmap.items.item-${i}.title`,
        descriptionKey: `roadmap.items.item-${i}.description`,
        status,
      })),
    });

    it('counts only Done items', () => {
      const component = setup();
      const section = buildSection([
        RoadmapItemStatus.Done,
        RoadmapItemStatus.Planned,
        RoadmapItemStatus.Done,
      ]);

      expect(component.doneCount(section)).toBe(2);
    });

    it('is 0 when the section has no items', () => {
      const component = setup();

      expect(component.doneCount(buildSection([]))).toBe(0);
    });

    it('is 0 when every item is still Planned', () => {
      const component = setup();
      const section = buildSection([RoadmapItemStatus.Planned, RoadmapItemStatus.Planned]);

      expect(component.doneCount(section)).toBe(0);
    });
  });

  // ── isComplete ────────────────────────────────────────────────────────────

  describe('isComplete', () => {
    const buildSection = (statuses: RoadmapItemStatus[]): RoadmapSection => ({
      id: 'test-section',
      titleKey: 'roadmap.section.test.title',
      items: statuses.map((status, i) => ({
        id: `item-${i}`,
        titleKey: `roadmap.items.item-${i}.title`,
        descriptionKey: `roadmap.items.item-${i}.description`,
        status,
      })),
    });

    it('is true when every item is Done', () => {
      const component = setup();
      const section = buildSection([RoadmapItemStatus.Done, RoadmapItemStatus.Done]);

      expect(component.isComplete(section)).toBe(true);
    });

    it('is false when at least one item is still Planned', () => {
      const component = setup();
      const section = buildSection([RoadmapItemStatus.Done, RoadmapItemStatus.Planned]);

      expect(component.isComplete(section)).toBe(false);
    });

    it('is false when the section has no items', () => {
      const component = setup();

      expect(component.isComplete(buildSection([]))).toBe(false);
    });
  });
});
