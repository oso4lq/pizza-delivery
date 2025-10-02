import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common'

import { TippyDirective } from '@ngneat/helipopper'
import { IconName } from '../../_ui/icon/icon-names-data'
import { IconComponent } from '../../_ui/icon/icon.component'
import { ColorKey } from 'src/app/types'
import { LanguagePipe } from 'src/app/shared/pipes/language.pipe'

export interface InputsLabelConfig{
  /** Текст для метки. */
  text: string
  /** Наименование иконки справа от текста метки. */
  icon?: IconName
  /** Наименование цвета иконки из цветовой темы {@link ColorKey}. */
  iconColor?: ColorKey
  /** Цвет иконки в формате #RRGGBB. */
  iconColorHex?: string
  /** URL на который будет отправлять иконка при клике на неё. */
  url?: string
  /** Текст подсказки показывающийся при наведении на иконку. */
  details?: string
  /** true - скрыть иконку при инициализации компонента. */
  hideIconOnInit?: boolean
}

@Component({
  standalone: true,
  selector: 'app-inputs-label',
  templateUrl: './label.component.html',
  styleUrl: './label.component.scss',
  imports: [
    NgClass,
    LanguagePipe,
    NgTemplateOutlet,
    TippyDirective,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputsLabelComponent {
  id = input.required()
  config = input.required<InputsLabelConfig>()

  validClass = input<string>( '' )

  iconName: Signal<IconName | undefined> = computed( () => this.config().url ? this.config().icon ?? 'info-filled' : this.config().icon )
}
