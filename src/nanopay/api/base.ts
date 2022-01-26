/**
 * Base HTTP client module.
 * 
 * @internal
 * @module
 */

import ky from 'ky-universal'

/**
 * HTTP headers used in a request
 */
export interface HTTPHeaders {
  [header: string]: string;
}

/**
 * Base HTTP client.
 * 
 * @internal
 */
export class BaseClient {
  /**
   * Base URL
   */
  baseUrl: string;

  /**
   * HTTP headers object
   */
  headers?: HTTPHeaders;

  /**
   * Creates a new base client using the given `baseUrl` and [[HTTPHeaders]].
   * 
   * @param baseUrl - Base URL
   * @param headers - HTTP headers object
   */
  constructor(baseUrl: string, headers?: HTTPHeaders) {
    this.baseUrl = baseUrl
    this.headers = headers
  }

  /**
   * Fetch the given `path` using a GET request.
   * 
   * @param path 
   * @param headers 
   * @returns 
   */
  async get(path: string, headers?: HTTPHeaders): Promise<any> {
    const res = await ky.get(path, {
      headers: {
        ...this.headers,
        ...headers
      },
      prefixUrl: this.baseUrl
    })

    return res.json()
  }

  /**
   * Fetch the given `path` using a POST request.
   * 
   * @param path 
   * @param data 
   * @param headers 
   * @returns 
   */
  async post(path: string, data: any = {}, headers?: HTTPHeaders): Promise<any> {
    const res = await ky.post(path, {
      headers: {
        ...this.headers,
        ...headers
      },
      json: data,
      prefixUrl: this.baseUrl
    })
    
    return res.json()
  }
}