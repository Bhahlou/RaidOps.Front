import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildSettingsComponent } from './guild-settings.component';

describe('GuildSettingsComponent', () => {
  let component: GuildSettingsComponent;
  let fixture: ComponentFixture<GuildSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuildSettingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
