import test from 'ava'
import Nanopay from '../src/index'
import { ApiClient } from '../src/nanopay/api'
import { MapiClient } from '../src/nanopay/mapi'
import { PayRequestInterface } from '../src/nanopay/pay_request'
import { WidgetInterface } from '../src/nanopay/widget'

test('Nanopay() returns Nanopay SDK instance', (t) => {
  const nanopay = Nanopay()

  t.true(typeof nanopay.opts === 'object')
  t.true(nanopay.api instanceof ApiClient)
  t.true(nanopay.mapi instanceof MapiClient)
  t.true(nanopay.payRequests instanceof PayRequestInterface)
  t.true(nanopay.widget instanceof WidgetInterface)
})

test('Nanopay(opts) returns Nanopay SDK instance with custom config', (t) => {
  const nanopay = Nanopay({ api: {baseUrl: 'http://foobar.com'}, widget: {origin: 'http://foobar.com'} })

  t.true(typeof nanopay.opts === 'object')
  t.is(nanopay.opts.api!.baseUrl, 'http://foobar.com')
  t.is(nanopay.opts.widget!.origin, 'http://foobar.com')
})