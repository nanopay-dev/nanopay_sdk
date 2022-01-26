/**
 * This module exports an API client used to interface directly with a
 * [MAPI endpoint](https://github.com/bitcoin-sv-specs/brfc-merchantapi).
 * 
 * An instance of the [[MapiClient]] is exposed on the Nanopay SDK instance, and
 * is used to interact with the configured MAPI endpoint.
 * 
 * @module
 */

import { NanopaySDK } from '../index'
import { getEnv } from './config'
import { BaseClient, HTTPHeaders } from './api/base'

/**
 * MAPI payload from `GET /tx/:txid`.
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
 * MAPI payload from `POST /tx` or `POST /txs`.
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
 * Multiple transactions item. 
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
 * Fee quote simplified payload.
 */
export interface FeeQuotes {
  mine: FeeQuote;
  relay: FeeQuote;
}

/**
 * Fee quote item.
 */
export interface FeeQuote {
  data: number;
  standard: number;
}

/**
 * MAPI client.
 */
export class MapiClient {
  /**
   * Configured low-level base API client.
   * 
   * @private
   */
  private _api: BaseClient;

  /**
   * Creates a new MAPI client.
   * 
   * @param baseUrl Base URL of MAPI endpoint
   * @param headers Custom MAPI headers
   * @internal
   */
  constructor(baseUrl: string, headers?: HTTPHeaders) {
    this._api = new BaseClient(baseUrl, {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    })
  }
  
  /**
   * Gets the status of a transaction by the given TXID.
   * 
   * @param txid 
   * @returns MAPI payload
   */
  async getTx(txid: string): Promise<GetTxPayload> {
    const data = await this._api.get(`tx/${txid}`)
    return JSON.parse(data.payload)
  }

  /**
   * Pushes the given raw transaction(s) to the MAPI endpoint. Can be given a
   * single or array of hex-encoded raw transactions.
   * 
   * @param rawtx String or array of hex-encoded raw transactions.
   * @returns MAPI payload
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
   * Reconfigures the MAPI client with the given parameters.
   * 
   * @param baseUrl Base URL of MAPI endpoint
   * @param headers Custom MAPI headers
   */
  setApi(baseUrl: string, headers?: HTTPHeaders): void {
    this._api = new BaseClient(baseUrl, headers)
  }
}

/**
 * Creates and returns a new MAPI client.
 * 
 * @param sdk Nanopay SDK instance
 * @returns MAPI client
 * @internal
 */
export function createMapiClient(sdk: NanopaySDK): MapiClient {
  const { baseUrl, headers } = getEnv(sdk.opts, 'mapi')
  return new MapiClient(baseUrl, headers)
}