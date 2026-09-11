#!/usr/bin/env python3
"""Sample script for Infra syntax-highlight demos in BMAD Browser."""

from pathlib import Path


def list_prds(root: Path) -> list[str]:
    prds = root / "_bmad-output" / "planning-artifacts" / "prds"
    if not prds.is_dir():
        return []
    return sorted(p.name for p in prds.iterdir() if p.is_dir())


if __name__ == "__main__":
    for name in list_prds(Path.cwd()):
        print(name)
