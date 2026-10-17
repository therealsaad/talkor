#!/usr/bin/env python3
"""Compatibility launcher for the TypeScript KG voice pipeline.

The TypeScript tool reads the live curriculum manifest, checks the running
Talkora AI service's OpenAPI contract, and uses the backend's existing S3
service. This wrapper intentionally contains no second TTS or AWS config.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ALLOWED = {"--sample", "--all", "--resume", "--dry-run", "--upload", "--verify"}


def main() -> int:
    args = sys.argv[1:]
    if not args or any(arg not in ALLOWED for arg in args):
        print("Use: npm run kg:audio -- --sample | --all [--resume] [--dry-run] | --upload | --verify")
        print("The sample is kept in tmp/kg-level1-audio/sample/ for voice approval.")
        return 2

    if sys.platform == "win32":
        npm = shutil.which("npm.cmd") or shutil.which("npm")
        if not npm:
            print("npm was not found. Install Node.js/npm, then run the documented PowerShell command.", file=sys.stderr)
            return 2
        # args are restricted to the fixed allowlist above before entering cmd.exe.
        command = subprocess.list2cmdline([npm, "run", "kg:audio", "--", *args])
        return subprocess.run(command, cwd=ROOT, shell=True, check=False).returncode

    npm = shutil.which("npm")
    if not npm:
        print("npm was not found.", file=sys.stderr)
        return 2
    return subprocess.run([npm, "run", "kg:audio", "--", *args], cwd=ROOT, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
