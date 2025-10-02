// header.component.ts

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PageRoute } from '../../../app.routes';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly PageRoute = PageRoute;

  navLinks = [
    { path: PageRoute.Main, label: 'Пиццы' },
    { path: PageRoute.Drinks, label: 'Напитки' },
    { path: PageRoute.Delivery, label: 'Доставка и оплата' },
    { path: PageRoute.Contacts, label: 'Контакты' },
  ];
}
