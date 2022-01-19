import merge from 'ts-deepmerge'
import { HTTPHeaders } from './api/base'

interface ApiConfig {
  baseUrl: string;
  headers?: HTTPHeaders;
}

export interface Config {
  api?: ApiConfig;
  mapi?: ApiConfig;
}

const defaults: Config = {
  api: {
    baseUrl: 'https://api.nanopay.cash/v1'
  },
  mapi: {
    baseUrl: 'https://mapi.taal.com/mapi'
  }
}

export function getEnv(opts: Config, key: string) {
  const a = defaults[key] || {}
  const b = opts[key] || {}
  return merge(a, b)
}