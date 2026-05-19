import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscordIconComponent } from './discord-icon.component';

describe('DiscordIconComponent', () => {
  let component: DiscordIconComponent;
  let fixture: ComponentFixture<DiscordIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscordIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscordIconComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
