import { TxIn, VarInt } from 'bsv'
import EventEmitter from 'eventemitter3'
import { NanopaySDK } from '../index'
import { PayRequestData } from '../api/nanopay'
import { PushTxPayload } from '../api/mapi'
import { Widget, WidgetParams } from '../widget/widget'

interface PayRequestOpts {
  sdk: NanopaySDK;
  tx: BsvTx;
  data: PayRequestData;
}

export class PayRequest {
  private _sdk: NanopaySDK;
  private _events: EventEmitter;
  tx: BsvTx;
  data: PayRequestData;
  mapi: PushTxPayload;

  constructor(opts: PayRequestOpts) {
    this._sdk = opts.sdk
    this.tx = opts.tx
    this.data = opts.data
    
    this._events = new EventEmitter()
    setTimeout(_ => this._events.emit('created', this))
  }

  on(event: string, listener: (...args: any[]) => void): EventEmitter {
    return this._events.on(event, listener)
  }

  onWidget(widget: Widget): void {
    widget.on('pr.funded', async (data) => {
      if (data.id === this.data.id) {
        console.log('funded', data)
        this.prepareBuild(data.txin)
        this._events.emit('funded', this)
        await this.pushTx(data.parent)
      }
    })

    this.on('success', ({ data }) => {
      this._sdk.api.completePayRequest(this)
    })
  }

  prepareBuild(txinHex: string): void {
    const txIn = TxIn.fromHex(txinHex)
    this.tx.txIns.unshift(txIn)
    this.tx.txInsVi = VarInt.fromNumber(this.tx.txIns.length)
  }

  async pushTx(parent?: string): Promise<PushTxPayload> {
    const pushArgs = parent ? [parent, this.tx.toHex()] : this.tx.toHex();
    const payload = await this._sdk.mapi.pushTx(pushArgs)
    const success = parent ?
      payload.txs.every(tx => tx.returnResult === 'success') :
      payload.returnResult === 'success';

    this.mapi = payload
    if (success) this._events.emit('success', this);
    return payload
  }

  toWidget(): WidgetParams {
    return {
      type: 'PayRequest',
      path: `/v1/pay_requests/${ this.data.id }`
    }
  }
}