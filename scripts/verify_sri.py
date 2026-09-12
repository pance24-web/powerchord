#!/usr/bin/env python3
"""Verify Subresource Integrity hashes for external resources in public HTML."""

import base64
import hashlib
import re
import sys
import urllib.request
from pathlib import Path

LINK_RE = re.compile(
    r'<link\b[^>]*?href=["\'](?P<url>https://[^"\']+)["\'][^>]*>',
    re.IGNORECASE | re.DOTALL,
)
INTEGRITY_RE = re.compile(r'\bintegrity=["\'](?P<integrity>[^"\']+)["\']', re.IGNORECASE)


def expected_hash(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "PowerChord-SRI-Check/1.0"})
    with urllib.request.urlopen(request, timeout=15) as response:
        digest = hashlib.sha384(response.read()).digest()
    return f"sha384-{base64.b64encode(digest).decode('ascii')}"


def main() -> int:
    resources: dict[str, str] = {}
    for html_path in sorted(Path("public").glob("*.html")):
        html = html_path.read_text(encoding="utf-8")
        for match in LINK_RE.finditer(html):
            if "stylesheet" not in match.group(0).lower():
                continue
            url = match.group("url")
            if "integrity=" not in match.group(0).lower():
                print(f"Missing integrity attribute: {html_path}: {url}", file=sys.stderr)
                return 1
            integrity_match = INTEGRITY_RE.search(match.group(0))
            if not integrity_match:
                print(f"Invalid integrity attribute: {html_path}: {url}", file=sys.stderr)
                return 1
            resources.setdefault(url, integrity_match.group("integrity"))
            if resources[url] != integrity_match.group("integrity"):
                print(f"Inconsistent integrity hashes: {url}", file=sys.stderr)
                return 1

    for url, declared_hash in resources.items():
        actual_hash = expected_hash(url)
        if declared_hash != actual_hash:
            print(f"SRI mismatch for {url}: expected {actual_hash}, found {declared_hash}", file=sys.stderr)
            return 1
        print(f"SRI OK: {url}")

    print(f"Verified {len(resources)} external resource(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
