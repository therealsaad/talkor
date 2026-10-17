'use strict'
/** Syntax and local import existence only; this is NOT a substitute for production builds. */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
let ts
try { ts = require('typescript') }
catch { ts = require(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript')) }
const root = path.resolve(__dirname, '..')
const files = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', '.git'].includes(entry.name)) continue
    const filename = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(filename)
    else if (/\.tsx?$/.test(entry.name)) files.push(filename)
  }
}
walk(path.join(root, 'backend'))
walk(path.join(root, 'client'))
let totalImports = 0
const problems = []
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const tsx = file.endsWith('.tsx')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  for (const diag of sf.parseDiagnostics) problems.push(`${path.relative(root, file)}: ${ts.flattenDiagnosticMessageText(diag.messageText, ' ')}`)
  function visit(node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text
      if (spec.startsWith('.')) {
        totalImports++
        const base = path.resolve(path.dirname(file), spec)
        const candidates = [base, base+'.ts',base+'.tsx',base+'.js',base+'.mjs',base+'.json',
          path.join(base,'index.ts'),path.join(base,'index.tsx'),path.join(base,'index.js')]
        if (!candidates.some((item) => fs.existsSync(item))) {
          // Next.js generates these type declarations during a real Next build.
          if (!(file.endsWith('next-env.d.ts') && spec.includes('.next/types'))) {
            problems.push(`${path.relative(root, file)}: unresolved local import ${spec}`)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}
console.log(`Parsed ${files.length} TypeScript files and checked ${totalImports} relative imports.`)
if (problems.length) {
  for (const problem of problems.slice(0, 30)) console.error('FAIL', problem)
  process.exitCode = 1
} else console.log('PASS: no syntax errors or unresolved relative imports. (No semantic typecheck performed.)')
