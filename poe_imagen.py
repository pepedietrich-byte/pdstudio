#!/usr/bin/env python3
"""Generate images via Poe API and save locally."""
import os
import sys
import re
import json
import urllib.request
from pathlib import Path

POE_KEY = "sk-poe-dXzDC9mmwZDIs1AKbUspl9OOy4R5pKZHkYgXlhrZZ0E"

def gen_image(prompt: str, out_path: str, model: str = "FLUX-pro-1.1"):
    print(f"→ {out_path}  [{model}]", flush=True)
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}]
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.poe.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {POE_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  ✗ API error: {e}")
        return None

    content = data["choices"][0]["message"]["content"]
    # Find first poecdn URL — match through query params
    m = re.search(r"https://pfst\.cf2\.poecdn\.net/[^\s)\]]+", content)
    if not m:
        print(f"  ✗ No URL in: {content[:200]}")
        return None
    url = m.group(0)
    print(f"  url: {url[:90]}...")

    # Download with browser-like headers
    try:
        Path(os.path.dirname(out_path)).mkdir(parents=True, exist_ok=True)
        dl_req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://poe.com/",
        })
        with urllib.request.urlopen(dl_req, timeout=60) as r:
            with open(out_path, "wb") as f:
                f.write(r.read())
        size = os.path.getsize(out_path)
        print(f"  ✓ saved {size:,} bytes")
        return out_path
    except Exception as e:
        print(f"  ✗ Download error: {e}")
        return None

if __name__ == "__main__":
    # Read job list from argv
    if len(sys.argv) < 2:
        print("Usage: poe_imagen.py <jobs.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        jobs = json.load(f)

    results = {}
    for job in jobs:
        out = gen_image(job["prompt"], job["out"], job.get("model", "FLUX-pro-1.1"))
        results[job["out"]] = bool(out)

    print("\n=== Summary ===")
    for k, v in results.items():
        print(f"  {'✓' if v else '✗'}  {k}")
