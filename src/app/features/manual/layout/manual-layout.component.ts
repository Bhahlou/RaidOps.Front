import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ManualSidebarComponent } from '../components/manual-sidebar/manual-sidebar.component';

@Component({
  selector: 'app-manual-layout',
  imports: [RouterOutlet, ManualSidebarComponent],
  templateUrl: './manual-layout.component.html',
  styleUrl: './manual-layout.component.scss',
})
export class ManualLayoutComponent {}
