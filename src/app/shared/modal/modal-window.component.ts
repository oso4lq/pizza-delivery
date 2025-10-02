// modal-window.component.ts

import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  ModelSignal,
  OnDestroy,
  signal,
  Signal,
  TemplateRef,
  untracked,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { AppController } from '../../app.controller';
import { LayoutService } from '../../services/layout.service';
import { ButtonComponent } from '../button/button.component';
import { Form } from '../form/form.namespace';
import { IconComponent } from '../icon/icon.component';
import { Util } from '../utils';
import { ModalComponent } from './modal.component';
import {
  IModalState,
  IModalWindowConfig,
  ModalButton,
  ModalButtonKey,
  ModalWindowType,
} from './modal.types';

/**
 Требования:
 - Можно передать любой компонент как содержимое модального окна
 - Типизация входных данных при вызове модального окна, которые будут различаться от компонента к компоненту
 - Управление окном изнутри презентованного компонента (заголовки, стили, закрытие)
 - Параметры модального окна:
    - Заголовок
    - Размер (по контенту или ограниченный максимально значениями)
    - Положение на экране: цент, лево, право ?
    - Параметры автоматического закрытия
    - Панель управления
 - Шаблоны окна по типам (вид, кнопки по умолчанию): Info/Edit/Remove
 - Панель управления
    - Кнопки разных типов (по виду + стиль типа окна)
    - Действия по не стандартным кнопкам - обработчики в компоненте
    - Правое нижнее поле - настраиваемое:
        - чекбокс/переключатель ?
        - что еще?
 */

//-----------------------------------------------
// Все типы теперь импортируются из modal.types.ts

const MODAL_WINDOW_BUTTONS: Record<
  'cancel' | 'delete' | 'save',
  Omit<ModalButton, 'key'>
> = {
  cancel: {
    class: 'secondary',
    title: 'buttons.cancel',
    type: 'stroked',
    order: 20,
  },
  delete: {
    class: 'delete',
    title: 'buttons.delete',
    type: 'raised',
    order: 30,
  },
  save: { class: 'primary', title: 'buttons.save', type: 'raised', order: 30 },
};

@Component({
  selector: 'app-modal-window',
  templateUrl: './modal-window.component.html',
  styleUrl: './modal-window.component.scss',
  imports: [NgClass, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'customModalClass()',
    '[class.mobile]': 'isMobile()',
    '(document:keydown)': 'onKeydown( $event )',
    '(document:mousedown)': 'onClick( $event )',
    '(wheel)': 'onWheel( $event )',
    '(touchmove)': 'onTouchMove( $event )',
  },
})
export class ModalWindowComponent implements OnDestroy {
  private readonly appCtrl = inject(AppController);
  private readonly injector = inject(Injector);
  private readonly ref = inject(ElementRef);
  public readonly layoutService = inject(LayoutService);

  protected isMobile = this.layoutService.isMobile;

  // ----------------------------
  // Presenting component container

  @ViewChild('formGroup', { read: TemplateRef<any>, static: true })
  private readonly formRef!: TemplateRef<any>;

  @ViewChild('modalWindowContainer', { read: ViewContainerRef, static: true })
  private readonly container!: ViewContainerRef;

  private componentRef!: ComponentRef<ModalComponent>;

  // ----------------------------
  // UI Events handlers
  protected onKeydown(e: KeyboardEvent): void {
    let key: string = e?.key ?? '';
    if (
      !this.config().noCloseOnEsc &&
      key === 'Escape' &&
      this.appCtrl.$modalLast().key === this.state().key
    )
      this.close();
  }

  protected onClick(e: MouseEvent): void {
    if (
      !this.config().noCloseOnClickOutside &&
      e?.target === this.ref.nativeElement &&
      e.type
    )
      this.close();
  }

  protected onWheel(event: WheelEvent): void {
    if (event?.target === this.ref.nativeElement) event.preventDefault();
  }

  protected onTouchMove(event: TouchEvent) {
    if (event?.target === this.ref.nativeElement) event.preventDefault();
  }

  // ----------------------------
  // Configure signals

  protected config: Signal<IModalWindowConfig> = signal<IModalWindowConfig>({});
  public state = input.required<IModalState>();

  // ----------------------------
  // UI signals

  protected title = computed(() => this.config().title ?? '');
  protected note = computed(() => this.config().note ?? '');
  protected noteClass = computed(() => this.config().noteClass ?? '');
  protected type = computed<ModalWindowType>(
    () => this.config().type ?? 'edit'
  );
  // protected form        = computed( ()=> !this.formItems?.() ? null : { config: this.formItems!() } )

  protected modalStyles = computed(() => {
    const effectivePaddingHorizontal =
      this.config().paddingHorizontal ?? this.config().padding ?? 32;
    const effectivePaddingVertical =
      this.config().paddingVertical ?? this.config().padding ?? 32;

    const w = [];
    if (this.config().width) w.push(`width: ${this.config().width}px;`);
    if (this.config().minWidth) w.push(`min-width: ${this.config().minWidth};`);
    if (this.config().maxWidth) w.push(`max-width: ${this.config().maxWidth};`);
    // else w.push( `max-width: calc(100vw - 100px);` )

    const h = [];
    if (this.config().height) h.push(`height: ${this.config().height};`);
    if (this.config().minHeight)
      h.push(`min-height: ${this.config().minHeight};`);
    if (this.config().maxHeight)
      h.push(`max-height: ${this.config().maxHeight};`);
    // else h.push( `max-height: calc(100vh - 100px);` )

    return `
      ${w.join(' ')}
      ${h.join(' ')}
      padding: ${effectivePaddingVertical}px ${effectivePaddingHorizontal}px;
    `;
  });

  protected readonly bgColor = computed(
    () => this.config().bgColor || 'var(--theme-background-bg-light)'
  );
  protected readonly yScrollType = computed(() =>
    this.config().overrideYScroll ? 'hidden' : 'auto'
  );
  protected readonly isSafeHtml = computed<boolean>(
    () => this.note() != null && typeof this.note() !== 'string'
  );
  protected readonly customModalClass = computed(() => this.config().cssClass);

  public actionInProcess?: ModelSignal<boolean>;

  // DefaultForm
  public formConfig?: Signal<Form.Config | undefined>;
  public formItems?: Signal<Form.Items | undefined>;
  public formInputs: Form.Inputs<this['formItems']> = model();
  public formIsValid = Form.isValid(this.formInputs);

  // ----------------------------

  public closeHandler: IModalState<any>['closeHandler'];

  // ----------------------------
  // Buttons
  protected modalButtons = computed(() => {
    const { type, setButtons, addButtons } = this.config();
    const buttons: ModalButton[] = [];

    // Кнопка cancel
    const cancelKey: ModalButtonKey = 'cancel';
    if (setButtons?.[cancelKey] !== null) {
      buttons.push({
        ...MODAL_WINDOW_BUTTONS[cancelKey],
        ...(setButtons?.[cancelKey] ?? {}),
        key: cancelKey,
      });
    }

    // Кнопки save и delete
    const primaryKey: ModalButtonKey = type === 'delete' ? 'delete' : 'save';
    if (setButtons?.[primaryKey] !== null) {
      buttons.push({
        ...MODAL_WINDOW_BUTTONS[primaryKey],
        ...(setButtons?.[primaryKey] ?? {}),
        key: primaryKey,
        disabled: setButtons?.[primaryKey]?.disabled ?? false,
      });
    }

    // Дополнительные кнопки
    if (addButtons) {
      for (const btn of addButtons) {
        buttons.push(btn);
      }
    }

    // Сортируем по order (кнопки без order будут в конце)
    return buttons.sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });
  });

  protected async buttonAction(key: string) {
    switch (key) {
      case 'cancel':
        this.close();
        break;

      case 'save':
      case 'delete':
        if (this.formInputs()) {
          const errors = Form.validate(this.modalComponent!.formInputs);
          await Util.asyncSleep(300);
          if (this.formIsValid() !== true) {
            console.warn(errors);
            return;
          }
        }
        try {
          this.actionInProcess?.set(true);

          await this.modalComponent.primaryAction();

          this.actionInProcess?.set(false);
        } catch (e) {
          console.error(e);
          this.actionInProcess?.set(false);
        }
        break;

      default:
        await this.modalComponent.buttonAction(key);
    }
  }

  // ----------------------------

  get modalComponent(): ModalComponent {
    return this.componentRef.instance;
  }

  constructor() {
    effect(() => {
      const state = this.state();
      this.closeHandler = state.closeHandler;
      untracked(() => {
        this.ngOnDestroy();

        // Create nested component
        this.componentRef = this.container.createComponent(state.component!, {
          injector: this.injector,
        });
        let component = this.componentRef.instance;

        // Установка сигналов на шаблоны группы полей формы и футера
        component.formRef = signal(this.formRef);

        // Config
        component.modalKey = Number(state.key);
        if (component.modal) this.config = component.modal;
        else component.modal = this.config;

        // Set input Data signal
        this.componentRef.setInput('inputData', state.data);

        // Form
        this.formConfig = component.formConfig;
        this.formItems = component.formItems;
        this.formInputs = component.formInputs as any;
        this.formIsValid = component.formIsValid;
        this.actionInProcess = component.actionInProcess;

        // Обнаружение изменений после установки всех переменных в компоненте
        this.componentRef.changeDetectorRef.detectChanges();
      });
    });
  }

  private appRoot?: HTMLElement;

  ngOnDestroy(): void {
    this.componentRef?.destroy();
    this.componentRef = undefined!;
    this.appRoot?.classList.remove('modal-open');
    this.container.clear();
  }

  protected async close(result?: any): Promise<void> {
    await this.state().closeHandler?.(result);
    this.appCtrl.$modalClose(Number(this.state().key));
  }

  /**
   * Обработчик клика внутри модального окна
   * останавливаем всплытие, чтобы предотвратить закрытие поля поиска при пустом значении и сброса app-team-table в app-team-cards
   */
  protected onModalBodyClick(event: MouseEvent) {
    const isOnTeamPage = !!document.querySelector('app-team-page');
    const clickedElement = event.target as HTMLElement;

    if (isOnTeamPage && !clickedElement.closest('.activity-log__content'))
      event.stopPropagation();
  }
  // onModalBodyClick(event: Event) {
  //   event.stopPropagation()
  // }
}
