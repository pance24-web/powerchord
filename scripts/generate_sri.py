#!/usr/bin/env python3
"""
Generate SRI (Subresource Integrity) hash untuk external resources.
Usage: python3 scripts/generate_sri.py
"""

import hashlib
import base64
import urllib.request
import ssl
import sys

def generate_sri_hash(url):
    """Fetch resource dari URL dan generate SHA-384 SRI hash."""
    try:
        ctx = ssl.create_default_context()
        response = urllib.request.urlopen(url, context=ctx, timeout=10)
        content = response.read()
        
        # Generate SHA-384 hash
        sha384_hash = hashlib.sha384(content).digest()
        sri_hash = base64.b64encode(sha384_hash).decode('utf-8')
        
        return f"sha384-{sri_hash}", len(content)
    except Exception as e:
        print(f"❌ Error fetching {url}: {e}", file=sys.stderr)
        return None, 0

def main():
    resources = [
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
    ]
    
    print("=" * 80)
    print("SRI HASH GENERATOR")
    print("=" * 80)
    print()
    
    for url in resources:
        print(f"Processing: {url}")
        sri_hash, size = generate_sri_hash(url)
        
        if sri_hash:
            print(f"✅ Success")
            print(f"   Size: {size} bytes")
            print(f"   SRI:  {sri_hash}")
            print()
            print("   HTML tag:")
            print(f'   <link rel="stylesheet"')
            print(f'         href="{url}"')
            print(f'         integrity="{sri_hash}"')
            print(f'         crossorigin="anonymous" />')
        else:
            print(f"❌ Failed to generate hash")
        print()
        print("-" * 80)
        print()

if __name__ == "__main__":
    main()