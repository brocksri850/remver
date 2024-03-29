const { test } = require('tap')
const RemVer = require('../../classes/remver.js')
const increments = require('../fixtures/increments.js')
const comparisons = require('../fixtures/comparisons.js')
const equality = require('../fixtures/equality.js')
const invalidVersions = require('../fixtures/invalid-versions.js')

test('comparisons', t => {
  t.plan(comparisons.length)
  comparisons.forEach(([v0, v1, opt]) => t.test(`${v0} ${v1}`, t => {
    const s0 = new RemVer(v0, opt)
    const s1 = new RemVer(v1, opt)
    t.equal(s0.compare(s1), 1)
    t.equal(s0.compare(v1), 1)
    t.equal(s1.compare(s0), -1)
    t.equal(s1.compare(v0), -1)
    t.equal(s0.compare(v0), 0)
    t.equal(s1.compare(v1), 0)
    t.end()
  }))
})

test('equality', t => {
  t.plan(equality.length)
  equality.forEach(([v0, v1, loose]) => t.test(`${v0} ${v1} ${loose}`, t => {
    const s0 = new RemVer(v0, loose)
    const s1 = new RemVer(v1, loose)
    t.equal(s0.compare(s1), 0)
    t.equal(s1.compare(s0), 0)
    t.equal(s0.compare(v1), 0)
    t.equal(s1.compare(v0), 0)
    t.equal(s0.compare(s0), 0)
    t.equal(s1.compare(s1), 0)
    t.equal(s0.comparePre(s1), 0, 'comparePre just to hit that code path')
    t.end()
  }))
})

test('toString equals parsed version', t => {
  t.equal(String(new RemVer('v1.2.3')), '1.2.3')
  t.end()
})

test('throws when presented with garbage', t => {
  t.plan(invalidVersions.length)
  invalidVersions.forEach(([v, msg, opts]) =>
    t.throws(() => new RemVer(v, opts), msg))
})

test('return RemVer arg to ctor if options match', t => {
  const s = new RemVer('1.2.3', { loose: true, includePrerelease: true })
  t.equal(new RemVer(s, { loose: true, includePrerelease: true }), s,
    'get same object when options match')
  t.not(new RemVer(s), s, 'get new object when options match')
  t.end()
})

test('really big numeric prerelease value', (t) => {
  const r = new RemVer(`1.2.3-beta.${Number.MAX_SAFE_INTEGER}0`)
  t.strictSame(r.prerelease, ['beta', '90071992547409910'])
  t.end()
})

test('invalid version numbers', (t) => {
  ['1.2.3.4', 'NOT VALID', 1.2, null, 'Infinity.NaN.Infinity'].forEach((v) => {
    t.throws(
      () => {
        new RemVer(v) // eslint-disable-line no-new
      },
      {
        name: 'TypeError',
        message:
          typeof v === 'string'
            ? `Invalid Version: ${v}`
            : `Invalid version. Must be a string. Got type "${typeof v}".`,
      }
    )
  })

  t.end()
})

test('incrementing', t => {
  t.plan(increments.length)
  increments.forEach(([
    version,
    inc,
    expect,
    options,
    id,
    base,
  ]) => t.test(`${version} ${inc} ${id || ''}`.trim(), t => {
    if (expect === null) {
      t.plan(1)
      t.throws(() => new RemVer(version, options).inc(inc, id, base))
    } else {
      t.plan(2)
      const incremented = new RemVer(version, options).inc(inc, id, base)
      t.equal(incremented.version, expect)
      if (incremented.build.length) {
        t.equal(incremented.raw, `${expect}+${incremented.build.join('.')}`)
      } else {
        t.equal(incremented.raw, expect)
      }
    }
  }))
})

test('compare main vs pre', (t) => {
  const s = new RemVer('1.2.3')
  t.equal(s.compareMain('2.3.4'), -1)
  t.equal(s.compareMain('1.2.4'), -1)
  t.equal(s.compareMain('0.1.2'), 1)
  t.equal(s.compareMain('1.2.2'), 1)
  t.equal(s.compareMain('1.2.3-pre'), 0)

  const p = new RemVer('1.2.3-alpha.0.pr.1')
  t.equal(p.comparePre('9.9.9-alpha.0.pr.1'), 0)
  t.equal(p.comparePre('1.2.3'), -1)
  t.equal(p.comparePre('1.2.3-alpha.0.pr.2'), -1)
  t.equal(p.comparePre('1.2.3-alpha.0.2'), 1)

  t.end()
})

test('compareBuild', (t) => {
  const noBuild = new RemVer('1.0.0')
  const build0 = new RemVer('1.0.0+0')
  const build1 = new RemVer('1.0.0+1')
  const build10 = new RemVer('1.0.0+1.0')
  t.equal(noBuild.compareBuild(build0), -1)
  t.equal(build0.compareBuild(build0), 0)
  t.equal(build0.compareBuild(noBuild), 1)

  t.equal(build0.compareBuild('1.0.0+0.0'), -1)
  t.equal(build0.compareBuild(build1), -1)
  t.equal(build1.compareBuild(build0), 1)
  t.equal(build10.compareBuild(build1), 1)

  t.end()
})
