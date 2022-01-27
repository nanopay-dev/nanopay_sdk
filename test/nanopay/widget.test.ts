import test from 'ava'
import nock from 'nock'
import browserEnv from '@ikscodes/browser-env'
import Nanopay from '../../src/index'

// Fake browser env
browserEnv(['window'])

const mock = {
  toWidget: () => '/widget'
}

test('open(Widgetable) and close() adds and removes widget UI from DOM', async (t) => {
  const scope = nock('https://www.nanopay.com')
    .get('/widget')
    .reply(200, '<p>Test widget</p>')

  const nanopay = Nanopay()
  const widget = await nanopay.widget.open(mock)
  const el: any = window.document.querySelector('div > div > iframe')

  t.is(el, widget.$iframe)
  t.is(el.contentWindow.document.body.innerHTML, '<p>Test widget</p>')

  await nanopay.widget.close()

  t.falsy(window.document.querySelector('div > div > iframe'))
  t.falsy(nanopay.widget['_widget'])

  scope.done()
})