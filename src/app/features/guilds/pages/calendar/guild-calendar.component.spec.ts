import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildCalendarComponent } from './guild-calendar.component';

describe('GuildCalendarComponent', () => {
  let component: GuildCalendarComponent;
  let fixture: ComponentFixture<GuildCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildCalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuildCalendarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
