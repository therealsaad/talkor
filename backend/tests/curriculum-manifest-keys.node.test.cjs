const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')

// JSON.parse silently keeps the last of two equal keys, so a bad merge can change a title without any error.
function duplicateKeys(text) {
  const found = []
  const stack = []
  let i = 0
  const readString = () => {
    let out = ''
    i += 1
    while (i < text.length && text[i] !== '"') { if (text[i] === '\\') { out += text[i] + text[i + 1]; i += 2 } else { out += text[i]; i += 1 } }
    i += 1
    return out
  }
  while (i < text.length) {
    const ch = text[i]
    if (ch === '{') { stack.push({ type: 'object', keys: new Set(), expectKey: true }); i += 1 }
    else if (ch === '[') { stack.push({ type: 'array' }); i += 1 }
    else if (ch === '}' || ch === ']') { stack.pop(); i += 1 }
    else if (ch === ',') { const top = stack[stack.length - 1]; if (top && top.type === 'object') top.expectKey = true; i += 1 }
    else if (ch === '"') {
      const top = stack[stack.length - 1]
      const value = readString()
      if (top && top.type === 'object' && top.expectKey) {
        if (top.keys.has(value)) found.push(value)
        top.keys.add(value); top.expectKey = false
      }
    } else i += 1
  }
  return found
}

const manifest = path.resolve(__dirname, '..', 'src', 'curriculum', 'level-design-manifest.json')

test('the detector finds a repeated key and ignores the same key in different objects', () => {
  assert.deepEqual(duplicateKeys('{"a":1,"a":2}'), ['a'])
  assert.deepEqual(duplicateKeys('[{"a":1},{"a":2}]'), [])
  assert.deepEqual(duplicateKeys('{"a":"a","b":{"a":1}}'), [])
})

test('the level design manifest has no repeated keys, so no title is silently overwritten', () => {
  assert.deepEqual(duplicateKeys(fs.readFileSync(manifest, 'utf8')), [])
})

test('Class 1 Level 1 keeps the First Day title', () => {
  const level = JSON.parse(fs.readFileSync(manifest, 'utf8')).find((entry) => entry.id === 'g01-l01')
  assert.equal(level.title, 'My First Day — School Adventure')
  assert.equal(level.roadmapTitle, 'My First Day — School Adventure', 'matches the authoritative roadmap.ts title')
})
