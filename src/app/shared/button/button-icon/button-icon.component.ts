import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

import { ColorKey } from 'src/app/types'
import { IconComponent } from '../../icon/icon.component'
import { IconName } from '../../icon/icon-names-data'

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[icon][app-icon-button]',
  templateUrl: './button-icon.component.html',
  styleUrl: './button-icon.component.scss',
  imports: [ IconComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()'
  }
})
export class ButtonIconComponent {
  icon       = input<IconName>()
  svgStyle   = input<Record<string, any> | null>( null )
  color      = input<ColorKey>()
  hoverColor = input<ColorKey>()
  iconSize   = input<number>( 16 )

  protected hostClasses = computed( () => {
    let result: string[] = []
    let color = this.color()
    if( color ) result.push( color )
    let hoverColor = this.hoverColor()
    if( hoverColor ) result.push( `hover-color-${ hoverColor }` )
    return result.join( ' ' )
  } )
}
