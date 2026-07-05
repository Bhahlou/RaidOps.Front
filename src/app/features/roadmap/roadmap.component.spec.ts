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
});
