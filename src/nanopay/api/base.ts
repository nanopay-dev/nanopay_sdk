import ky from 'ky-universal'

/**
 * TODO
 */
export interface HTTPHeaders {
  [header: string]: string;
}

/**
 * TODO
 */
export class BaseClient {
  baseUrl: string;
  headers?: HTTPHeaders;

  /**
   * TODO
   * 
   * @param baseUrl - todo
   * @param headers - todo
   */
  constructor(baseUrl: string, headers?: HTTPHeaders) {
    this.baseUrl = baseUrl
    this.headers = headers
  }

  /**
   * TODO
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
   * TODO
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