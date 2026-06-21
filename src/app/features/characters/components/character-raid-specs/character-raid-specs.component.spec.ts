import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CharacterRaidSpecsComponent } from './character-raid-specs.component';
import { CharacterSpec } from '../../models/character-spec.model';

const makeSpec = (overrides: Partial<CharacterSpec> = {}): CharacterSpec => ({
  specId: 71,
  name: 'Arms',
  iconUrl: 'https://cdn/arms.jpg',
  isMain: false,
  ...overrides,
});

const setup = (specs: CharacterSpec[]) => {
  TestBed.configureTestingModule({
    imports: [
      CharacterRaidSpecsComponent,
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
        translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
      }),
    ],
  });
  const fixture = TestBed.createComponent(CharacterRaidSpecsComponent);
  fixture.componentRef.setInput('specs', specs);
  fixture.detectChanges();
  return fixture;
};

describe('CharacterRaidSpecsComponent', () => {
  it('renders nothing when there are no specs', () => {
    const fixture = setup([]);
    expect(fixture.debugElement.query(By.css('.char-specs'))).toBeNull();
  });

  it('renders one badge per spec', () => {
    const fixture = setup([makeSpec({ specId: 71 }), makeSpec({ specId: 72, isMain: true })]);
    expect(fixture.debugElement.queryAll(By.css('.spec')).length).toBe(2);
  });

  it('marks the main spec with the spec--main class', () => {
    const fixture = setup([makeSpec({ specId: 72, isMain: true })]);
    const spec = fixture.debugElement.query(By.css('.spec'));
    expect(spec.nativeElement.classList.contains('spec--main')).toBe(true);
  });

  it('renders an icon image when iconUrl is set', () => {
    const fixture = setup([makeSpec({ iconUrl: 'https://cdn/arms.jpg' })]);
    const img = fixture.debugElement.query(By.css('.spec-icon'));
    expect(img.nativeElement.getAttribute('src')).toBe('https://cdn/arms.jpg');
  });

  it('falls back to a text label when iconUrl is null', () => {
    const fixture = setup([makeSpec({ iconUrl: null })]);
    expect(fixture.debugElement.query(By.css('.spec-icon'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.spec-name'))).not.toBeNull();
  });
});
