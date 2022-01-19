import { Config } from './config'
import { createApiClient, createMapiClient } from './api'
import { MapiClient } from './api/mapi'
import { NanopayClient } from './api/nanopay'
import { createPaymentsInterface, PaymentsInterface } from './payments'
import { createWidgetInterface, WidgetInterface } from './widget'



export class NanopaySDK {
  opts: Config;
  api: NanopayClient;
  mapi: MapiClient;
  payments: PaymentsInterface;
  widget: WidgetInterface;

  constructor(opts: Config = {}) {
    this.opts = opts
    this.api = createApiClient(this)
    this.mapi = createMapiClient(this)
    this.payments = createPaymentsInterface(this)
    this.widget = createWidgetInterface(this)
  }
  
}

export default function Nanopay(opts: Config = {}): NanopaySDK {
  return new NanopaySDK(opts)
}
