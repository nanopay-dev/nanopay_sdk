import Nanopay from './index'
import { NanopaySDK } from './index'
import { Config } from './nanopay/config'

export default Nanopay
export { NanopaySDK } from './index'
export { Config, ApiConfig } from './nanopay/config'
export { ApiClient, PayRequestParams, PayRequestCtxParams, PayRequestData } from './nanopay/api'
export { MapiClient, GetTxPayload, PushTxPayload, PushTxsItem, FeeQuotes, FeeQuote } from './nanopay/mapi'
export { BaseClient, HTTPHeaders } from './nanopay/api/base'
export { PayRequest, PayRequestInterface, PayRequestProps, PayRequestAttrs } from './nanopay/pay_request'
export { Widget, WidgetInterface, Widgetable, WidgetURL } from './nanopay/widget'

declare global {
  type BsvTx = any;
  type BsvTxIn = any;
  type BsvTxOut = any;
  type Forge = any;

  interface Window {
    Nanopay(opts: Config): NanopaySDK;
  }
}
