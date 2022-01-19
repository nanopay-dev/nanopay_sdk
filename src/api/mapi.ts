import { BaseClient, HTTPHeaders } from './base'

export interface GetTxPayload {
  apiVersion: string;
  blockHash?: string;
  blockHeight?: number;
  confirmations?: number;
  minerId: string;
  resultDescription: string;
  returnResult: string;
  timestamp: string;
  txid: string;
  txSecondMempoolExpiry: number;
}

export interface PushTxPayload {
  apiVersion: string;
  currentHighestBlockHash: string;
  currentHighestBlockHeight: number;
  minerId: string;
  timestamp: string;
  txSecondMempoolExpiry: number;

  resultDescription?: string;
  returnResult?: string;
  txid?: string;

  txs?: PushTxsItem[]
}

export interface PushTxsItem {
  conflictedWith?: {
    hex: string;
    size: number;
    txid: string;
  }[];
  resultDescription: string;
  returnResult: string;
  txid: string;
}

export interface FeeQuotes {
  mine: FeeQuote;
  relay: FeeQuote;
}

export interface FeeQuote {
  data: number;
  standard: number;
}

export const defaultFees: FeeQuotes = {
  mine: {
    data: 0.5,
    standard: 0.5
  },
  relay: {
    data: 0.25,
    standard: 0.25
  }
}

export class MapiClient {
  private _api: BaseClient;

  constructor(baseUrl: string, headers?: HTTPHeaders) {
    this.setApi(baseUrl)
  }

  async getTx(txid: string): Promise<GetTxPayload> {
    const data = await this._api.get(`tx/${txid}`)
    return JSON.parse(data.payload)
  }

  async pushTx(rawtx: string | string[]): Promise<PushTxPayload> {
    let data;
    if (Array.isArray(rawtx)) {
      data = await this._api.post('txs', rawtx.map(rawtx => ({ rawtx })))
    } else {
      data = await this._api.post('tx', { rawtx })
    }
    return JSON.parse(data.payload)
  }

  setApi(baseUrl: string, headers?: HTTPHeaders): void {
    this._api = new BaseClient(baseUrl, headers)
  }
}
