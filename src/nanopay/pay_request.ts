import { TxIn, VarInt } from 'bsv'
import EventEmitter from 'eventemitter3'
import { NanopaySDK } from '../index'
import { PayRequestData } from './api'
import { defaultFees, FeeQuote, FeeQuotes, PushTxPayload } from './mapi'
import { Widget, WidgetParams } from './widget'


/**
 * TODO
 */
export interface PayRequestProps {
  description: string;
  forge?: Forge;
  tx?: BsvTx;
  rates?: FeeQuotes;
}

/**
 * TODO
 */
export interface PayRequestOpts {
  sdk: NanopaySDK;
  tx: BsvTx;
  data: PayRequestData;
}

/**
 * TODO
 */
export class PayRequest {
  private _sdk: NanopaySDK;
  private _events: EventEmitter;
  tx: BsvTx;
  data: PayRequestData;
  mapi?: PushTxPayload;

  /**
   * TODO
   * 
   * @param opts 
   */
  constructor(opts: PayRequestOpts) {
    this._sdk = opts.sdk
    this.tx = opts.tx
    this.data = opts.data
    
    this._events = new EventEmitter()
    setTimeout(() => this._events.emit('created', this))
  }

  /**
   * TODO
   * 
   * @param event 
   * @param listener 
   * @returns 
   */
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

    this.on('success', () => {
      this._sdk.api.completePayRequest(this)
    })
  }

  /**
   * TODO
   * 
   * @param txinHex 
   */
  prepareBuild(txinHex: string): void {
    const txIn = TxIn.fromHex(txinHex)
    this.tx.txIns.unshift(txIn)
    this.tx.txInsVi = VarInt.fromNumber(this.tx.txIns.length)
  }

  /**
   * TODO
   * 
   * @param parent 
   * @returns 
   */
  async pushTx(parent?: string): Promise<PushTxPayload> {
    const pushArgs = parent ? [parent, this.tx.toHex()] : this.tx.toHex();
    const payload = await this._sdk.mapi.pushTx(pushArgs)
    const success = typeof payload.txs === 'undefined' ?
      payload.returnResult === 'success' :
      payload.txs.every(tx => tx.returnResult === 'success');

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

/**
 * TODO
 */
export class PayRequestInterface {
  private _sdk: NanopaySDK;

  /**
   * TODO
   * 
   * @param sdk 
   */
  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
  }

  /**
   * TODO
   * 
   * @param params 
   * @returns 
   */
  async create(params: PayRequestProps): Promise<PayRequest> {
    const tx = buildTx(params)
    const satoshis = estimateSats(tx)
    const outhash = tx.hashOutputs().toString('hex')
    const data = await this._sdk.api.createPayRequest({
      ctx: { outhash },
      description: params.description,
      satoshis,
    })

    return new PayRequest({
      sdk: this._sdk,
      tx,
      data
    })
  }

  /**
   * TODO
   * 
   * @param id 
   * @param params 
   * @returns 
   */
  async load(id: string, params: PayRequestProps): Promise<PayRequest> {
    const tx = buildTx(params)
    //const satoshis = estimateSats(tx)
    //const outhash = tx.hashOutputs().toString('hex')
    const data = await this._sdk.api.loadPayRequest(id)

    // TODO check of payrequest matches - if not raise error

    return new PayRequest({
      sdk: this._sdk,
      tx,
      data
    })
  }
}

// TODO
function buildTx(params: PayRequestProps): BsvTx {
  if (params.forge) {
    const forge = params.forge
    forge.build()
    return forge.tx
  }
}

// TODO
function estimateSats(tx: BsvTx, rates: FeeQuotes = defaultFees): number {
  const outSum = tx.txOuts.reduce((acc: number, o: BsvTxOut) => acc + o.valueBn.toNumber(), 0)
  const parts: Partial<FeeQuote>[] = [
    { standard: 4 + 4 }, // version + locktime
    { standard: tx.txInsVi.buf.length + tx.txOutsVi.buf.length }, // txInsVi + txOutsVi
  ]

  tx.txIns.forEach((txIn: BsvTxIn) => {
    parts.push({ standard: txIn.toBuffer().length })
  })

  tx.txOuts.forEach((txOut: BsvTxOut) => {
    const part: Partial<FeeQuote> = {}
    const type = txOut.script.chunks[0].opCodeNum === 0 && txOut.script.chunks[1].opCodeNum === 106 ? 'data' : 'standard'
    part[type] = txOut.toBuffer().length
    parts.push(part)
  })

  const fee = parts.reduce((fee: number, p: Partial<FeeQuote>) => {
    return Object
      .keys(p)
      .reduce((acc: number, k: string) => {

        const bytes: number = p[k as keyof FeeQuote] || 0,
              // @ts-ignore
              rate = rates[k as keyof FeeQuote] || rates.mine[k as keyof FeeQuote];
        return acc + Math.ceil(bytes * rate)
      }, fee)
  }, 0)

  return outSum + fee;
}

/**
 * TODO
 * 
 * @param sdk 
 * @returns 
 */
export function createPayRequestInterface(sdk: NanopaySDK): PayRequestInterface {
  return new PayRequestInterface(sdk)
}