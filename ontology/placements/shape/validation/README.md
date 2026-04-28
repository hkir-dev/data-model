# Placement Spec validator

Runs the SHACL shape in `../placement-spec-shape.ttl` against the JSON-LD examples
in `../examples/` and prints a conformance report for each.

## Usage

```bash
npm install
node validate.js                         # validates every example
node validate.js ../examples/valid-placement.jsonld   # one file
```

Exit code is `0` if every example behaves as expected — i.e. files named
`valid-*.jsonld` conform and `invalid-*.jsonld` don't — otherwise `1`.

## What is checked

The shape encodes the cardinality, datatype and controlled-vocabulary
restrictions from `ontology/placements/placements.ttl`, plus the data-shape
rules from the **Checklist and QA** sheet of the National Placement
Standard spreadsheet:

- complete-record cardinality (every required field present)
- dropdown values come from the controlled SKOS vocab
- no free text in dropdown fields (`sh:nodeKind sh:IRI` + `sh:in`)
- all 11 risk fields populated even when value is "No known risk"
- `placementLocation` is a UK outward postcode prefix (3-4 chars)
- `totalWeeklyCost` between £100 and £100,000 (Warning, not Violation)
- duplicate `childId` across records (cross-record pre-pass in this script)

QA-sheet checks that aren't expressible as SHACL Core constraints
(quarter-coverage, spreadsheet column order, semantic preference accuracy)
are documented at the top of `placement-spec-shape.ttl`.

## Engine

Uses [`rdf-validate-shacl`](https://www.npmjs.com/package/rdf-validate-shacl).
The same shape file should validate identically under any conformant SHACL
engine (e.g. `pyshacl`, Apache Jena `shacl`); see the verification section in
the implementation plan.
