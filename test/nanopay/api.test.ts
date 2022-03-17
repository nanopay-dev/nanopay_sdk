import test from 'ava'
import nock from 'nock'
import Nanopay from '../../src/index'

// load fixtures
import test1 from '../fixtures/payrequest.create.json'
import test2 from '../fixtures/payrequest.error.json'
import test3 from '../fixtures/payrequest.notfound.json'

test('createPayRequest(params) with valid params returns a pay request data', async (t) => {
  const scope = nock('https://www.nanopay.cash/api/v1')
    .post('/pay_requests')
    .reply(200, test1)

  const nanopay = Nanopay()
  // @ts-ignore - assume valid params as request mocked
  const data = await nanopay.api.createPayRequest({})

  t.deepEqual(data, test1.data)
  scope.done()
})

test('createPayRequest(params) with invalid params throws an error', async (t) => {
  const scope = nock('https://www.nanopay.cash/api/v1')
    .post('/pay_requests')
    .reply(200, test2)

  const nanopay = Nanopay()
  // @ts-ignore - assume invalid params as request mocked
  const { errors } = await t.throwsAsync(nanopay.api.createPayRequest({}), {
    message: 'Invalid Pay Request'
  })

  t.is(errors.description[0], 'can\'t be blank')
  scope.done()
})

test('loadPayRequest(id) with known id returns a pay request data', async (t) => {
  const scope = nock('https://www.nanopay.cash/api/v1')
    .get('/pay_requests/pr-1')
    .reply(200, test1)
  
  const nanopay = Nanopay()
  const data = await nanopay.api.loadPayRequest('pr-1')

  t.deepEqual(data, test1.data)
  scope.done()
})

test('loadPayRequest(id) with unknown id throws an error', async (t) => {
  const scope = nock('https://www.nanopay.cash/api/v1')
    .get('/pay_requests/pr-xxx')
    .reply(404, test3)
  
  const nanopay = Nanopay()
  await t.throwsAsync(nanopay.api.loadPayRequest('pr-xxx'), {
    message: 'Request failed with status code 404'
  })

  scope.done()
})