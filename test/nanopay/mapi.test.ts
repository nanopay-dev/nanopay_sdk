import test from 'ava'
import nock from 'nock'
import Nanopay from '../../src/index'

// load fixtures
import test1 from '../fixtures/mapi.gettx.json'
import test2 from '../fixtures/mapi.pushtx.single.json'
import test3 from '../fixtures/mapi.pushtx.multi.json'

test('getTx(txid) returns a payload', async (t) => {
  const txid = '6886cd04977d4cd26df3689b2d3c40b13685edb41fcc21c2962c5fc64560acff'
  const scope = nock('https://mapi.taal.com/mapi')
    .get(`/tx/${ txid }`)
    .reply(200, test1)

  const nanopay = Nanopay()
  const payload = await nanopay.mapi.getTx(txid)

  t.is(payload.apiVersion, '1.4.0')
  t.is(payload.txid, txid)
  scope.done()
})

test('pushTx(rawtx) returns a payload', async (t) => {
  const scope = nock('https://mapi.taal.com/mapi')
    .post(`/tx`)
    .reply(200, test2)

  const nanopay = Nanopay()
  const payload = await nanopay.mapi.pushTx('01000000')

  t.is(payload.apiVersion, '1.4.0')
  t.is(payload.txid, 'fed22f5ab54202e2ec39cb745d427fcfff960254cde0cf283493ac545f5737f6')
  scope.done()
})

test('pushTx(rawtx[]) returns a payload', async (t) => {
  const scope = nock('https://mapi.taal.com/mapi')
    .post(`/txs`)
    .reply(200, test3)

  const nanopay = Nanopay()
  const payload = await nanopay.mapi.pushTx(['01000000', '01000000'])

  t.is(payload.apiVersion, '1.4.0')
  t.is(payload.txs!.length, 2)
  scope.done()
})

test('setApi(baseUrl, headers) reconfigures the mapi payload', (t) => {
  const nanopay = Nanopay()
  nanopay.mapi.setApi('http://localhost', {'x-foo': 'bar'})

  t.is(nanopay.mapi['_api'].baseUrl, 'http://localhost')
  t.deepEqual(nanopay.mapi['_api'].headers, {'x-foo': 'bar'})
})