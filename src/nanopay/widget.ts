/**
 * This module exports the [[Widget]] and [[WidgetInterface]] classes.
 * 
 * An instance of the [[WidgetInterface]] is exposed on the Nanopay SDK
 * instance, and is used to create, open and load [[Widget]] instances.
 * 
 * The Widget class itself is only used internally but is documented here for
 * reference.
 * 
 * ## Example
 * 
 * ```javascript
 * const payRequest = await nanopay.payRequest.create(params)
 * 
 * // Opens the Pay Request in the widget
 * nanopay.widget.open(payRequest)
 * ```
 * @module
 */

import { isBrowser } from 'browser-or-node'
import EventEmitter from 'eventemitter3'
import { NanopaySDK } from '../index'
import { getEnv } from './config'

// Widget styles
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

/**
 * Widgetable interface. Any objects that are meant to be viewed in a Widget
 * instance must implement the functions described in this interface.
 */
export interface Widgetable {
  /**
   * Callback that handles when a resource has been mounted in a Widget instance.
   * 
   * @param widget Widget instance
   */
  onWidget(widget: Widget): void;

  /**
   * Function that returns a URL that the widget will open.
   */
  toWidget(): WidgetURL;
}

/**
 * Valid URL that may be rendered in a URL.
 */
export type WidgetURL = string;

/**
 * Widget class. The [[WidgetInterface]] on the SDK is responsible for creating,
 * opening and closing Widget instances.
 * 
 * The Widget API is documented here for reference but is ordinarily not
 * interacted with directly.
 */
export class Widget {
  /**
   * Nanopay SDK instance.
   * 
   * @private
   */
  private _sdk: NanopaySDK;

  /**
   * Event Emitter.
   * 
   * @private
   */
  private _events: EventEmitter;

  /**
   * Overlay HTML element.
   */
  $overlay: HTMLElement;

  /**
   * Widget HTML element.
   */
  $widget: HTMLElement;

  /**
   * iFrame HTML element.
   */
  $iframe: HTMLIFrameElement;

  /**
   * Is true if the Widget is open.
   */
  isOpen: boolean;

  /**
   * Creates a new Widget instance.
   * 
   * @param sdk Nanopay SDK instance
   */
  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
    this._events = new EventEmitter()
    this.$overlay = window.document.createElement('div')
    this.$widget = window.document.createElement('div')
    this.$iframe = window.document.createElement('iframe')
    this.isOpen = false

    this.$iframe.width = '100%'
    this.$iframe.height = '100%'

    Object.assign(this.$overlay.style, overlayStyles)
    Object.assign(this.$widget.style, widgetStyles)

    this.$widget.append(this.$iframe)
    this.$overlay.append(this.$widget)

    const opts = getEnv(this._sdk.opts, 'widget')

    window.addEventListener('message', event => {
      if (
        event.origin === opts.origin &&
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

  /**
   * Opens the Widget for the given `src` item. The item must be an object that
   * conforms to the [[Widgetable]] interface.
   * 
   * @param src Widgetable source item
   * @returns Widget
   */
  async open(src: Widgetable): Promise<this> {
    if (this.isOpen) {
      // todo throw an error as already open
    }

    const opts = getEnv(this._sdk.opts, 'widget')
    const url = opts.origin + src.toWidget()

    return new Promise((resolve, reject) => {
      window.document.body.append(this.$overlay)
      this.$iframe.src = url
      this.$iframe.onload = () => {
        this.postMessage('handshake')
        //this.postMessage('configure', this.options)
        resolve(this.show())
      }
      this.$iframe.onerror = reject
    })
  }

  /**
   * Closes the Widget and removes all event listeners.
   */
  async close(): Promise<void> {
    if (this.isOpen) {
      await this.hide()
    }
    this._events.removeAllListeners()
  }

  /**
   * Displays the Widget.
   * 
   * @returns Widget
   */
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

  /**
   * Hides the Widget.
   * 
   * @returns 
   */
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

  /**
   * Add a listener for a given event.
   * 
   * @param event Event name
   * @param listener Listener function
   * @returns Event emitter
   */
  on(event: string, listener: (...args: any[]) => void): EventEmitter {
    return this._events.on(event, listener)
  }

  /**
   * Posts a message payload to the iFrame origin.
   * 
   * @param type Message type
   * @param payload Message payload
   */
  postMessage(type: string, payload: any = {}): void {
    const opts = getEnv(this._sdk.opts, 'widget')

    if (this.$iframe.contentWindow) {
      this.$iframe.contentWindow.postMessage({
        type,
        payload
      }, opts.origin)
    }
  }
}

/**
 * Widget Interface class. An instance of this class is exposed on the SDK
 * instance to create, open and close Widgets.
 */
export class WidgetInterface {
  /**
   * Nanopay SDK instance
   * 
   * @private
   */
  private _sdk: NanopaySDK;

  /**
   * Widget instance
   * 
   * @private
   */
  private _widget: Widget | null;

  /**
   * Creates a new Widget Interface instance.
   * 
   * @param sdk Nanopay SDK instance
   * @internal
   */
  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
    this._widget = null
  }

  /**
   * Opens a widget for the given `src` item. The item must be an instance that
   * conforms to the [[Widgetable]] interface.
   * 
   * @param src Widgetable source item
   * @returns Widget instance
   */
  async open(src: Widgetable): Promise<Widget> {
    ensureBrowser()
    this._widget = new Widget(this._sdk)

    src.onWidget(this._widget)
    return this._widget.open(src)
  }

  /**
   * Closes and destroys the currently open Widget.
   */
  async close(): Promise<void> {
    ensureBrowser()
    if (this._widget !== null) {
      await this._widget.hide()
      await this._widget.close()
      this._widget = null
    }
  }

  /**
   * Is true if a Widget is currently open.
   */
  get isOpen(): boolean {
    return this._widget !== null
  }
}

/**
 * Create and returns a new Widget interface.
 * 
 * @param sdk Nanopay SDK instance
 * @returns Widget interface
 * @internal
 */
export function createWidgetInterface(sdk: NanopaySDK): WidgetInterface {
  return new WidgetInterface(sdk)
}

// Throws an error unless the environment is a web browser
function ensureBrowser() {
  if (!isBrowser) throw 'Widget only available in browser environment'
}
