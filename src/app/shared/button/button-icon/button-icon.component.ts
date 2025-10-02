import { Component, HostBinding, Input } from '@angular/core'
import { ColorKey } from 'src/app/types'
import { IconComponent } from '../../icon/icon.component'
import { IconName } from '../../icon/icon-names-data'

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'button[icon][app-icon-button]',
    templateUrl: './button-icon.component.html',
    styleUrl: './button-icon.component.scss',
    imports: [ IconComponent ]
})
export class ButtonIconComponent {
  @Input() icon!: IconName
  @Input() svgStyle: Record<string, any> | null = null
  @Input() hoverColor?: ColorKey
  @Input() color?: ColorKey

  @HostBinding('class') get hostClasses() {
    const classes: Record<string, boolean> = {}

    if (this.color) {
      classes[this.color] = true
    }

    if (this.hoverColor) {
      classes[`hover-color-${this.hoverColor}`] = true
    }

    return classes
  }
}
