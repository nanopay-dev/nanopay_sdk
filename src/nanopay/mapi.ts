import { NanopaySDK } from '../index'
import { getEnv } from './config'
import { BaseClient, HTTPHeaders } from './api/base'

/**
 * TODO
 */
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

/**
 * TODO
 */
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
  txs?: PushTxsItem[];
}

/**
 * TODO
 */
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

/**
 * TODO
 */
export interface FeeQuotes {
  mine: FeeQuote;
  relay: FeeQuote;
}

/**
 * TODO
 */
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

/**
 * TODO
 */
export class MapiClient {
  private _api: BaseClient;

  /**
   * TODO
   * 
   * @param baseUrl 
   * @param headers 
   */
  constructor(baseUrl: string, headers?: HTTPHeaders) {
    this._api = new BaseClient(baseUrl, {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    })
  }
  
  /**
   * TODO
   * 
   * @param txid 
   * @returns 
   */
  async getTx(txid: string): Promise<GetTxPayload> {
    const data = await this._api.get(`tx/${txid}`)
    return JSON.parse(data.payload)
  }

  /**
   * TODO
   * 
   * @param rawtx 
   * @returns 
   */
  async pushTx(rawtx: string | string[]): Promise<PushTxPayload> {
    let data;
    if (Array.isArray(rawtx)) {
      data = await this._api.post('txs', rawtx.map(rawtx => ({ rawtx })))
    } else {
      data = await this._api.post('tx', { rawtx })
    }
    return JSON.parse(data.payload)
  }

  /**
   * TODO
   * 
   * @param baseUrl 
   * @param headers 
   */
  setApi(baseUrl: string, headers?: HTTPHeaders): void {
    this._api = new BaseClient(baseUrl, headers)
  }
}

/**
 * TODO
 * 
 * @param sdk 
 * @returns 
 */
export function createMapiClient(sdk: NanopaySDK): MapiClient {
  const { baseUrl, headers } = getEnv(sdk.opts, 'mapi')
  return new MapiClient(baseUrl, headers)
}