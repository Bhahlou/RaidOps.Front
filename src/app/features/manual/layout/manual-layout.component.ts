import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ManualSidebarComponent } from '../components/manual-sidebar/manual-sidebar.component';

@Component({
  selector: 'app-manual-layout',
  imports: [RouterOutlet, ManualSidebarComponent],
  templateUrl: './manual-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './manual-layout.component.scss',
})
export class ManualLayoutComponent {}
