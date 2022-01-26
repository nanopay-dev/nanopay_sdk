import test from 'ava'
import { getEnv } from '../../src/nanopay/config'

test('getEnv(config, key) finds opts by key and merges with defaults', (t) => {
  const api = getEnv({ api: { baseUrl: 'http://google.com' } }, 'api')
  const mapi = getEnv({ api: { baseUrl: 'http://google.com' } }, 'mapi')

  t.is(api.baseUrl, 'http://google.com')
  t.is(mapi.baseUrl, 'https://mapi.taal.com/mapi')
})