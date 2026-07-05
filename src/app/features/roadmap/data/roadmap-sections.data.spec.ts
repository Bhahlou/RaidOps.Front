import { item, done, section, ROADMAP_SECTIONS } from './roadmap-sections.data';
import { RoadmapItemStatus } from '../models/roadmap-section.model';

describe('item', () => {
  it('defaults to Planned status and derives keys from the given key', () => {
    const result = item('someItem');

    expect(result).toEqual({
      id: 'someItem',
      titleKey: 'roadmap.items.someItem.title',
      descriptionKey: 'roadmap.items.someItem.description',
      status: RoadmapItemStatus.Planned,
    });
  });

  it('accepts an explicit status', () => {
    const result = item('someItem', RoadmapItemStatus.Done);

    expect(result.status).toBe(RoadmapItemStatus.Done);
  });
});

describe('done', () => {
  it('is a shorthand for item(key, Done)', () => {
    expect(done('someItem')).toEqual(item('someItem', RoadmapItemStatus.Done));
  });
});

describe('section', () => {
  it('defaults inProgress to false and derives the title key from the given key', () => {
    const items = [item('a')];

    const result = section('someSection', items);

    expect(result).toEqual({
      id: 'someSection',
      titleKey: 'roadmap.section.someSection.title',
      items,
      inProgress: false,
    });
  });

  it('accepts an explicit inProgress flag', () => {
    const result = section('someSection', [], true);

    expect(result.inProgress).toBe(true);
  });
});

describe('ROADMAP_SECTIONS', () => {
  it('is not empty and every section has at least one item', () => {
    expect(ROADMAP_SECTIONS.length).toBeGreaterThan(0);
    for (const s of ROADMAP_SECTIONS) {
      expect(s.items.length).toBeGreaterThan(0);
    }
  });

  it('has unique section ids', () => {
    const ids = ROADMAP_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique item ids across the whole roadmap', () => {
    const ids = ROADMAP_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only the foundations section is currently marked in progress', () => {
    const inProgressIds = ROADMAP_SECTIONS.filter((s) => s.inProgress).map((s) => s.id);
    expect(inProgressIds).toEqual(['foundations']);
  });

  it('foundations mixes already-shipped (Done) items with still-planned ones', () => {
    const foundations = ROADMAP_SECTIONS.find((s) => s.id === 'foundations')!;
    const statuses = foundations.items.map((i) => i.status);

    expect(statuses).toContain(RoadmapItemStatus.Done);
    expect(statuses).toContain(RoadmapItemStatus.Planned);
  });
});
