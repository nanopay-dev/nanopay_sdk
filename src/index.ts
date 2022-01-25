import { Config } from './nanopay/config'
import { createApiClient, ApiClient } from './nanopay/api'
import { createMapiClient, MapiClient } from './nanopay/mapi'
import { createPayRequestInterface, PayRequestInterface } from './nanopay/pay_request'
import { createWidgetInterface, WidgetInterface } from './nanopay/widget'

/**
 * Nanopay SDK class
 */
export class NanopaySDK {
  opts: Config;
  api: ApiClient;
  mapi: MapiClient;
  payRequest: PayRequestInterface;
  widget: WidgetInterface;

  /**
   * Creates a new Nanopay SDK instance
   * 
   * @param opts - Config options
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
 * Creates a new Nanopay SDK instance
 * 
 * @param opts - Config options
 * @returns Nanopay SDK instance
 */
export default function Nanopay(opts: Config = {}): NanopaySDK {
  return new NanopaySDK(opts)
}

if (typeof window !== 'undefined') {
  window.Nanopay = Nanopay
}

declare global {
  function Nanopay(opts: Config): NanopaySDK; 
}

// Export types
export { Config, ApiConfig } from './nanopay/config'
export { ApiClient, PayRequestParams, PayRequestCtxParams, PayRequestData } from './nanopay/api'
export { MapiClient, GetTxPayload, PushTxPayload, PushTxsItem, FeeQuotes, FeeQuote } from './nanopay/mapi'
export { BaseClient, HTTPHeaders } from './nanopay/api/base'
export { PayRequest, PayRequestInterface, PayRequestProps, PayRequestOpts } from './nanopay/pay_request'
export { Widget, WidgetInterface, WidgetParams, Widgetable } from './nanopay/widget'