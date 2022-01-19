import EventEmitter from 'eventemitter3'
import { NanopaySDK } from '../index'

const HTTP_ORIGIN = 'http://localhost:4000'

export interface WidgetParams {
  type: string;
  path: string;
}

export interface Widgetable {
  onWidget: (Widget) => void;
  toWidget: () => WidgetParams;
}

function iframeSrc({ type, path }: WidgetParams) {
  return `http://localhost:4000/widget${path}`
}

const overlayStyles = {
  position: 'fixed',
  top: '0',
  bottom: '0',
  left: '0',
  right: '0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px',
  backgroundColor: 'rgba(0,0,0, 0.35)',
  opacity: '0',
  visibility: 'hidden',
  transition: 'opacity 200ms ease-in'
}

const widgetStyles = {
  width: '100%',
  maxWidth: '380px',
  height: '560px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  overflow: 'hidden',
  opacity: '0',
  visibility: 'hidden',
  transform: 'scale(0.9) translateY(-64px)',
  transition: 'transform 250ms ease-out'
}

export class Widget {
  private _sdk: NanopaySDK;
  private _events: EventEmitter;
  $overlay: HTMLElement;
  $widget: HTMLElement;
  $iframe: HTMLIFrameElement;
  isOpen: boolean;

  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
    this._events = new EventEmitter()
    this.$overlay = window.document.createElement('div')
    this.$widget = window.document.createElement('div')
    this.$iframe = window.document.createElement('iframe')
    

    this.$iframe.width = '100%'
    this.$iframe.height = '100%'

    Object.assign(this.$overlay.style, overlayStyles)
    Object.assign(this.$widget.style, widgetStyles)

    this.$widget.append(this.$iframe)
    this.$overlay.append(this.$widget)

    window.addEventListener('message', event => {
      if (
        event.origin === HTTP_ORIGIN &&
        event.source === this.$iframe.contentWindow
      ) {
        this._events.emit(event.data.type, event.data.payload)
      }
    }, false)

    this._events.on('resize', ({ height }) => {
      this.$widget.style.height = `${height}px`
    })

    this._events.on('close', () => {
      this.close()
    })
  }

  async open(params: WidgetParams): Promise<this> {
    if (this.isOpen) {
      // todo throw an error as already open
    }

    return new Promise((resolve, reject) => {
      window.document.body.append(this.$overlay)
      this.$iframe.src = iframeSrc(params)
      this.$iframe.onload = _ => {
        this.postMessage('handshake')
        //this.postMessage('configure', this.options)
        resolve(this.show())
      }
      this.$iframe.onerror = reject
    })
    
  }

  async close(): Promise<void> {
    if (this.isOpen) {
      await this.hide()
    }
    this.$overlay.remove()
    this._events.removeAllListeners()
  }

  async show(): Promise<this> {
    return new Promise(resolve => {
      this.$overlay.style.visibility = 'visible'
      this.$overlay.style.opacity = '1'
      this.$widget.style.visibility = 'visible'
      this.$widget.style.opacity = '1'
      this.$widget.style.transform = 'scale(1) translateY(0)'
      setTimeout(() => {
        this.isOpen = true
        resolve(this)
      }, 300)
    })
  }

  async hide(): Promise<this> {
    return new Promise(resolve => {
      this.$overlay.style.opacity = '0'
      setTimeout(() => {
        this.isOpen = false
        Object.assign(this.$overlay.style, overlayStyles)
        Object.assign(this.$widget.style, widgetStyles)
        resolve(this)
      }, 300)
    })
  }

  on(event: string, listener: (...args: any[]) => void): EventEmitter {
    return this._events.on(event, listener)
  }

  postMessage(type, payload = {}) {
    this.$iframe.contentWindow.postMessage({
      type,
      payload
    }, HTTP_ORIGIN)
  }
}