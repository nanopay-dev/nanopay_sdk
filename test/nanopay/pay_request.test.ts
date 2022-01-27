import test from 'ava'
import nock from 'nock'
import bsv from 'bsv'
import Nanopay from '../../src/index'
import { PayRequest } from '../../src/nanopay/pay_request'

// load fixtures
import test1 from '../fixtures/payrequest.create.json'
import test2 from '../fixtures/payrequest.error.json'

test('create(params) creates a new pay request', async (t) => {
  const scope = nock('https://api.nanopay.cash/v1')
    .post('/pay_requests')
    .reply(200, test1)
  
  const nanopay = Nanopay()
  const payReq = await nanopay.payRequest.create({
    description: 'Test payment',
    tx: new bsv.Tx()
  })

  t.assert(payReq instanceof PayRequest)
  t.deepEqual(payReq.data, test1.data)
  scope.done()
})

test('create(params) throws error with invalid description', async (t) => {
  const scope = nock('https://api.nanopay.cash/v1')
    .post('/pay_requests')
    .reply(200, test2)
  
  const nanopay = Nanopay()
  const request = nanopay.payRequest.create({
    description: '',
    tx: new bsv.Tx()
  })
  
  await t.throwsAsync(request, { message: 'Invalid Pay Request' })
  scope.done()
})

test('create(params) throws error with invalid tx', async (t) => {  
  const nanopay = Nanopay()
  const request = nanopay.payRequest.create({
    description: 'Test payment'
  })
  await t.throwsAsync(request, { message: 'Tx not given in params' })
})

test('load(id, params) loads a pay request', async (t) => {
  const scope = nock('https://api.nanopay.cash/v1')
    .get('/pay_requests/pr-1')
    .reply(200, test1)
  
  const nanopay = Nanopay()
  const payReq = await nanopay.payRequest.load('pr-1', {
    description: 'Test payment',
    tx: new bsv.Tx()
  })

  t.assert(payReq instanceof PayRequest)
  t.deepEqual(payReq.data, test1.data)
  scope.done()
})

test.todo('load(id, params) throws error if params dont match')

test.todo('tx is pushed when widget emits pr.funded event')