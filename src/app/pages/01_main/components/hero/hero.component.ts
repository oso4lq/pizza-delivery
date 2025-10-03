// hero.component.ts

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ButtonComponent } from '../../../../shared/button/button.component';

interface HeroFeature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-hero',
  imports: [IconComponent, ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly features: HeroFeature[] = [
    {
      icon: 'assets/imgs/ic_hop.png',
      title: 'ЛУЧШЕЕ ТЕСТО',
      description:
        'Мы создаем тесто только из отборной итальянской муки наивысшего качества',
    },
    {
      icon: 'assets/imgs/ic_chefs.png',
      title: 'ЛУЧШИЕ ПОВАРА',
      description: 'Пиццы готовят самые профессиональные итальянские повара',
    },
    {
      icon: 'assets/imgs/ic_quality.png',
      title: 'ГАРАНТИЯ КАЧЕСТВА',
      description:
        'Наша пиццерия получила множество наград и признаний по всему миру',
    },
    {
      icon: 'assets/imgs/ic_recipes.png',
      title: 'ОТБОРНЫЕ РЕЦЕПТЫ',
      description:
        'Мы используем рецепты от мировых лидеров в изготовлении пиццы',
    },
  ];

  protected scrollToProducts(): void {
    const productsSection = document.querySelector('.main-page__products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
