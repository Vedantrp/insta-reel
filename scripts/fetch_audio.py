#!/usr/bin/env python3
"""
fetch_audio.py
Resilient multi-tier audio downloader for Cloud Runners (GitHub Actions & Local).
Bypasses YouTube bot-guard and datacenter IP blocks using official label CDN streams
with automatic yt-dlp mobile client fallbacks.
"""

import sys, os, subprocess, json, urllib.request, urllib.parse, base64

def download_via_saavn(query, output_path):
    print(f"[*] [Tier 1] Querying Studio Music CDN for: {query}")
    try:
        from Crypto.Cipher import DES
    except ImportError:
        print("[!] pycryptodome not installed, skipping Tier 1")
        return False

    try:
        q_enc = urllib.parse.quote(query)
        search_url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query={q_enc}"
        req = urllib.request.Request(search_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            songs = data.get("songs", {}).get("data", [])
            if not songs:
                print("[!] Song not found on CDN search")
                return False
            pid = songs[0].get("id")
            title = songs[0].get("title")

        detail_url = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={pid}&_format=json"
        req = urllib.request.Request(detail_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            enc_url = data.get(pid, {}).get("encrypted_media_url")
            if not enc_url:
                print("[!] Encrypted media URL missing")
                return False

        # DES ECB decrypt using key 38346591
        des = DES.new(b"38346591", DES.MODE_ECB)
        dec = des.decrypt(base64.b64decode(enc_url))
        pad_len = dec[-1]
        raw_url = dec[:-pad_len].decode("utf-8")
        # Prefer highest quality 320kbps
        high_url = raw_url.replace("_96.mp4", "_320.mp4").replace("_160.mp4", "_320.mp4")

        print(f"[+] Found studio master: '{title}' -> downloading direct from CDN...")
        # Download and transcode to MP3 320k
        cmd = [
            "ffmpeg", "-y",
            "-i", high_url,
            "-c:a", "libmp3lame",
            "-b:a", "320k",
            output_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 100000:
            print(f"[SUCCESS] Downloaded studio audio ({os.path.getsize(output_path) / 1024 / 1024:.2f} MB)")
            return True
        else:
            print("[!] FFmpeg download from CDN failed")
            return False
    except Exception as e:
        print(f"[!] Tier 1 CDN error: {e}")
        return False

def download_via_ytdlp(query, output_path):
    print(f"[*] [Tier 2 Fallback] Querying yt-dlp with mobile iOS/Android client...")
    # Use mobile client args and node JS runtime to bypass YouTube bot detection
    cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--extractor-args", "youtube:player_client=ios,android",
        "--js-runtimes", "node",
        "-o", output_path,
        f"ytsearch1:{query}"
    ]
    res = subprocess.run(cmd)
    if res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 100000:
        print(f"[SUCCESS] Downloaded via yt-dlp fallback ({os.path.getsize(output_path) / 1024 / 1024:.2f} MB)")
        return True
    return False

def fetch_audio(query, output_path):
    # Tier 1: Direct CDN (Never blocked by YouTube, zero bot-checks)
    if download_via_saavn(query, output_path):
        return True

    # Tier 2: Mobile client yt-dlp fallback
    if download_via_ytdlp(query, output_path):
        return True

    raise RuntimeError(f"All download tiers failed for query: '{query}'")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/fetch_audio.py <search_query> <output_mp3>")
        sys.exit(1)
    q = sys.argv[1]
    out = sys.argv[2]
    fetch_audio(q, out)
