import { NanopaySDK } from '../index'
import { MapiClient } from './mapi'
import { NanopayClient } from './nanopay'
import { getEnv } from '../config'

export function createApiClient(sdk: NanopaySDK): NanopayClient {
  const { baseUrl } = getEnv(sdk.opts, 'api')
  return new NanopayClient(baseUrl)
}

export function createMapiClient(sdk: NanopaySDK): MapiClient {
  const { baseUrl, headers } = getEnv(sdk.opts, 'mapi')
  return new MapiClient(baseUrl, headers)
}