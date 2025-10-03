// form.component.ts

import { NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  output,
  Renderer2,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { Form } from './form.namespace';
import { ElementStyle } from './input.component';

/**
 * Компонент отрисовывает форму в двух режимах:
 *
 * 1. flex-row + flex-wrap:wrap. По умолчанию (не требует указания в конфиге).
 *    Элементы отображаются последовательно друг за другом. По умолчанию их ширина 100%.
 *    При необходимости в компоненте их вызова можно установить ширину вручную, например через классы w-30, w70.
 *
 * 2. grid. Требует указания в конфиге.
 *    Элементы не требуют настройки ширины вручную. Вместо этого в конфиге FormComponent задаётся свойство gridGroup,
 *    которое определяет ширину и количество столбцов. Примеры:
 *        - gridGroup: [2, 2, 6]      ->      grid-template-columns: "2fr 2fr 6fr";
 *        - gridGroup: [4]            ->      grid-template-columns: "4fr 6fr";
 *        - gridGroup: [1]             ->      grid-template-columns: "1fr".
 */
@Component({
  selector: 'app-form',
  template: `
    <!-- Опционально название формы -->
    @if( title() ; as title ){
    <div class="flex-row center-row">
      <span [ngStyle]="title.style">{{ title.text }}</span>
      @if( title.tag ){
      <span class="tag" [ngClass]="title.tag.class" [ngStyle]="title.tag.style">
        @if( title.tag.icon ){
        <app-icon
          [src]="title.tag.icon"
          [size]="12"
          [color]="title.tag.iconColor"
          tpPlacement="right"
        />
        }
        {{ title.tag.text }}
      </span>
      }
    </div>
    }

    <!-- Контейнер формы с типом отображения flex/grid.
      В случае grid дополнительно задаётся количество и ширина столбцов. -->
    <div [ngClass]="containerClass()" [ngStyle]="containerStyle()">
      <ng-container #inputsForm></ng-container>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;

      span {
        font-size: 14px;
        line-height: 21px;
        color: var(--theme-text-service);
      }

      /* Класс для отображения через flex (по умолчанию) */
      .form-flex {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
      }

      /* Класс для отображения через grid */
      .form-grid {
        display: grid;
        grid-template-columns: columns;
        column-gap: 12px;
        row-gap: 12px;
      }

      app-icon {
        margin: 0 auto 0 4px;
      }

      .tag {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2px 6px;
        font-size: 11px;
        border-radius: 4px;
      }
      .green {
        color: var(--theme-special-green-color);
        background: rgba(27, 186, 105, 0.10);
      }
      .orange {
        color: var(--theme-special-orange-color);
        background: rgba(255, 144, 0, 0.10);
      }
    }

    :host(.flex-with-gap-16) {
      .form-flex {
        gap:16px;
      }
    }
    :host(.flex-with-gap-8) {
      .form-flex {
        gap: 8px;
      }
    }
    :host(.flex-with-row-gap-16) {
      .form-flex {
        row-gap:16px;
      }
    }
    :host(.no-wrap) {
      .form-flex {
        flex-wrap: nowrap !important;
      }
    }

    :host(.direction-column) {
      .form-flex {
        flex-direction: column;
      }
    }
    :host(.flex-1) {
      .form-flex {
        flex: 1;
      }
    }
  `,
  imports: [NgStyle, NgClass, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'hostStyle()',
    '[style.display]': 'hostStyleDisplay()',
    '[class]': 'hostClass()',
  },
})
export class FormComponent implements OnDestroy {
  private readonly injector = inject(Injector);
  private renderer = inject(Renderer2);

  @ViewChild('inputsForm', { read: ViewContainerRef, static: true })
  private readonly container!: ViewContainerRef;

  change = output<{ key: string; newValue: any | null | undefined }>();

  //======================================
  /**
   * Входной сигнал с Form.Config
   * Настройка стиля отображения формы
   */
  public config = input(
    {},
    {
      transform: (config?: Form.Config) => {
        if (!config) return;
        if (config?.class)
          this.hostClass.set(
            Array.isArray(config?.class)
              ? config?.class.join(' ')
              : config?.class
          );
        else this.hostClass.set(null);

        this.hostStyle.set(config?.style ?? null);

        this.title.set(config.title ?? null);

        // Если указан gridGroup, grid-режим
        if (
          config?.gridGroup &&
          Array.isArray(config?.gridGroup) &&
          config?.gridGroup.length
        ) {
          this.containerClass.set('form-grid');
          const count = config?.gridGroup.length;
          const gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
          this.containerStyle.set({
            'grid-template-columns': gridTemplateColumns,
          });
        } else {
          // Режим flex по умолчанию
          this.containerClass.set('form-flex');
          this.containerStyle.set(config?.containerStyle ?? null);
        }

        return config;
      },
    }
  );

  // Сигналы настройки отображения контейнера формы
  hostClass = signal<string | null>(null);
  hostStyle = signal<{ [attribute: string]: any } | null>(null);
  hostStyleDisplay = computed<'none' | null>(() =>
    Object.keys(this.items() ?? {}).length === 0 ? 'none' : null
  );

  containerClass = signal<string>('form-flex');
  containerStyle = signal<{ [attribute: string]: any } | null>(null);

  title = signal<Form.Config['title'] | null>(null);

  //======================================

  /**
   * Входной сигнал с Form.Items
   * Построение динамических компонентов формы.
   */
  public items = input(
    {},
    {
      transform: (items?: Form.Items) => {
        this.clearFormInputs();
        let inputs: Record<string, Form.Input> = {};
        this.components = {};

        let group: Record<string, any> | undefined = {};
        let groupStyle: Record<string, ElementStyle> | undefined = {};
        let groupDiv: any = undefined;
        let parent = this.container.element.nativeElement.parentElement;

        // Рендеринг
        for (const [key, itemConfigOpt] of Object.entries(items ?? {})) {
          const itemConfig = itemConfigOpt as Form.ItemConfig;

          // Готовим div блок для группы, если она существует
          let title = itemConfig.config.group;
          let style = itemConfig.config.groupStyle;
          if (title) {
            let divId = 'form-group-' + title;
            if (group[title]) groupDiv = group[title];
            else {
              let element = document.getElementById(divId);
              // Чтобы при перерисовке компонентов не было пустых div блоков с предыдущего рендеринга ищем
              // ранее созданный div блок
              if (element) groupDiv = element;
              else groupDiv = this.renderer.createElement('div');
              // this.renderer.addClass( groupDiv, divId ) // Уходим от CSS классов к style, т.к. при добавлении
              // элементов через Renderer2 к CSS классам не
              // применяется ViewEncapsulation.Emulated
              this.renderer.setAttribute(groupDiv, 'id', divId);
              this.renderer.appendChild(parent, groupDiv);
              group[title] = groupDiv;
            }
            // Суммируем персональные стили одной группы
            if (style) groupStyle[title] = { ...groupStyle[title], ...style };
          } else groupDiv = parent;

          // Создаём InputComponent
          const compRef = this.container.createComponent(itemConfig.type, {
            injector: this.injector,
          });
          // Сохраняем подписку для последующей отписки
          this.subscriptions[key] = compRef.instance.change.subscribe(
            (event) => {
              // event.stopPropagation()
              // event.preventDefault()
              this.onChange(key, event);
            }
          );

          // Вставляем созданный InputComponent в группу
          this.renderer.appendChild(groupDiv, compRef.location.nativeElement);

          if (!itemConfig.config.id) itemConfig.config.id = key;
          compRef.setInput('config', itemConfig.config);
          this.components[key] = compRef;
          inputs[key] = compRef.instance as any;
        }

        // Применяем персональные стили одной группы
        for (let groupEntry of Object.entries(group)) {
          let styleEntry = groupStyle[groupEntry[0]];
          if (!styleEntry) continue;

          let stylesEntries = Object.entries(styleEntry);
          for (let style of stylesEntries) {
            this.renderer.setStyle(groupEntry[1], style[0], style[1]);
          }
        }

        // Устанавливаем созданные поля ввода
        this.inputs.set(inputs);
        group = undefined;
        groupStyle = undefined;
        return items;
      },
    }
  );

  public inputs = model<Record<string, Form.Input>>();
  private components: Record<string, any> = {};
  private subscriptions: Record<string, any> = {};

  private clearFormInputs() {
    // Отписываемся от всех подписок
    for (const subscription of Object.values(this.subscriptions)) {
      if (subscription && typeof subscription.unsubscribe === 'function')
        subscription.unsubscribe();
    }
    this.subscriptions = {};

    for (const component of Object.values(this.components)) {
      component.destroy();
    }
    this.inputs.set(undefined);
    this.container.clear();
  }

  ngOnDestroy(): void {
    this.clearFormInputs();
  }

  onChange(key: string, newValue: any): void {
    this.change.emit({
      key,
      newValue: newValue.newValue ? newValue.newValue : newValue,
    });
  }
}
