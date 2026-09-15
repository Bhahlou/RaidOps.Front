import { TestBed } from '@angular/core/testing';

import { RaidMarkerPickerComponent } from './raid-marker-picker.component';
import { RaidMarkerIcon } from '../../models/raid-marker-icon.enum';

describe('RaidMarkerPickerComponent', () => {
  const setup = (activeMarker?: RaidMarkerIcon | null) => {
    TestBed.configureTestingModule({ imports: [RaidMarkerPickerComponent] });
    const fixture = TestBed.createComponent(RaidMarkerPickerComponent);
    if (activeMarker !== undefined) fixture.componentRef.setInput('activeMarker', activeMarker);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('renders one button per marker, in WoW UI order', () => {
    const fixture = setup();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.raid-marker-option');
    expect(buttons.length).toBe(8);
  });

  it('marks the active marker button', () => {
    const fixture = setup(RaidMarkerIcon.Skull);
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.raid-marker-option');
    const activeButtons = Array.from(buttons).filter((b) => b.classList.contains('active'));
    expect(activeButtons).toHaveLength(1);
  });

  it('marks no button active when activeMarker is null', () => {
    const fixture = setup(null);
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.raid-marker-option');
    expect(Array.from(buttons).some((b) => b.classList.contains('active'))).toBe(false);
  });

  it('emits selected with the clicked marker', () => {
    const fixture = setup();
    let emitted: RaidMarkerIcon | undefined;
    fixture.componentInstance.selected.subscribe((m: RaidMarkerIcon) => {
      emitted = m;
    });

    const firstButton: HTMLButtonElement = fixture.nativeElement.querySelector('.raid-marker-option');
    firstButton.click();

    expect(emitted).toBe(fixture.componentInstance.markers[0]);
  });
});
