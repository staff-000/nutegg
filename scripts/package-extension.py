#!/usr/bin/env python3
"""Create a reproducible Chrome ZIP so retrying a release preserves asset bytes."""
from pathlib import Path
import sys
import zipfile

root, output = Path(sys.argv[1]), Path(sys.argv[2])
files = []
for name in ['manifest.json', 'icons', 'src', '_locales', 'dist', 'README.md', 'LICENSE', 'PRIVACY.md']:
    entry = root / name
    if entry.is_file():
        files.append(entry)
    elif entry.is_dir():
        files.extend(path for path in entry.rglob('*') if path.is_file() and '.DS_Store' not in path.name)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        info = zipfile.ZipInfo(file.relative_to(root).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, file.read_bytes())
