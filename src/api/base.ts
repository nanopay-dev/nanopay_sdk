import ky from 'ky-universal'

export interface HTTPHeaders {
  [header: string]: string;
}

export class BaseClient {
  baseUrl: string;
  headers?: HTTPHeaders;

  constructor(baseUrl: string, headers?: HTTPHeaders) {
    this.baseUrl = baseUrl
    this.headers = headers
  }

  async get(path: string, headers?: HTTPHeaders): Promise<any> {
    return ky.get(path, { headers, prefixUrl: this.baseUrl }).json()
  }

  async post(path: string, data: any = {}, headers?: HTTPHeaders): Promise<any> {
    return ky.post(path, { headers, json: data, prefixUrl: this.baseUrl}).json()
  }
}
