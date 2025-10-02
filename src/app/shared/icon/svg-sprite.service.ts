// frontend/src/app/shared/_ui/icon/svg-sprite.service.ts

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class SvgSpriteService {
  private spriteUrl = 'assets/icons/_generated-sprite.svg';
  private symbolCache = new Map<string, SVGSymbolElement>();
  constructor(@Inject(DOCUMENT) private document: Document) {}

  async loadSprite(): Promise<void> {
    try {
      // Загружаем спрайт
      const resp = await axios.get(this.spriteUrl, { responseType: 'text' });
      const sprite = resp.data;
      // if (!sprite) throw new Exception('Core', 'Error load svg sprite!', { url: this.spriteUrl });
      if (!sprite) {
        console.error('Error load svg sprite!', { url: this.spriteUrl });
        return;
      }
      // Вставляем его в DOM как скрытый элемент
      const div = this.document.createElement('div');
      div.style.display = 'none';
      div.innerHTML = sprite;
      this.document.body.insertBefore(div, this.document.body.firstChild);
      // Находим в спрайте иконку drop-down и превращаем symbol в svg, т.к. SCSS не распознаёт symbol
      const iconDropDown = this.getSymbol('drop-down');
      // if (!iconDropDown) throw new Exception('Core', 'Icon drop-down not found!');
      if (!iconDropDown) {
        console.error('Error load svg sprite!', { url: this.spriteUrl });
        return;
      }
      const viewBox = iconDropDown.getAttribute('viewBox') || '0 0 17 17';
      // Формируем полноценный SVG, оборачивая содержимое символа
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${iconDropDown.innerHTML}</svg>`;
      const encodedSvg = encodeURIComponent(svgString)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');
      const dataUrl = `url("data:image/svg+xml,${encodedSvg}")`;
      // Для body устанавливаем глобальную переменную, которую возьмёт SCSS.
      // Глубже (например в app-root) нельзя, т.к. dropdown с позиционированием 'body' не будут иметь иконку.
      this.document.body.style.setProperty('--icon-drop-down', dataUrl);
    } catch (error) {
      console.error('Failed to load SVG sprite:', error);
    }
  }

  /**
   * Возвращает символ по имени из спрайта, используя кэш.
   * Если символ уже найден ранее, он возвращается из symbolCache.
   */
  getSymbol(name: string): SVGSymbolElement | null {
    // Проверка наличия иконки в кэше
    if (this.symbolCache.has(name)) {
      return this.symbolCache.get(name)!;
    }
    // Поиск иконки в DOM и запись в кэш
    const symbolElement = this.document.getElementById(name);
    if (symbolElement && symbolElement.tagName.toLowerCase() === 'symbol') {
      const symbol = symbolElement as unknown as SVGSymbolElement;
      this.symbolCache.set(name, symbol);
      return symbol;
    }
    return null;
  }
}
