// modal.component.ts

import { ComponentType } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InputSignal,
  model,
  ModelSignal,
  Signal,
  TemplateRef,
} from '@angular/core';
import { AppController } from '../../app.controller';
import { LayoutService } from '../../services/layout.service';
import { SignalValue } from '../types';
import { IModalState, ModalConfig } from './modal.types';
import { Form } from '../form/form.namespace';

@Component({
  selector: 'app-modal-component-new',
  template: '',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class ModalComponent {
  // protected appState                  = inject( AppState )
  protected appCtrl = inject(AppController);

  // protected langService               = inject( LanguageService )
  protected layoutService = inject(LayoutService);

  protected isMobile = this.layoutService.isMobile;

  /** Ссылка на шаблон с группой полей формы. */
  public formRef!: Signal<TemplateRef<any>>;
  /** Ссылка на шаблон с футером. */
  public footerRef!: Signal<TemplateRef<any>>;

  /**
   * Открытие модального окна с компонентом
   * @param data - Входящие данные для компонента, будут установлены в сигнал data (модель)
   * В дочерних компонентах необходимо переопределить свойство дата - через которое происходит
   * установка данных при создании компонента в модальном окне
   */
  static show<T extends ModalComponent>(
    this: ComponentType<T>,
    data: SignalValue<T['inputData']>,
    closeHandler?: IModalState<any>['closeHandler']
  ) {
    AppController.shared.$modalOpen({
      component: this,
      data,
      key: Date.now(),
      closeHandler,
    });
  }

  // ---------------------------------------------------
  // Данные и методы для переопределения в потомках

  // Входящие данные для работы компонента в модальном окне
  // ДОЛЖНЫ быть переопределены с соответствующим типом
  abstract inputData: InputSignal<any>;

  // Конфиг для модального окна
  // может быть переопределен в потомках, для конфигурации окна и его поведения
  abstract modal: ModalConfig;

  // Состояния переключателей в футере
  footerCheck!: ModelSignal<boolean>;
  footerSwitch!: ModelSignal<boolean>;

  // Действие по главной кнопке - должно переопределяться если она есть
  async primaryAction(): Promise<void> {
    console.error('primaryAction() must be override if it used!');
    return;
  }

  // Действие по дополнительным кнопкам - должно переопределяться если она есть
  async buttonAction(key: string): Promise<void> {
    console.error(
      'buttonAction( key: string ) must be override if it used!',
      key
    );
    return;
  }

  //Формы
  public formConfig?: Signal<Form.Config | undefined>;
  public formItems?: Signal<Form.Items | undefined>;
  public formInputs: Form.Inputs<this['formItems']> = model();
  public formIsValid = Form.isValid(this.formInputs);
  public formValues = Form.getValues(this.formInputs);

  // ---------------------------------------------------
  // Общие данные
  // Ключ модалки в объекте состояний модальных окон
  modalKey: number = 0;

  actionInProcess = model(false);

  // ---------------------------------------------------

  /**
   * Закрытие модального окна
   */
  close!: (result?: any) => Promise<void>;
}
