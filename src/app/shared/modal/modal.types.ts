// modal.types.ts

import { Signal } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ButtonType } from '../button/button.component';
// import { IEntityPath } from 'src/app/state/models/shared.model';
// import { IInputCheckboxConfig } from 'src/app/shared/form/inputs/input-checkbox/input-checkbox.component';
// import { ComponentType } from '@angular/cdk/portal';
// import { ButtonType } from 'src/app/shared/_ui/button/button.component';

export type ModalWindowType = 'info' | 'edit' | 'delete';

export type ModalButtonKey = 'save' | 'cancel' | 'delete' | 'close';

export interface ModalButton {
  key: string;
  title: string;
  type: ButtonType;     // Тип кнопки: raised (default) или stroked
  class: string;
  disabled?: boolean;
  handler?: () => void; // Обработчик действия кнопки
  order?: number;       // Порядок отображения кнопки
}

export interface IModalWindowConfig {
  type?: ModalWindowType;
  cssClass?: string;
  height?: string;
  width?: number;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  bgColor?: string;
  padding?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  overrideYScroll?: boolean;
  title?: string;
  note?: string | SafeHtml;
  noteClass?: string;
  isShowCloseBtn?: boolean;
  titleParams?: Record<string, unknown>;
  setButtons?: Partial<Record<ModalButtonKey, Partial<ModalButton> | null>>
  addButtons?: ModalButton[];
  noCloseOnEsc?: boolean;
  noCloseOnClickOutside?: boolean;
  hint?: {
    text: string;
    beforeContent?: boolean;
  };
}

export interface IModalState<C = any> {
  isOpen?: boolean;
  config?: IModalWindowConfig;
  key?: string | number;
  component?: ComponentType<C>;
  data?: any;
  closeHandler?: (result?: any) => void;
}

export type ModalConfig = Signal<IModalWindowConfig> | undefined;