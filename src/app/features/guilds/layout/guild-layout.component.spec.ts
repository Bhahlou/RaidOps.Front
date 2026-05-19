import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuildLayoutComponent } from './guild-layout.component';

describe('GuildLayoutComponent', () => {
  let component: GuildLayoutComponent;
  let fixture: ComponentFixture<GuildLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuildLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
