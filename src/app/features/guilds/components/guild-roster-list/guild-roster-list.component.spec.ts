import { TestBed } from '@angular/core/testing';

import { GuildRosterListComponent } from './guild-roster-list.component';

describe('GuildRosterListComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [GuildRosterListComponent] })
      .overrideComponent(GuildRosterListComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(GuildRosterListComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });
});
