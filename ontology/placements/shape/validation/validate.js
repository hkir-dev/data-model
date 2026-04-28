#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const N3 = require('n3')
const jsonld = require('jsonld')
const rdf = require('rdf-ext').default
const SHACLValidator = require('rdf-validate-shacl').default

const SHAPE_FILE = path.resolve(__dirname, '..', 'placement-spec-shape.ttl')
const EXAMPLES_DIR = path.resolve(__dirname, '..', 'examples')
const PL_CHILD_ID = rdf.namedNode('https://socialcaredata.github.io/ontology/placements#childId')

const COLOURS = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m'
}
const c = (col, s) => `${COLOURS[col]}${s}${COLOURS.reset}`

function parseTurtle (text) {
  const quads = new N3.Parser().parse(text)
  return rdf.dataset(quads)
}

function parseNQuads (text) {
  const quads = new N3.Parser({ format: 'application/n-quads' }).parse(text)
  return rdf.dataset(quads)
}

async function loadJsonLDFile (file) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  // Inline the relative @context so jsonld doesn't need a document loader.
  if (typeof doc['@context'] === 'string' && doc['@context'].startsWith('./')) {
    const ctxPath = path.join(path.dirname(file), doc['@context'])
    const ctx = JSON.parse(fs.readFileSync(ctxPath, 'utf8'))
    doc['@context'] = ctx['@context']
  }
  const nquads = await jsonld.toRDF(doc, { format: 'application/n-quads' })
  return parseNQuads(nquads)
}

function listExamples () {
  return fs.readdirSync(EXAMPLES_DIR)
    .filter(f => f.endsWith('.jsonld') && f !== 'context.jsonld')
    .sort()
    .map(f => path.join(EXAMPLES_DIR, f))
}

function summariseResult (r) {
  const sev = r.severity ? r.severity.value.split('#').pop() : 'Violation'
  const path_ = r.path ? r.path.value : '(no path)'
  const focus = r.focusNode ? r.focusNode.value : '(no focus)'
  const msgs = (r.message || []).map(m => m.value).join(' ; ') || '(no message)'
  return { sev, path: path_, focus, msg: msgs }
}

function printReport (file, report) {
  const violations = report.results.filter(r => !r.severity || r.severity.value.endsWith('Violation'))
  const warnings = report.results.filter(r => r.severity && r.severity.value.endsWith('Warning'))

  const verdict = report.conforms
    ? c('green', 'CONFORMS')
    : (violations.length === 0 ? c('yellow', 'WARNINGS ONLY') : c('red', 'NON-CONFORMING'))

  console.log(`\n${c('bold', path.basename(file))}  ->  ${verdict}`)
  console.log(c('dim', `  violations=${violations.length}  warnings=${warnings.length}`))

  for (const r of report.results) {
    const s = summariseResult(r)
    const tag = s.sev === 'Warning' ? c('yellow', '  ! ') : c('red', '  X ')
    console.log(`${tag}[${s.sev}] ${s.path}`)
    console.log(c('dim', `      focus: ${s.focus}`))
    console.log(c('dim', `      ${s.msg}`))
  }
}

// QA cross-record check that SHACL Core can't express:
// duplicate childId across the set of records being validated.
function checkDuplicateChildIds (allDatasets) {
  const seen = new Map()
  for (const { file, dataset } of allDatasets) {
    for (const q of dataset.match(null, PL_CHILD_ID, null)) {
      const id = q.object.value
      if (!seen.has(id)) seen.set(id, [])
      seen.get(id).push(file)
    }
  }
  const dups = [...seen.entries()].filter(([, files]) => files.length > 1)
  if (dups.length === 0) {
    console.log(`\n${c('bold', 'Cross-record check: duplicate childId')}  ->  ${c('green', 'OK')}`)
    return true
  }
  console.log(`\n${c('bold', 'Cross-record check: duplicate childId')}  ->  ${c('red', 'DUPLICATES FOUND')}`)
  for (const [id, files] of dups) {
    console.log(`  ${c('red', 'X')} childId=${id}  in: ${files.map(f => path.basename(f)).join(', ')}`)
  }
  return false
}

async function main () {
  const shapesText = fs.readFileSync(SHAPE_FILE, 'utf8')
  const shapes = parseTurtle(shapesText)
  const validator = new SHACLValidator(shapes)

  const targets = process.argv.length > 2
    ? process.argv.slice(2).map(p => path.resolve(p))
    : listExamples()

  console.log(c('bold', `Validating ${targets.length} example(s) against placement-spec-shape.ttl`))

  let failures = 0
  const allDatasets = []

  for (const file of targets) {
    let dataset
    try {
      dataset = await loadJsonLDFile(file)
    } catch (err) {
      console.error(`\n${c('red', 'ERROR')} loading ${file}: ${err.message}`)
      failures++
      continue
    }
    allDatasets.push({ file, dataset })

    const report = validator.validate(dataset)
    printReport(file, report)

    const isValidExample = path.basename(file).startsWith('valid-')
    if (isValidExample && !report.conforms) failures++
    if (!isValidExample && report.conforms) failures++
  }

  if (!checkDuplicateChildIds(allDatasets)) failures++

  console.log()
  if (failures === 0) {
    console.log(c('green', 'OK - all examples behaved as expected.'))
    process.exit(0)
  } else {
    console.log(c('red', `${failures} example(s) did not match the expected outcome.`))
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
