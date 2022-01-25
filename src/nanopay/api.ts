import { NanopaySDK } from '../index'
import { getEnv } from './config'
import { BaseClient } from './api/base'
import { PayRequest } from './pay_request'

/**
 * TODO
 */
export interface PayRequestParams {
  description: string;
  satoshis: number;
  keypath?: string;
  ctx: PayRequestCtxParams;
}

/**
 * TODO
 */
export interface PayRequestCtxParams {
  outhash: string;
  version?: number;
  locktime?: number;
  sighash_type?: number;
}

/**
 * TODO
 */
export interface PayRequestData {
  id: string;
  description: string;
  status: string;
  amount: string;
  fee: string;
  payment: { [method: string]: string };
  created_at: string;
  completed_at: string;
}

/**
 * TODO
 */
export class ApiClient {
  private _api: BaseClient;

  /**
   * TODO
   * 
   * @param baseUrl 
   */
  constructor(baseUrl: string) {
    this._api = new BaseClient(baseUrl, {
      'accept': 'application/json',
      'content-type': 'application/json; charset=utf-8',
    })
  }

  /**
   * TODO
   * 
   * @param id 
   * @returns 
   */
  async loadPayRequest(id: string): Promise<PayRequestData> {
    const res = await this._api.get(`pay_requests/${id}`)
    return res.ok ? res.data : Promise.reject(res)
  }

  /**
   * TODO
   * 
   * @param params 
   * @returns 
   */
  async createPayRequest(params: PayRequestParams): Promise<PayRequestData> {
    const res = await this._api.post('pay_requests', params)
    return res.ok ? res.data : Promise.reject(res)
  }

  /**
   * TODO
   * 
   * @param payRequest 
   * @returns 
   */
  async completePayRequest(payRequest: PayRequest): Promise<any> {
    const res = await this._api.post(`pay_requests/${payRequest.data.id}/complete`, { txid: payRequest.tx.id() })
    return res.ok ? res.data : Promise.reject(res)
  }
}

/**
 * TODO
 * 
 * @param sdk 
 * @returns 
 */
export function createApiClient(sdk: NanopaySDK): ApiClient {
  const { baseUrl } = getEnv(sdk.opts, 'api')
  return new ApiClient(baseUrl)
}