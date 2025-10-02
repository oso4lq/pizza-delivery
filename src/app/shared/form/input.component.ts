// input.component.ts

import { ComponentType } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  model,
  ModelSignal,
  output,
  Renderer2,
  Signal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SignalValue } from '../types';
import { Exception, Utill } from '../utils';
import { Form } from './form.namespace';
import { InputsLabelConfig } from './wrapper/label.component';

// Тип value
type ValueType = any;

export interface IValidateRule<V> {
  /** Do not throw error for null value when allowNull===true */
  allowNull?: boolean;

  /** Max value for numbers, and length for strings and arrays */
  min?: number;

  /** Min value for numbers, and length for strings and arrays */
  max?: number;

  /** Mask for string values */
  mask?: RegExp;

  /**
   * Synchronize validation handler function, must throw error with correct message if it falls
   * throw new Exception( 'Validation', 'error message')
   * @param value - current value
   * @returns void
   */
  handler?: (value?: V) => void;

  /**
   * Async validation handler function, must throw error with correct message if it falls
   * throw new Exception( 'Validation', 'error message')
   * @param value - current value
   * @returns void
   */
  asyncHandler?: (
    value?: V,
    error?: InputComponent['validateError']
  ) => Promise<void>;

  /* Messages by error type (mask, min, max, ...)*/
  errorMsg?: Partial<Record<keyof IValidateRule<V>, string>>;

  /** Принудительное задание типа поля, для переопределения работы автоматического детектирования типа. */
  type?: 'string' | 'number' | 'boolean';
}

export type ElementStyle = { [attribute: string]: any };
export interface InputConfig<V extends ValueType = ValueType> {
  id?: string | number;

  cssStyles?: Record<string, string>; //wrapperStyles
  cssClass?: string;
  wrapperClass?: string | null;
  inputClass?: string;
  inputStyles?: Record<string, string>;

  label?: string | InputsLabelConfig;
  placeholder?: string | ModelSignal<string> | null;

  showInfoIcon?: boolean; // true - тултип не на поле, а на иконку в обёртке

  noTranslate?: boolean; // true - Label, tooltip и placeholder не будут переводиться

  readonly?: boolean;
  disabled?: boolean; // true - поле формы отключено
  autofocus?: boolean;

  validate?: IValidateRule<V>;
  hideErrorMessage?: boolean; //  true - в wrapper не рендерить <p class="error-message">

  value?: V | ModelSignal<V | undefined> | undefined;

  /**
   * Наименование группы для группирования input полей с одним наименованием группы под одним div блоком.
   * div блоку присваивается id="form-group-НАИМЕНОВАНИЕ_ГРУППЫ", для динамического доступа к div блоку и
   * манипуляций над ним.
   */
  group?: string;
  /**
   * Персональные стили группы. Стили могут быть заданы либо сразу в каком-то одном InputComponent, либо
   * в каждом из InputComponent. К div блоку будет применён суммарный стиль из всех groupStyle одной группы. Пример:
   * - Все стили группы в одном InputComponent:
    ```TypeScript
    InputTextComponent.from( { ..., group: 'user-name', groupStyle: { [ 'display' ]: 'flex', [ 'flex-direction' ]: 'column', [ 'width' ]: '100%' } } )
    InputTextComponent.from( { ..., group: 'user-name' } )
    InputTextComponent.from( { ..., group: 'user-name' } )
    ```
   * - Стили группы "разбросаны" по нескольким InputComponent:
    ```TypeScript
    InputTextComponent.from( { ..., group: 'user-name', groupStyle: { [ 'display' ]: 'flex' } )
    InputTextComponent.from( { ..., group: 'user-name', groupStyle: { [ 'flex-direction' ]: 'column' } )
    InputTextComponent.from( { ..., group: 'user-name', groupStyle: { [ 'width' ]: '100%' } } )
    ```
   * html на выходе будет один для обоих вариантов:
    ```html
    <div id="form-group-user-name" style="display: flex; width: 100%; flex-direction: column; justify-content: flex-start;">
      <app-input-text>...</app-input-text>
      <app-input-text>...</app-input-text>
      <app-input-text>...</app-input-text>
    </div>
    ```
   *
   */
  groupStyle?: ElementStyle | null;
}

export type ExtractValue<T> = T extends InputConfig<infer V> ? V : never;

@Component({
  selector: 'app-input-abstract',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  styles: ``,
})
export abstract class InputComponent<C extends InputConfig = InputConfig>
  implements AfterViewInit
{
  protected renderer = inject(Renderer2);
  protected ref = inject(ElementRef);

  static from<I extends InputComponent>(
    this: ComponentType<I>,
    config?: Form.InputFrom<I>
  ): Form.ItemConfig<I> {
    return {
      type: this,
      config: config || ({} as SignalValue<I['config']>),
    };
  }

  // флаг для отвечающий за добавление класса 'input-shared-wrapper'
  protected enableDefaultWrapperClass: Signal<boolean | undefined> =
    signal(true);

  // ----------------------------------
  constructor() {
    const initialClasses = this.ref.nativeElement.className;
    effect(() => {
      const classString = `
        ${initialClasses}
        ${
          this.enableDefaultWrapperClass() &&
          this.config().wrapperClass !== null
            ? `input-shared-wrapper`
            : ''
        }
        ${this.config().wrapperClass ?? ''}
      `;
      this.renderer.setAttribute(
        this.ref.nativeElement,
        'class',
        classString.trim()
      );
    });
  }

  // ----------------------------------

  config = model({} as C);
  $config?: C;
  private $configEffect = effect(() => {
    const newConfig = this.config();
    if (Utill.isObjectsEqual(newConfig, this.$config)) return;
    this.$config = newConfig;
    untracked(() => {
      this.configSetup(newConfig);
    });
  });

  firstTimeConfigSetup = true;
  configSetup(config: C): C {
    if (!config) return config;

    // Обработка изменения/установки value в конфиге - model
    if (typeof config.value === 'function' && this.value() === undefined)
      this.value = config.value;

    // Обработка изменения/установки value в конфиге - значение
    if (
      config.value !== undefined &&
      typeof config.value !== 'function' &&
      (this.value() === undefined || this.value() === false)
    ) {
      untracked(() => {
        this.value.set(config.value);
      });
    }

    if (typeof config.placeholder === 'function') {
      this.placeholder = config.placeholder;
    } else if (config.placeholder) {
      this.placeholder.set(config.placeholder);
    }

    this.firstTimeConfigSetup = false;
    return config;
  }

  // ----------------------------------
  // Методы работы с сигналом value

  value = model<ExtractValue<C | null>>();
  // $value: C['value'] = null
  // private $valueEffect = effect(() => {
  //   const value = this.value()
  //   this.$value = value
  // })

  // ----------------------------------
  // Методы работы

  change = output<any>();

  // ----------------------------------
  // Computed inner signals

  id = computed(() => String(this.config()?.id || Utill.uuid()));

  isFocused = model(false);
  validateError = model<string | null>(null);

  inputClasses = model<string[]>([]);
  private inputClassesEffect = effect(() => {
    const config = this.config();
    let inputClasses = ['input-shared'];

    if (config.cssClass) inputClasses.push(config.cssClass!);
    if (config.readonly) inputClasses.push('readonly');
    if (config.disabled) inputClasses.push('disabled');
    if (this.validateError()) inputClasses.push('invalid');
    if (this.isFocused()) inputClasses.push('focused');

    this.inputClasses.set(inputClasses);
  });

  placeholder = model<string>('');

  // ----------------------------------
  // HTMLInputElement wrap
  _inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  inputElement = computed(() => this._inputElement()?.nativeElement);

  ngAfterViewInit(): void {
    const config = this.config();
    if (!config) return;
    // Обработка авто фокуса
    if (config.autofocus && this.firstTimeConfigSetup) {
      setTimeout(() => {
        this.inputElement()?.focus();
      }, 400);
    }
  }

  //---------------------------------
  // Validate

  validate(value: any | undefined, setValidateError: boolean = true): boolean {
    const rule = this.config()?.validate ?? {};

    if (
      rule?.allowNull &&
      (value === undefined || value === null || value === '')
    )
      return true;

    try {
      let isNumber = rule?.type ? rule.type === 'number' : !isNaN(value);

      if (
        !rule?.allowNull &&
        (value === null || value === undefined || value === '')
      ) {
        throw new Exception('Validation', 'allowNull');
      }

      if (rule.min) {
        if ((!isNumber || Array.isArray(value)) && value.length < rule.min)
          throw new Exception('Validation', 'min');
        if (isNumber && value < rule.min)
          throw new Exception('Validation', 'min');
      }

      if (rule.max) {
        if ((!isNumber || Array.isArray(value)) && value.length > rule.max)
          throw new Exception('Validation', 'max');
        if (isNumber && value > rule.max)
          throw new Exception('Validation', 'max');
      }

      if (rule.mask && rule.mask.test(value) === false)
        throw new Exception('Validation', 'mask');

      if (rule.handler) rule.handler(value);
      if (rule.asyncHandler) rule.asyncHandler(value, this.validateError);

      this.validateError.set(null);
      return true;
    } catch (e) {
      if (e instanceof Exception === false) {
        // Неустановленная ошибка (в handler скорее всего)
        if ((e as Exception).type !== 'Validation') console.error(e); // Убираем лишний "мусор" из консоли и выводим только неизвестные ошибки
        this.validateError.set('Неустановленная ошибка');
        return false;
      }

      let errorMessage = 'ошибка';
      const err = e as Exception;

      switch (err.message) {
        case 'allowNull':
          errorMessage = rule.errorMsg?.allowNull ?? 'Необходимое поле';
          break;
        case 'min':
          errorMessage = rule.errorMsg?.min ?? `Минимум ${rule?.min}`;
          break;
        case 'max':
          errorMessage = rule.errorMsg?.max ?? `Максимум ${rule?.max}`;
          break;
        case 'mask':
          errorMessage = rule.errorMsg?.mask ?? `Неверный формат ${rule?.mask}`;
          break;
        default:
          errorMessage = err.message;
      }

      console.warn(
        `[${this.id()}]Validation error: ${errorMessage}`,
        value,
        rule
      );

      if (setValidateError) this.validateError.set(errorMessage);

      return false;
    }
  }
}
