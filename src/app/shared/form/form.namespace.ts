import { ComponentType } from '@angular/cdk/portal';
import {
  ComponentRef,
  computed,
  ModelSignal,
  Signal,
  untracked,
} from '@angular/core';
import { IconName } from '../icon/icon-names-data';
import { ColorKey, SignalValue } from '../types';
import { Utill } from '../utils';
import { InputComponent } from './input.component';

export namespace Form {
  export type ExtractConfig<I extends InputComponent> = I['config'];
  export type ConfigType<T> = Partial<Record<keyof T, ItemConfig>>;

  export type Input<I extends InputComponent = InputComponent> =
    ComponentRef<I>['instance'];
  export type InputFrom<I extends InputComponent = InputComponent> =
    SignalValue<I['config']>;
  type InputsModel<I> = ModelSignal<Record<keyof I, Input> | undefined>;
  export type Inputs<I> = InputsModel<SignalValue<I>>;
  // type ValuesFromInputs<T extends Record<string, Form.Input>> = {
  //   [K in keyof T]: SignalValue<T[K]['value']>
  // }

  /**
   * Интерфейс для настройки отображения формы.
   */
  export interface Config {
    class?: string | string[];
    style?: { [attribute: string]: any } | null;
    containerStyle?: { [attribute: string]: any } | null;

    title?: {
      text: string;
      style?: { [attribute: string]: any } | null;
      tag?: {
        text: string;
        icon?: IconName;
        iconColor?: ColorKey;
        style?: { [attribute: string]: any } | null;
        class?: string;
        tp?: string;
      };
    };

    gridGroup?: number[]; // Если задан, отображает компонент формы как grid с заданными параметрами
  }

  // Конфигурация элементов формы (Items) по которым будет строится Inputs
  export type Items<K extends string = string> = { [P in K]: ItemConfig };

  export interface ItemConfig<I extends InputComponent = InputComponent> {
    type: ComponentType<I>;
    config: SignalValue<I['config']>;
  }

  export function isValid<I>(itemsSignal: InputsModel<I>): Signal<boolean> {
    return computed(() => {
      const items: Record<string, Input> = itemsSignal() || {};
      for (const [key, input] of Object.entries(items)) {
        const value = input.value();
        if (untracked(() => input.validate(value, false)) === false)
          return false;
      }
      return true;
    });
  }

  export function validate<I>(
    itemsSignal: InputsModel<I>
  ): Record<keyof I, string> | null {
    const items: Record<string, Input> = itemsSignal() || {};
    let errors: Partial<Record<keyof I, string>> = {};
    for (const [key, input] of Object.entries(items)) {
      input.validate(input.value());
      const error = input.validateError();
      if (!error) continue;
      errors[key as keyof I] = error;
    }
    return Object.keys(errors).length === 0
      ? null
      : (errors as Record<keyof I, string>);
  }

  export function resetValues<I>(
    itemsSignal: InputsModel<I>,
    exceptKeys?: (keyof I)[]
  ): void {
    const items = itemsSignal();
    for (const key in items) {
      if (exceptKeys?.includes(key)) continue;
      items[key].value.set(undefined);
    }
  }

  export function getValues<I>(
    itemsSignal: InputsModel<I>
  ): Signal<Record<keyof I, SignalValue<Input['value']>>> {
    return computed(() => {
      const items: Record<string, Input> = itemsSignal() || {};
      let result: Partial<Record<keyof I, SignalValue<Input['value']>>> = {};
      for (let [key, input] of Object.entries(items)) {
        result[key as keyof I] = input.value();
      }
      return result as Record<keyof I, SignalValue<Input['value']>>;
    });
  }

  export function getChangedValues<I>(
    itemsSignal: InputsModel<I>
  ): Signal<Record<keyof I, SignalValue<Input['value']>> | null> {
    return computed(() => {
      const items: Record<string, Input> = itemsSignal() || {};
      let result: Partial<Record<keyof I, SignalValue<Input['value']>>> = {};
      for (let [key, input] of Object.entries(items)) {
        const config = input.$config;
        const value = input.value();
        if (Utill.isEqual(config?.value, value)) continue;
        result[key as keyof I] = input.value();
      }
      return Object.keys(result).length > 0
        ? (result as Record<keyof I, SignalValue<Input['value']>>)
        : null;
    });
  }
}
