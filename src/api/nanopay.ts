import { BaseClient } from './base'
import { PayRequest } from '../payments/pay_request'

export interface PayRequestParams {
  description: string;
  satoshis: number;
  keypath?: string;
  ctx: PayRequestCtxParams;
}

export interface PayRequestCtxParams {
  outhash: string;
  version?: number;
  locktime?: number;
  sighash_type?: number;
}

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

export class NanopayClient {
  private _api: BaseClient;

  constructor(baseUrl: string) {
    this._api = new BaseClient(baseUrl, {
      'accept': 'application/json',
      'content-type': 'application/json; charset=utf-8',
    })
  }

  async loadPayRequest(id: string): Promise<PayRequestData> {
    const res = await this._api.get(`pay_requests/${id}`)
    return res.ok ? res.data : Promise.reject(res)
  }

  async createPayRequest(params: PayRequestParams): Promise<PayRequestData> {
    const res = await this._api.post('pay_requests', params)
    return res.ok ? res.data : Promise.reject(res)
  }

  async completePayRequest(payRequest: PayRequest): Promise<any> {
    const res = await this._api.post(`pay_requests/${payRequest.data.id}/complete`, { txid: payRequest.tx.id() })
    return res.ok ? res.data : Promise.reject(res)
  }
}
