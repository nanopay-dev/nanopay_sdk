import { isBrowser } from 'browser-or-node'
import { NanopaySDK } from '../index'
import { Widget, Widgetable } from './widget'

export class WidgetInterface {
  private _sdk: NanopaySDK;
  private _widget?: Widget;

  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
  }

  async open(src: Widgetable): Promise<Widget> {
    ensureBrowser()
    this._widget = new Widget(this._sdk)
    src.onWidget(this._widget)
    return this._widget.open(src.toWidget())
  }

  async close(): Promise<void> {
    ensureBrowser()
    await this._widget.hide()
    this._widget.close()
    this._widget = null
  }

  get isOpen() {
    return !!this._widget
  }
}

// TODO
function ensureBrowser() {
  if (!isBrowser) throw 'Widget only available in browser environment'
}

/**
 * TODO
 */
 export function createWidgetInterface(sdk: NanopaySDK): WidgetInterface {
  return new WidgetInterface(sdk)
}