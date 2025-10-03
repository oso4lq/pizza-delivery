// icon.component.ts

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ColorKey, COLORS } from '../types';

/**  -----------------------------------
 * Все иконки могут иметь возможность окрашивания.
 * Иконке можно присвоить кастомный цвет "colorHex"
 * или один из системных цветов "color" (primary, secondary и тд).
 * У "colorHex" приоритет над "color".
 * Если не указывать "color" или "colorHex", будет цвет body [#242424].
 ----------------------------------- */

@Component({
  selector: 'app-icon',
  imports: [CommonModule], //, TippyDirective
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if( isIcon() ){
    <!-- Отображение через <svg> с использованием кэша -->
    <svg
      [ngClass]="svgClass()"
      [ngStyle]="svgStyle()"
      [style.color]="$colorHex()"
      [attr.viewBox]="viewBox()"
      [style.cursor]="clickable() ? 'pointer' : 'unset'"
      [attr.width]="$width()"
      [attr.height]="$height()"
      (click)="handleClick()"
      role="img"
      aria-hidden="true"
    >
      <!--использование [tp]="tp()" tpPlacement="right" задваивает подсказки в компоненте -->
      <g [innerHTML]="symbolContent()"></g>
    </svg>
    } @else{
    <!-- Отображение через <img> для прямых ссылок -->
    <img
      [src]="icon()"
      [ngClass]="svgClass()"
      [height]="$width()"
      [width]="$height()"
      [style]="svgStyle()"
      [style.cursor]="clickable() ? 'pointer' : 'unset'"
      (click)="handleClick()"
      alt=""
    />
    <!--использование [tp]="tp()" tpPlacement="right" задваивает подсказки в компоненте -->
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        width: max-content;
      }
      .defaultSvgStyle {
        display: inline-block;
      }
      svg {
        overflow: visible;
      }
      img {
        display: block;
        object-fit: contain;
      }
      .round {
        border-radius: 50%;
      }
      .square {
        border-radius: 8px;
      }
      .square-4 {
        border-radius: 4px;
      }
      .adaptive-icon {
        height: 1em;
        width: auto;
      }
      .extra-margin {
        margin-right: 3px;
      }
    `,
  ],
})
export class IconComponent {

  readonly defaultIconSize: number | string = 16;

  /**  -----------------------------------
   * Пример использования:
   * <app-icon 
   *   [name]="'icon-name'"
   *   [svgClass]="'adaptive-icon'"
   *   [size]="48"
   *   [color]="'primary'"    <-- берётся из COLORS['primary'] => '#242424', позволяет работать с темами
   *   [colorHex]="'#ff8800'" <-- задаётся вручную для иконки, нечувствителен к теме
   *   [tp]="'Подсказка!'"
   *   [clickable]="true"
   *   (iconClick)="onIconClicked()"
   * ></app-icon>
   * 
   * Для прямых ссылок на изображения:
   * <app-icon 
   *   [src]="'assets/imgs/logo.png'"
   *   [size]="68"
   * ></app-icon>
   ----------------------------------- */

  /** -----------------------------------
   * Компонент принимает на вход:
   * обязательно:
   *  @name - тэг, по нему ищется иконка.
   *  @src - прямая ссылка на изображение
   * опционально:
   *  @svgClass - кастомный класс (или будет defaultSvgStyle),
   *  @width и @height - размеры (используются, если size не задан),
   *  @size - размер для квадратных иконок (если задан, переопределяет width и height),
   *  @color - ключ цвета из темы,
   *  @colorHex - ручной ввод цвета,
   *  @clickable - возможность реагировать на клики,
   *  @tp - tooltip (или нет)
   -----------------------------------*/

  // -----------------------------------
  // 1. Сигналы для внутренних состояний
  // -----------------------------------

  // При внедрении app-icon надо контролировать типизацию по IconName
  // Список хранится в ./icon-names-data.ts

  // Входной сигнал для имени иконки (IconName)
  // name = input(undefined, {
  //   transform: (name?: IconName) => {
  //     if (!name) {
  //       this.icon.set(null);
  //       return name;
  //     }
  //     this.isIcon.set(true);

  //     const symbol = this.spriteSrv.getSymbol(name);
  //     if (!symbol) {
  //       console.error('Core', `Invalid icon name: ${name}`);
  //       return;
  //     }
  //     const vb = symbol.getAttribute('viewBox');
  //     this.viewBox.set(vb ? vb : `0 0 ${this.$width()} ${this.$height()}`);
  //     this.symbolContent.set(
  //       this.sanitizer.bypassSecurityTrustHtml(symbol.innerHTML)
  //     );

  //     return name;
  //   },
  // });

  // Входной сигнал для ссылки на иконку или прямого URL
  src = input(undefined, {
    transform: (src?: string) => {
      if (!src) {
        this.icon.set(null);
        return src;
      }

      // Определяем, является ли это прямой ссылкой на файл
      const isDirectUrl =
        src.startsWith('assets/') ||
        src.startsWith('/') ||
        src.startsWith('http');

      if (isDirectUrl) {
        // Это прямая ссылка на изображение
        this.isIcon.set(false);
        this.icon.set(src);
      } else {
        // // Это имя иконки из спрайта
        // this.isIcon.set(true);
        // const symbol = this.spriteSrv.getSymbol(src);
        // if (!symbol) {
        //   console.error('Core', `Invalid icon name: ${src}`);
        //   return;
        // }
        // const vb = symbol.getAttribute('viewBox');
        // this.viewBox.set(vb ? vb : `0 0 ${this.$width()} ${this.$height()}`);
        // this.symbolContent.set(
        //   this.sanitizer.bypassSecurityTrustHtml(symbol.innerHTML)
        // );
      }
      return src;
    },
  });

  // -------------------

  svgClass = input<string>('');
  svgStyle = input<{ [klass: string]: any } | null | undefined>();

  width = input(undefined, {
    transform: (w?: number) => {
      this.$width.set(w ?? this.defaultIconSize);
      return w;
    },
  });
  height = input(undefined, {
    transform: (h?: number) => {
      this.$height.set(h ?? this.defaultIconSize);
      return h;
    },
  });
  size = input(undefined, {
    transform: (s?: number) => {
      this.$height.set(s ?? this.defaultIconSize);
      this.$width.set(s ?? this.defaultIconSize);
      return s;
    },
  });

  // ключ внутри COLORS (текущей темы)
  color = input(undefined, {
    transform: (color?: ColorKey) => {
      this.$colorHex.set(COLORS[color ?? 'blue']);
      return color;
    },
  });

  // прямое указание цвета
  colorHex = input(undefined, {
    transform: (colorHex?: string) => {
      this.$colorHex.set(colorHex ?? 'currentColor');
      return colorHex;
    },
  });

  clickable = input<boolean>(false); // некликабельность
  iconClick = output<void>(); // emitter
  handleClick() {
    if (this.clickable()) this.iconClick.emit();
  }

  // ----------------------------
  // 2. Внутренние сигналы
  // ----------------------------

  icon = signal<string | null>(null); // Сигнал для хранения имени иконки или ссылки
  isIcon = signal(true); // Флаг входного значения, отображение svg или img
  symbolContent = signal<SafeHtml | null>(''); // symbolContent хранит содержимое SVG символа, обработанное через DomSanitizer
  viewBox = signal<string | null>(null); // размер иконки, берётся из спрайта

  $colorHex = signal<string>('currentColor'); // Определение цвета, приоритет у colorHex
  $width = signal(this.defaultIconSize); // width из input или общий size
  $height = signal(this.defaultIconSize); // height из input или общий size
}
