// header.component.ts

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PageRoute } from '../../../app.routes';
import { IconComponent } from '../../../shared/icon/icon.component';

interface NavLink {
  path: PageRoute;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly PageRoute = PageRoute;

  protected readonly navLinks: NavLink[] = [
    { path: PageRoute.Main, label: 'Пиццы' },
    { path: PageRoute.Drinks, label: 'Напитки' },
    { path: PageRoute.Delivery, label: 'Доставка и оплата' },
    { path: PageRoute.Contacts, label: 'Контакты' },
  ];
}
