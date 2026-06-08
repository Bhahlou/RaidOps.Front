import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoGuildComponent } from './no-guild.component';

describe('NoGuildComponent', () => {
  let component: NoGuildComponent;
  let fixture: ComponentFixture<NoGuildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoGuildComponent],
    })
    // Strip template and child imports to avoid resolving TranslocoPipe's TRANSLOCO_CONFIG
    // dependency and IconCardComponent's own imports in the test environment
    .overrideComponent(NoGuildComponent, { set: { template: '', imports: [] } })
    .compileComponents();

    fixture = TestBed.createComponent(NoGuildComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
