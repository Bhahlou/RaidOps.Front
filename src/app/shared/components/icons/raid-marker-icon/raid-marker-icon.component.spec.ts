import { TestBed } from '@angular/core/testing';

import { RaidMarkerIconComponent } from './raid-marker-icon.component';
import { RaidMarkerIcon } from '../../../../features/guilds/raids/models/raid-marker-icon.enum';

describe('RaidMarkerIconComponent', () => {
  const setup = (marker: RaidMarkerIcon, size?: number) => {
    TestBed.configureTestingModule({ imports: [RaidMarkerIconComponent] });
    const fixture = TestBed.createComponent(RaidMarkerIconComponent);
    fixture.componentRef.setInput('marker', marker);
    if (size !== undefined) fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup(RaidMarkerIcon.Skull)).toBeTruthy();
  });

  describe('iconUrl', () => {
    it('resolves the marker icon asset URL', () => {
      expect(setup(RaidMarkerIcon.Star).componentInstance.iconUrl()).toBe('/assets/images/raid-markers/star.png');
    });
  });

  it('renders an img with the resolved src and the given size', () => {
    const fixture = setup(RaidMarkerIcon.Cross, 28);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('/assets/images/raid-markers/cross.png');
    expect(img.style.width).toBe('28px');
    expect(img.style.height).toBe('28px');
  });

  it('defaults to a 24px size', () => {
    const fixture = setup(RaidMarkerIcon.Moon);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.style.width).toBe('24px');
  });
});
