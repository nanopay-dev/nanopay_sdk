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
  payRequests: PayRequestInterface;

  /**
   * UI Widget interface.
   */
  widget: WidgetInterface;

  /**
   * Creates a new Nanopay SDK instance.
   * 
   * @param opts Config options
   * @internal
   */
  constructor(opts: Config = {}) {
    this.opts = opts
    this.api = createApiClient(this)
    this.mapi = createMapiClient(this)
    this.payRequests = createPayRequestInterface(this)
    this.widget = createWidgetInterface(this)
  }
}

/**
 * Creates and returns a new Nanopay SDK instance.
 * 
 * @param opts Config options
 * @returns Nanopay SDK instance
 */
export default function Nanopay(opts: Config = {}): NanopaySDK {
  return new NanopaySDK(opts)
}

if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  window.Nanopay = Nanopay
}
