/**
 * This module defines the default Nanopay SDK configuration. When creating a
 * new Nanopay SDK instance, an optional config parameter can be given that
 * overrides any of the defaults.
 * 
 * ```javascript
 * const defaults = {
 *   api: {
 *     baseUrl: 'https://api.nanopay.cash/v1'
 *   },
 *   mapi: {
 *     baseUrl: 'https://mapi.taal.com/mapi',
 *   },
 *   defaultFees: {
 *     x
 *   }
 * }
 * ```
 * 
 * @module
 */

import merge from 'deepmerge'
import { HTTPHeaders } from './api/base'
import { FeeQuotes } from './mapi'

/**
 * Nanopay SDK config interface
 */
export interface Config {
  /**
   * Nanopay API config options
   */
  api?: ApiConfig;

  /**
   * mAPI config options
   */
  mapi?: ApiConfig;

  /**
   * Default miner fees
   */
  fees?: FeeQuotes;

  /**
   * Widget config
   */
  widget?: {
    origin: string
  }
}

/**
 * Nanopay API config interface
 */
export interface ApiConfig {
  /**
   * Base URL of the API
   */
  baseUrl: string;

  /**
   * HTTP Headers object
   */
  headers?: HTTPHeaders;
}

const defaults: Config = {
  api: {
    baseUrl: 'https://api.nanopay.cash/v1'
  },
  mapi: {
    baseUrl: 'https://mapi.taal.com/mapi'
  },
  fees: {
    mine: {
      data: 0.5,
      standard: 0.5
    },
    relay: {
      data: 0.25,
      standard: 0.25
    }
  },
  widget: {
    origin: 'https://www.nanopay.com'
  }
}

/**
 * Returns the value for `key` in the given [[Config]] options.
 * 
 * Where `key` doesn't exist in the given [[Config]] options, the defaults
 * are fallen back to.
 * 
 * @param opts 
 * @param key 
 * @returns Config value
 * @internal
 */
export function getEnv(opts: Config, key: string): any {
  const a = defaults[key as keyof Config] || {}
  const b = opts[key as keyof Config] || {}
  
  return merge(a, b)
}