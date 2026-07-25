import { TestBed } from '@angular/core/testing';

import { TabDefinition, TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  const tabs: TabDefinition[] = [
    { id: 'general', labelKey: 'guildSettings.tabs.general' },
    { id: 'notifications', labelKey: 'guildSettings.tabs.notifications' },
  ];

  const setup = (activeTabId: string) => {
    TestBed.configureTestingModule({ imports: [TabsComponent] })
      .overrideComponent(TabsComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(TabsComponent);
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeTabId', activeTabId);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup('general')).toBeTruthy();
  });

  it('exposes the tabs input', () => {
    expect(setup('general').tabs()).toEqual(tabs);
  });

  it('exposes the activeTabId input', () => {
    expect(setup('general').activeTabId()).toBe('general');
  });

  describe('select', () => {
    it('emits tabChange when selecting a different tab', () => {
      const component = setup('general');
      const spy = vi.spyOn(component.tabChange, 'emit');

      component.select('notifications');

      expect(spy).toHaveBeenCalledWith('notifications');
    });

    it('does not emit tabChange when selecting the already-active tab', () => {
      const component = setup('general');
      const spy = vi.spyOn(component.tabChange, 'emit');

      component.select('general');

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
