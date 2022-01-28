/**
 * This module exports the [[PayRequest]] and [[PayRequestInterface]] classes.
 * 
 * An instance of the [[PayRequestInterface]] is exposed on the Nanopay SDK
 * instance, and is used to create and load [[PayRequest]] instances.
 * 
 * ## Examples
 * 
 * ```javascript
 * const nanopay = Nanopay()
 * 
 * // create a PayRequest
 * const payRequest = await nanopay.payRequest.create({
 *   description: 'Example pay request',
 *   tx // unfunded tx
 * })
 * ```
 * @module
 */

import bsv from 'bsv'
import EventEmitter from 'eventemitter3'
import { NanopaySDK } from '../index'
import { getEnv } from './config'
import { PayRequestData } from './api'
import { FeeQuote, FeeQuotes, PushTxPayload } from './mapi'
import { Widget, WidgetURL } from './widget'

/**
 * Pay Request attributes used to create a Pay Request.
 * 
 * Must contain one of: forge, rawtx, or tx.
 */
export interface PayRequestAttrs {
  /**
   * 140 character description of the Pay Request.
   */
  description: string;

  /**
   * TxForge instance, defining the unfunded tx.
   */
  forge?: Forge;

  /**
   * BSV Tx instance, defining the unfunded tx.
   */
  tx?: BsvTx;

  /**
   * Hex-encoded raw transaction, defining the unfunded tx.
   */
  rawtx?: string;

  /**
   * Miner fee quote.
   */
  fees?: FeeQuotes;
}

/**
 * Properties required to create a PayRequest instance.
 * 
 * @internal
 */
export interface PayRequestProps {
  /**
   * Nanopay SDK instance.
   */
  sdk: NanopaySDK;

  /**
   * BSV Tx object.
   */
  tx: BsvTx;

  /**
   * Pay Request data response from the Nanopay API.
   */
  data: PayRequestData;
}

/**
 * Pay Request class. The [[PayRequestInterface]] on the SDK returns instances
 * of Pay Requests which can be interacted with directly.
 */
export class PayRequest {
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
   * BSV Tx object.
   */
  tx: BsvTx;

  /**
   * Pay Request data response from the Nanopay API.
   */
  data: PayRequestData;

  /**
   * MAPI response payload. Added once the transaction has been pushed to the
   * MAPI endpoint.
   */
  mapi?: PushTxPayload;

  /**
   * Creates a new Pay Request instance.
   * 
   * @param params Pay Request properties
   * @event created
   * @internal
   */
  constructor(params: PayRequestProps) {
    this._sdk = params.sdk
    this.tx = params.tx
    this.data = params.data
    
    this._events = new EventEmitter()
    this.on('success', async () => {
      this.data = await this._sdk.api.completePayRequest(this)
      if (this.data.status === 'completed') {
        this._events.emit('completed', this)
      }
    })
    setTimeout(() => this._events.emit('created', this))
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
   * Pushes the funded transaction to the SDK's configured MAPI endpoint.
   * Can optionally by given a parent transaction in which case both transactions
   * are pushed together.
   * 
   * @param parent Hex-encoded parent transaction
   * @returns MAPI Push TX payload
   * @event success
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

  /**
   * Callback function handling when the PayRequest has been mounted in the
   * UI widget.
   * 
   * @param widget Widget instance
   * @event funded
   * @internal
   */
  onWidget(widget: Widget): void {
    widget.on('pr.funded', async (data) => {
      if (data.id === this.data.id) {
        this.prepareBuild(data.txin)
        this._events.emit('funded', this)
        await this.pushTx(data.parent)
      }
    })
  }

  /**
   * Returns parameters for rendering the PayRequest in a Widget.
   * 
   * @returns Widget parameters
   * @internal
   */
  toWidget(): WidgetURL {
    return `/v1/pay_requests/${ this.data.id }`
  }

  /**
   * Adds the given TxIn to the Tx, creating a funded transaction.
   * 
   * @param txinHex Hex-encoded TxIn
   * @private
   */
  private prepareBuild(txinHex: string): void {
    const txIn = bsv.TxIn.fromHex(txinHex)
    this.tx.txIns.unshift(txIn)
    this.tx.txInsVi = bsv.VarInt.fromNumber(this.tx.txIns.length)
  }
}

/**
 * Pay Request Interface class. An instance of this class is exposed on the
 * SDK instance to create and load Pay Requests.
 */
export class PayRequestInterface {
  /**
   * Nanopay SDK instance
   * 
   * @private
   */
  private _sdk: NanopaySDK;

  /**
   * Creates a new Pay Request interface instance
   * 
   * @param sdk Nanopay SDK instance
   * @internal
   */
  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
  }

  /**
   * Creates and returns a new [[PayRequest]].
   * 
   * Builds the transaction from the given params, calculates the satoshis
   * required to fund the transaction and creates a Pay Request using the
   * Nanopay API.
   * 
   * @param params Pay Request parameters
   * @returns Pay Request instance
   */
  async create(params: PayRequestAttrs): Promise<PayRequest> {
    const tx = buildTx(params)
    const fees = params.fees || getEnv(this._sdk.opts, 'fees')
    const satoshis = calculateSats(tx, fees)
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
   * Loads an existing Pay Request with the given ID and returns a [[PayRequest]]
   * instance.
   * 
   * Must also give valid params to build the unfunded transaction. If the built
   * transaction doesn't match that of the existing Pay Request an error is
   * thrown.
   * 
   * @param id Pay Request ID
   * @param params Pay Request parameters
   * @returns Pay Request instance
   */
  async load(id: string, params: PayRequestAttrs): Promise<PayRequest> {
    const tx = buildTx(params)
    //const fees = params.fees || getEnv(this._sdk.opts, 'fees')
    //const satoshis = calculateSats(tx, fees)
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

// Builds the BSV Tx object from the given attrs
function buildTx(params: PayRequestAttrs): BsvTx {
  if (params.forge) {
    const forge = params.forge
    forge.build()
    return forge.tx
  } else if (params.rawtx) {
    return bsv.Tx.fromHex(params.rawtx)
  } else if (params.tx) {
    return params.tx
  } else {
    throw new Error('Tx not given in params')
  }
}

// Calculates the required satoshis to fund the given BSV Tx object
function calculateSats(tx: BsvTx, rates: FeeQuotes): number {
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
 * Creates and returns a new Pay Request interface.
 * 
 * @param sdk Nanopay SDK instance
 * @returns Pay Request interface
 * @internal
 */
export function createPayRequestInterface(sdk: NanopaySDK): PayRequestInterface {
  return new PayRequestInterface(sdk)
}