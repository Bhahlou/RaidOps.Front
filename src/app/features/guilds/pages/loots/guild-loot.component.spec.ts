import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildLootComponent } from './guild-loot.component';

describe('GuildLootComponent', () => {
  let component: GuildLootComponent;
  let fixture: ComponentFixture<GuildLootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildLootComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuildLootComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
