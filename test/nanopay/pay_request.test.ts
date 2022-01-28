import test from 'ava'
import nock from 'nock'
import bsv from 'bsv'
import EventEmitter from 'eventemitter3'
import Nanopay from '../../src/index'
import { PayRequest } from '../../src/nanopay/pay_request'

// load fixtures
import test1 from '../fixtures/payrequest.create.json'
import test2 from '../fixtures/payrequest.error.json'
import test3 from '../fixtures/mapi.pushtx.multi.json'
import test4 from '../fixtures/payrequest.complete.json'

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
  const tx = new bsv.Tx()
  tx.addTxOut(bsv.Bn(10000-22), bsv.Script.fromHex('76a91412ab8dc588ca9d5787dde7eb29569da63c3a238c88ac'))

  const payReq = await nanopay.payRequest.load('pr-1', {
    description: 'Test payment',
    tx
  })

  t.assert(payReq instanceof PayRequest)
  t.deepEqual(payReq.data, test1.data)
  scope.done()
})

test('load(id, params) throws error if params dont match', async (t) => {
  const scope = nock('https://api.nanopay.cash/v1')
    .get('/pay_requests/pr-1')
    .reply(200, test1)

  const nanopay = Nanopay()
  const request = nanopay.payRequest.load('pr-1', {
    description: 'Test payment',
    tx: new bsv.Tx()
  })

  await t.throwsAsync(request, { message: 'Tx does not match' })
  scope.done()
})

test('payRequest instance lifecycle', async (t) => {
  // Setup mocks
  const scope1 = nock('https://api.nanopay.cash/v1')
    .post('/pay_requests')
    .reply(200, test1)

  const scope2 = nock('https://mapi.taal.com/mapi')
    .post(`/txs`)
    .reply(200, test3)

  const scope3 = nock('https://api.nanopay.cash/v1')
    .post('/pay_requests/pr-1/complete')
    .reply(200, test4)
  
  const nanopay = Nanopay()
  const payReq = await nanopay.payRequest.create({
    description: 'Test payment',
    tx: new bsv.Tx()
  })

  // Create a mockWidget
  const mockWidget = new EventEmitter()
  // @ts-ignore - we know it's not a real widget
  payReq.onWidget(mockWidget)

  t.is(payReq.data.status, 'pending')
  t.falsy(payReq.data.completed_at)

  // Create promises the resolve on lifecycle events
  const fundedEvent = new Promise(resolve => payReq.on('funded', resolve))
  const successEvent = new Promise(resolve => payReq.on('success', resolve))
  const completedEvent = new Promise(resolve => payReq.on('completed', resolve))

  // Trigger the lifecycle
  mockWidget.emit('pr.funded', {
    id: 'pr-1',
    txin: '67036507eb354a0a34ae0a2ac1edede00f386ee706b38ec5dfaab73ae8ac87b2050000006b483045022100b9b583369c0bb92518e8027760467043aad3811a9b7ed8b3a812f580c866c8a902201cc7f82cbccab9dde602b71820f6a81c95a8a4d1d97128955ead1f7f1c6a079c41210263e86816e70b85bd2a02aafe23b4f7412ab0fb48642d21ac693179c48100616cffffffff',
    parent: '010000000abf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e61395c0800006a4730440220628e4668a3470a558da84b8e2a32b903681a83aae03deb9bba0b93d49e0a75b50220273cc4175b097486ef77227c9b60a0634cdc3157a8bb3a5973b14b5d176c4bcf412103b1c7c71c9488649e45181c7f2bcbe630c37a1d573a80b5641e736191719938f1ffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e61395d0800006b483045022100a0904d7ed011a8b1434e3f6475ae50666623a93f218b000503d15cbeb70bf98f022071c7f562de305704b693016b043f727cf73cef75a936403111c4b6487a9967e4412103d20c71ef3f85e695f59667b67d2172ab81303c8608b6c177535c305742dbcc91ffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e61395e0800006b483045022100a94c4e06c298b346f47c0a36b2610e90e9b0a0c169f96ba095ce75b5e55dc94402206f2f0b475b7d5269c6fece5d8e23f05a6a5c9019eefb3e6d80cea6d4b10b5dba412103b8d626f9679ac8300c31df5c1d93cae50a405bb9ae2306ee43f4ee65175eb377ffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e61395f0800006b4830450221008f33b0ae6ed0754b65914e597cbe3ab5da556deef3fb02ba51e52ae3a28af22a0220418e8a16574d3e0c642bca3aea033d320ccceb5c2c065d83b6174359c465ae4941210241560c5f7eaf933e5651e0b9039c0d073cbfb38a683e96c60fc4dc512ec5553fffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e6139600800006a47304402206e4ea65299b3d22f858a07c325993faabac3149e18a792ba7056ba2b5c4d8ba102206a719c3ea0ea24c4b29a7803ff9b70feed19dcbf52cdd2c3dd573d6c29c81854412103f691bed8cdedfdb5de70282a9b75d2e294572b3ddf2811e659a674b6a8328cb7ffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e6139610800006a473044022039ae874cfeeaa99252e9b2b8c46ac269f2187cd9aa87d0846329c6c85f61d7ed02204292c97e179c8f02bac791ff1db01d48ca5e47e67a552f4c3a2d6e5776f6d7664121035b6b3cabb07601a61528b5b5747fb1a30b7e078e1bb1390301f4d2ac525d63c1ffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e6139620800006b483045022100be112ad2654767721b2f4b2137084f4de42204aca614554bdb163d2774922a260220170da31d21b47885b1c7862c28876983d8c5b2c33e04cd09b4e868937ffc61e741210333f902caed2a5ce787eb4ccc634bc3b8e8f3302c9f2766fd9d788c32f40a5b5cffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e6139630800006b483045022100c1cbf71287e31cf5a9baebe70b994570d9f94a5e58afe58afda22d29f95232e202203bdd1e165cd8fbd9963fb4e058c0cbf77dd7f08d1c794dce57506917b968dab5412103ea3ae791b0e1552ce3db31c33ad8ffd2979f08fe142d7f5d4287db44c1661626ffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e6139640800006a4730440220754830e39009cd70770b4267259fc43f236960da633c04eb37ebbef0768ad25c02200aa9c1b1cfcacc5716fa3d8e453b9adfbab2ff33cb56bb2c845010f0516179b8412103d1ae3d10e12cacdadd4efaf20dcf4d7f8db483ccfbd1574d35de78bab9ef96dcffffffffbf221eb92b22f6ec2a1264c923bbd308985b9f692a6e85b5926e85d9dc2e6139650800006b483045022100bad6923873789d0b9ce7759c4edaa3360c3bff60a1d02398484203cc513e809402206b4bc5888c22ad56478aac4ceecf214207f37bf237abd65d9efa8f5a601455794121034ef51c12f38adfd0f72bd9d2854497c55ea7ecc0379d725acdd7002728e063ebffffffff08bc020000000000001976a914cee29ea4c7eb35dcebb5af12a6a2a728640452f888acbc020000000000001976a914a2c1c380d9b6b73952fb5344e92f5a407a46d55188acbc020000000000001976a914c95c6b45df04cab7102dbbbcabdcc138d74e71a488acbc020000000000001976a914efcf4a283388d8986f0fa42ffba66563b0c48c7888acbc020000000000001976a914b3c975e1a5398b28f25743209e4f6e581c96a6c588acbc020000000000001976a9144a2f25964e9ec1931ebb519d848f4c9a2f9d99d388acbc020000000000001976a9143abd5a8f2601ab1f421ee2ca4a629372e0ec3a9288acc3040000000000001976a914a45d663f7ca3cf9155739625edcef119bfcdd7bb88ac00000000'
  })

  await t.notThrowsAsync(fundedEvent)
  await t.notThrowsAsync(successEvent)
  await t.notThrowsAsync(completedEvent)

  t.assert(payReq.mapi)
  t.is(payReq.data.status, 'completed')
  t.truthy(payReq.data.completed_at)

  scope1.done()
  scope2.done()
  scope3.done()
})