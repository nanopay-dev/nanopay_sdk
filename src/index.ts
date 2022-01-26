/**
 * The [[default | default export]] from this package is a constructor function
 * used to instantiate a new Nanopay SDK instance. The returned object is your
 * entrypoint to the rest of the Nanopay SDK.
 * 
 * ## Example
 * 
 * ```javascript
 * import Nanopay from '@nanopay/sdk'
 * 
 * const nanopay = Nanopay()
 * 
 * const payRequest = await nanopay.payRequest.create(params)
 * ```
 * @module
 */

import { Config } from './nanopay/config'
import { createApiClient, ApiClient } from './nanopay/api'
import { createMapiClient, MapiClient } from './nanopay/mapi'
import { createPayRequestInterface, PayRequestInterface } from './nanopay/pay_request'
import { createWidgetInterface, WidgetInterface } from './nanopay/widget'

/**
 * Nanopay SDK class
 */
export class NanopaySDK {
  /**
   * User-specified Config options.
   */
  opts: Config;

  /**
   * Nanopay API client
   */
  api: ApiClient;

  /**
   * Configurable MAPI client.
   */
  mapi: MapiClient;

  /**
   * Pay Request interface.
   */
  payRequest: PayRequestInterface;

  /**
   * UI Widget interface.
   */
  widget: WidgetInterface;

  /**
   * Creates a new Nanopay SDK instance.
   * 
   * @param opts Config options
   */
  constructor(opts: Config = {}) {
    this.opts = opts
    this.api = createApiClient(this)
    this.mapi = createMapiClient(this)
    this.payRequest = createPayRequestInterface(this)
    this.widget = createWidgetInterface(this)
  }
}

/**
 * Creates and returns a new Nanopay SDK instance.
 * 
 * @param opts Config options
 * @returns Nanopay SDK instance
 */
export default function(opts: Config = {}): NanopaySDK {
  return new NanopaySDK(opts)
}

if (typeof window !== 'undefined') {
  window.Nanopay = Nanopay
}

declare global {
  function Nanopay(opts: Config): NanopaySDK; 
}

// Export types
//export { Config, ApiConfig } from './nanopay/config'
//export { ApiClient, PayRequestParams, PayRequestCtxParams, PayRequestData } from './nanopay/api'
//export { MapiClient, GetTxPayload, PushTxPayload, PushTxsItem, FeeQuotes, FeeQuote } from './nanopay/mapi'
//export { BaseClient, HTTPHeaders } from './nanopay/api/base'
//export { PayRequest, PayRequestInterface, PayRequestProps, PayRequestOpts } from './nanopay/pay_request'
//export { Widget, WidgetInterface, WidgetParams, Widgetable } from './nanopay/widget'