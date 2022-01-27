/**
 * This module exports an API client used to interface directly with the
 * Nanopay API.
 * 
 * An instance of the [[ApiClient]] is exposed on the Nanopay SDK instance, and
 * is used to interact with the Nanopay API.
 * 
 * @module
 */

import { NanopaySDK } from '../index'
import { getEnv } from './config'
import { BaseClient } from './api/base'
import { PayRequest } from './pay_request'

/**
 * Valid paramaters required create a Pay Request through the Nanopay API.
 */
export interface PayRequestParams {
  /**
   * Max 140 character description of the Pay Request.
   */
  description: string;

  /**
   * Number of satoshis required to fund the transaction (sum of outputs and fee)
   */
  satoshis: number;

  /**
   * TODO
   */
  keypath?: string;

  /**
   * Pay Request transaction context parameters.
   */
  ctx: PayRequestCtxParams;
}

/**
 * Valid Pay Request transaction context parameters. Used to create valid
 * signatures server-side.
 */
export interface PayRequestCtxParams {
  outhash: string;
  version?: number;
  locktime?: number;
  sighash_type?: number;
}

/**
 * The response data of a Pay Request.
 */
export interface PayRequestData {
  id: string;
  description: string;
  status: string;
  amount: MoneyData;
  fee: MoneyData;
  payment: { [method: string]: string };
  created_at: string;
  completed_at: string | null;
}

/**
 * Pay Request money data.
 */
export interface MoneyData {
  amount: string;
  currency: string
}

/**
 * TODO
 */
export interface ValidationErrors {
  [attribute: string]: string[]
}

/**
 * TODO
 */
export class ApiError extends Error {
  errors: ValidationErrors;

  constructor(message: string, errors: ValidationErrors) {
    super(message)
    this.errors = errors
    this.name = 'ApiError'
  }
}

/**
 * Nanopay API client.
 */
export class ApiClient {
  /**
   * Configured low-level base API client.
   * 
   * @private
   */
  private _api: BaseClient;

  /**
   * Creates a new Nanopay API client.
   * 
   * @param baseUrl Base URL of remote API
   * @internal
   */
  constructor(baseUrl: string) {
    this._api = new BaseClient(baseUrl, {
      'accept': 'application/json',
      'content-type': 'application/json; charset=utf-8',
    })
  }

  /**
   * Loads a Pay Request from the given ID.
   * 
   * @param id Pay Request ID
   * @returns Pay Request data
   */
  async loadPayRequest(id: string): Promise<PayRequestData> {
    const res = await this._api.get(`pay_requests/${id}`)
    if (res.ok) {
      return res.data
    } else {
      return Promise.reject(new ApiError('Pay Request not found', res.error))
    }
  }

  /**
   * Creates a Pay Request from the given parameters. 
   * 
   * @param params Pay Request params
   * @returns Pay Request data
   */
  async createPayRequest(params: PayRequestParams): Promise<PayRequestData> {
    const res = await this._api.post('pay_requests', params)
    if (res.ok) {
      return res.data
    } else {
      return Promise.reject(new ApiError('Invalid Pay Request', res.errors))
    }
  }

  /**
   * Confirms a Pay Request as completed.
   * 
   * @param payRequest Pay Request class instance
   * @returns Pay Request data
   */
  async completePayRequest(payRequest: PayRequest): Promise<any> {
    const txid = payRequest.tx.id()
    const res = await this._api.post(`pay_requests/${payRequest.data.id}/complete`, { txid })
    if (res.ok) {
      return res.data
    } else {
      return Promise.reject(new ApiError('Pay Request not completed', res.error))
    }
  }
}

/**
 * Creates and returns a new Nanopay API client.
 * 
 * @param sdk Nanopay SDK instance
 * @returns Nanopay API client
 * @internal
 */
export function createApiClient(sdk: NanopaySDK): ApiClient {
  const { baseUrl } = getEnv(sdk.opts, 'api')
  return new ApiClient(baseUrl)
}