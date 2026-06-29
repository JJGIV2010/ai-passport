#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')
const { platform }  = require('os')

const passedArgs = process.argv.slice(2)
// Default: run the full pipeline and open the browser
const cliArgs = passedArgs.length === 0 ? ['run', '--open'] : passedArgs

// ── Find Python 3.10+ ────────────────────────────────────────────────────────
function findPython() {
  const candidates = platform() === 'win32'
    ? ['py', 'python', 'python3']
    : ['python3', 'python']
  for (const cmd of candidates) {
    try {
      const r = spawnSync(cmd, ['--version'], { encoding: 'utf8', timeout: 5000 })
      const versionStr = (r.stdout || '') + (r.stderr || '')
      const m = versionStr.match(/Python (\d+)\.(\d+)/)
      if (m && r.status === 0) {
        const [, major, minor] = m.map(Number)
        if (major > 3 || (major === 3 && minor >= 10)) return cmd
      }
    } catch {}
  }
  return null
}

const python = findPython()
if (!python) {
  console.error(
    '\nError: Python 3.10+ is required.\n' +
    'Install it from https://python.org and try again.\n'
  )
  process.exit(1)
}

// ── Ensure ai-passport pip package is installed ───────────────────────────────
const check = spawnSync(python, ['-c', 'import passport'], { encoding: 'utf8', timeout: 10000 })
if (check.status !== 0) {
  console.log('First run: installing ai-passport Python package…')
  const install = spawnSync(
    python, ['-m', 'pip', 'install', '--quiet', 'ai-passport'],
    { stdio: 'inherit', timeout: 120000 }
  )
  if (install.status !== 0) {
    console.error('\nFailed to install ai-passport. Run manually: pip install ai-passport\n')
    process.exit(1)
  }
}

// ── Check ANTHROPIC_API_KEY for commands that call the API ───────────────────
const needsKey = !cliArgs[0] || cliArgs[0] === 'run' || cliArgs[0] === 'generate'
if (needsKey && !process.env.ANTHROPIC_API_KEY) {
  console.error(
    '\nError: ANTHROPIC_API_KEY is not set.\n\n' +
    'Get your key at https://console.anthropic.com/keys, then set it:\n' +
    '  Mac / Linux:  export ANTHROPIC_API_KEY=sk-ant-...\n' +
    '  Windows PS:   $env:ANTHROPIC_API_KEY="sk-ant-..."\n'
  )
  process.exit(1)
}

// ── Run the CLI via python -m passport ───────────────────────────────────────
const result = spawnSync(python, ['-m', 'passport', ...cliArgs], { stdio: 'inherit' })
process.exit(result.status ?? 1)
