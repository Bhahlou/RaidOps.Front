import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { GuildSettingsComponent } from './guild-settings.component';

describe('GuildSettingsComponent', () => {
  let component: GuildSettingsComponent;
  let fixture: ComponentFixture<GuildSettingsComponent>;

  const setup = (guildId: string | null) => {
    TestBed.configureTestingModule({
      imports: [GuildSettingsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { parent: { snapshot: { paramMap: { get: () => guildId } } } },
        },
      ],
    }).overrideComponent(GuildSettingsComponent, { set: { template: '', imports: [] } });

    fixture   = TestBed.createComponent(GuildSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('extracts the guildId from the parent route', () => {
    setup('guild-42');
    expect(component.guildId).toBe('guild-42');
  });
});
