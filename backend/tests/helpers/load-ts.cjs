/* Loads one TypeScript source file for node:test without a database, network or Jest.
 * Same technique as kg-live-voice.node.test.cjs; shared so new fast-path tests stay short.
 * `modules` maps each runtime require() of the file to a stub. Type-only imports are erased.
 */
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function loadTS(file, modules = {}) {
  const full = path.resolve(__dirname, '..', '..', 'src', file)
  const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    fileName: full,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const output = { exports: {} }
  Function('require', 'module', 'exports', 'Buffer', 'process', js)((name) => {
    if (!(name in modules)) throw new Error('Unmocked dependency: ' + name)
    return modules[name]
  }, output, output.exports, Buffer, process)
  return output.exports
}

module.exports = { loadTS }
