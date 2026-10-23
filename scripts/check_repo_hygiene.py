"""Fail CI if local databases, generated indexes, bytecode, or secrets are tracked."""
from pathlib import PurePosixPath
import subprocess
import sys


tracked = subprocess.run(
    ["git", "ls-files", "-z"], check=True, capture_output=True
).stdout.decode().split("\0")
violations = []

for name in filter(None, tracked):
    path = PurePosixPath(name)
    parts = path.parts
    if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
        violations.append(f"environment/secret file: {name}")
    if path.name.endswith((".sqlite3", ".db")):
        violations.append(f"local database: {name}")
    if "chroma_db" in parts:
        violations.append(f"generated retrieval index: {name}")
    if "__pycache__" in parts or path.suffix in {".pyc", ".pyo"}:
        violations.append(f"Python bytecode: {name}")

if violations:
    print("Repository hygiene check failed:", file=sys.stderr)
    print("\n".join(f" - {item}" for item in violations), file=sys.stderr)
    sys.exit(1)

print(f"Repository hygiene check passed ({len(list(filter(None, tracked)))} tracked paths).")
