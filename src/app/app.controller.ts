// app.controller.ts

import { Injectable, signal, inject, computed } from "@angular/core"
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from "@angular/router"
import { IGalleryConfig } from "./shared/gallery/gallery.component"
import { IModalState } from "./shared/modal/modal.types"

type MainTab = { ID: string, ts: number } | null
@Injectable({ providedIn: 'root' })
export class AppController {
  private router        = inject( Router )
  private route         = inject( ActivatedRoute )
  private locService    = inject( Location )

  static shared: AppController // <- Singleton Instance

  //----------------------------
  // Модальные окна
  private $_modalStates = signal<Record<number, IModalState> | null >(null)

  public $modalOpen( modalState: IModalState): void {
    const key = modalState.key
    this.$_modalStates.update(v=>({ ...( v || {} ), [String(key)]: modalState }))
  }

  public $modalClose( key?: number ): void {
    if( !key || !this.$_modalStates() || Object.keys( this.$_modalStates() || {} ).length === 1 || !this.$_modalStates()?.[ key ] ) {
      // close All
      this.$_modalStates.set( null )
      return
    }
    let modalStates = this.$_modalStates()
    delete modalStates![ key ]
    this.$_modalStates.set({ ...modalStates })
  }
  public $modalList = computed(()=>Object.keys( this.$_modalStates() || [] ).sort().map( k=> this.$_modalStates()![ Number(k) ]))
  public $modalLast = computed(()=>{
    const modalList = this.$_modalStates() || []
    let keys = Object.keys( modalList ).sort()
    return modalList[ Number(keys[ keys.length - 1]) ]
  })

  // ---------------------------
  // Галерея
  public gallery = signal<IGalleryConfig | null>(null)

}
