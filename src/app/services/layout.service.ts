// layout.service.ts

import { Injectable, OnDestroy, signal } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class LayoutService implements OnDestroy {

  public below900px          = signal<boolean>( false ) // true, если ширина ≤ 900px
  public below1000px         = signal<boolean>( false ) // true, если ширина ≤ 1000px
  public below1200px         = signal<boolean>( false ) // true, если ширина ≤ 1200px
  public below1440px         = signal<boolean>( false ) // true, если ширина ≤ 1440px
  public below1600px         = signal<boolean>( false ) // true, если ширина ≤ 1600px
  public desktop1200to1440px = signal<boolean>( false ) // true, если ширина 1200px - 1440px
  public desktop1440to1600px = signal<boolean>( false ) // true, если ширина 1440px - 1600px
  public desktop1440to1920px = signal<boolean>( false ) // true, если ширина 1440px - 1920px
  public desktop1600to1920px = signal<boolean>( false ) // true, если ширина 1600px - 1920px
  public desktop1600to2560px = signal<boolean>( false ) // true, если ширина 1600px - 2560px
  public desktop1920to2560px = signal<boolean>( false ) // true, если ширина 1920px - 2560px
  public above2560px         = signal<boolean>( false ) // true, если ширина ≥ 2560px

  public isMobileWidth       = signal<boolean>( false ) // true, если ширина ≤ 900px
  public isTablet            = signal<boolean>( false ) // true, если ширина ≤ 1200px
  public isWideScreen        = signal<boolean>( false ) // true, если ширина ≥ 1680px

  public isMobileUserAgent   = signal<boolean>( false ) // по UserAgent
  public isMobile            = signal<boolean>( false ) // объединённая проверка

  protected resizeEventListener: EventListener = () => this.onResize()

  constructor(){
    this.onResize()
    window.addEventListener( 'resize', this.resizeEventListener )
    const ua = navigator.userAgent    // UserAgent
    const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) // Платформа
    this.isMobileUserAgent.set( uaMobile )
  }

  ngOnDestroy() {
    window.removeEventListener( 'resize', this.resizeEventListener )
  }

  private onResize(): void {
    const w = window.innerWidth

    // Breakpoint signals
    this.below900px.set( w <= 900 )
    this.below1000px.set( w <= 1000 )
    this.below1200px.set( w <= 1199 )
    this.below1440px.set( w <= 1439 )
    this.below1600px.set( w <= 1599 )
    this.desktop1200to1440px.set( w >= 1200 && w < 1440 )
    this.desktop1440to1600px.set( w >= 1440 && w < 1600 )
    this.desktop1440to1920px.set( w >= 1440 && w < 1920 )
    this.desktop1600to1920px.set( w >= 1600 && w < 1920 )
    this.desktop1600to2560px.set( w >= 1600 && w < 2560 )
    this.desktop1920to2560px.set( w >= 1920 && w < 2560 )
    this.above2560px.set( w > 2560 )

    // Mobile / Tablet / Wide
    this.isMobileWidth.set( w <= 1000 )
    this.isTablet.set( w > 1000 && w < 1680 )
    this.isWideScreen.set( w >= 1680 )

    this.isMobile.set( this.isMobileWidth() )
  }

  setDesktopVersion(): void {
    this.onResize()
  }

  setMobileVersion(): void {
    this.onResize()
  }

}
