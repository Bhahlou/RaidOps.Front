import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildRosterComponent } from './guild-roster.component';

describe('GuildRosterComponent', () => {
  let component: GuildRosterComponent;
  let fixture: ComponentFixture<GuildRosterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildRosterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuildRosterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
