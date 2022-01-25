import { HTTPHeaders } from './api/base'

export interface Config {
  api?: ApiConfig;
  mapi?: ApiConfig;
}

export interface ApiConfig {
  baseUrl: string;
  headers?: HTTPHeaders;
}

const defaults: Config = {
  api: {
    baseUrl: 'https://api.nanopay.cash/v1'
  },
  mapi: {
    baseUrl: 'https://mapi.taal.com/mapi'
  }
}

export function getEnv(opts: Config, key: string): any {
  const a = defaults[key as keyof Config] || {}
  const b = opts[key as keyof Config] || {}
  return {...a, ...b}
}