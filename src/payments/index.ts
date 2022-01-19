import { NanopaySDK } from '../index'
import { defaultFees, FeeQuotes } from '../api/mapi'
import { PayRequest } from './pay_request'

export interface PayRequestAttrs {
  description: string;
  forge?: Forge;
  tx?: BsvTx;
  rates?: FeeQuotes;
}

export class PaymentsInterface {
  private _sdk: NanopaySDK;

  constructor(sdk: NanopaySDK) {
    this._sdk = sdk
  }

  async createPayRequest(params: PayRequestAttrs): Promise<PayRequest> {
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

  async loadPayRequest(id: string, params: PayRequestAttrs): Promise<PayRequest> {
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
function buildTx(params: PayRequestAttrs): BsvTx {
  if (params.forge) {
    const forge = params.forge
    forge.build()
    return forge.tx
  }
}

// TODO
function estimateSats(tx: BsvTx, rates: FeeQuotes = defaultFees): number {
  const outSum = tx.txOuts.reduce((a, o) => a + o.valueBn.toNumber(), 0)
  const parts = [
    { standard: 4 + 4 }, // version + locktime
    { standard: tx.txInsVi.buf.length + tx.txOutsVi.buf.length }, // txInsVi + txOutsVi
  ]

  tx.txIns.forEach(txIn => {
    parts.push({ standard: txIn.toBuffer().length })
  })

  tx.txOuts.forEach(txOut => {
    const part = {}
    const type = txOut.script.chunks[0].opCodeNum === 0 && txOut.script.chunks[1].opCodeNum === 106 ? 'data' : 'standard'
    part[type] = txOut.toBuffer().length
    // @ts-ignore
    parts.push(part)
  })

  const fee = parts.reduce((fee, p) => {
    return Object
      .keys(p)
      .reduce((acc, k) => {
        const bytes = p[k],
              rate = rates[k] || rates.mine[k];
        return acc + Math.ceil(bytes * rate)
      }, fee)
  }, 0)

  return outSum + fee;
}

/**
 * TODO
 */
export function createPaymentsInterface(sdk: NanopaySDK): PaymentsInterface {
  return new PaymentsInterface(sdk)
}