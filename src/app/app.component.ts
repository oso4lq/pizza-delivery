// app.component.ts

import { Component, signal } from '@angular/core';
import { LayoutComponent } from './layout/layout.component';
import { HeaderComponent } from './layout/components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    LayoutComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly title = signal('pizza-delivery');
}
