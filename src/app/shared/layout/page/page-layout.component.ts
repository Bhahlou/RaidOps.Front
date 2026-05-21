import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { LoadingBarComponent } from '../../components/loading-bar/loading-bar.component';

@Component({
  selector: 'app-page-layout',
  imports: [RouterOutlet, HeaderComponent, LoadingBarComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
})
export class PageLayoutComponent {}
