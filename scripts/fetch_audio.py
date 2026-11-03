#!/usr/bin/env python3
"""
fetch_audio.py
Resilient multi-tier audio downloader for Cloud Runners (GitHub Actions & Local).
Bypasses YouTube bot-guard and datacenter IP blocks using official label CDN streams
with automatic yt-dlp mobile client fallbacks.
"""

import sys, os, subprocess, json, urllib.request, urllib.parse, base64, re

def get_search_candidates(query, title=None, artist=None):
    cands = []
    
    if title:
        clean_title = re.sub(r'[\(\)\[\]·,]', ' ', title).strip()
        artists = [a.strip() for a in re.split(r'[,·]', artist or '') if a.strip()]
        if artists:
            cands.append(f"{clean_title} {artists[0]}")
            if len(artists) > 1:
                cands.append(f"{clean_title} {artists[1]}")
        cands.append(clean_title)

    # Clean query from noise words
    c_query = re.sub(r'(?i)\b(official\s+audio|official\s+video|official\s+song|official|audio|video|song|full)\b', '', query)
    c_query = re.sub(r'[\(\)\[\]·,]', ' ', c_query).strip()
    cands.append(c_query)
    cands.append(query)

    # Deduplicate preserving order
    seen = set()
    result = []
    for c in cands:
        norm = re.sub(r'\s+', ' ', c).strip()
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            result.append(norm)
    return result

def download_via_saavn(query, output_path, title=None, artist=None):
    try:
        from Crypto.Cipher import DES
    except ImportError:
        print("[!] pycryptodome not installed, skipping Tier 1")
        return False

    candidates = get_search_candidates(query, title, artist)
    target_clean_title = re.sub(r'[^\w\s]', '', title or '').lower().strip()

    for cand in candidates:
        print(f"[*] [Tier 1] Querying Studio Music CDN for candidate: '{cand}'")
        try:
            q_enc = urllib.parse.quote(cand)
            search_url = f"https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query={q_enc}"
            req = urllib.request.Request(search_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                songs = data.get("songs", {}).get("data", [])
                if not songs:
                    continue

                # Find best matching song
                selected_song = None
                if target_clean_title:
                    for s in songs:
                        s_title = re.sub(r'&quot;|[^\w\s]', '', s.get("title", "")).lower()
                        if target_clean_title in s_title or s_title in target_clean_title:
                            selected_song = s
                            break
                if not selected_song:
                    selected_song = songs[0]

                pid = selected_song.get("id")
                song_title = selected_song.get("title")

            if not pid:
                continue

            detail_url = f"https://www.jiosaavn.com/api.php?__call=song.getDetails&pids={pid}&_format=json"
            req = urllib.request.Request(detail_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                enc_url = data.get(pid, {}).get("encrypted_media_url")
                if not enc_url:
                    continue

            # DES ECB decrypt using key 38346591
            des = DES.new(b"38346591", DES.MODE_ECB)
            dec = des.decrypt(base64.b64decode(enc_url))
            pad_len = dec[-1]
            raw_url = dec[:-pad_len].decode("utf-8")
            high_url = raw_url.replace("_96.mp4", "_320.mp4").replace("_160.mp4", "_320.mp4")

            print(f"[+] Found studio master: '{song_title}' -> downloading direct from CDN...")
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
        except Exception as e:
            print(f"[!] CDN candidate '{cand}' error: {e}")
            continue

    print("[!] Song not found on CDN search across all candidates")
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

def fetch_audio(query, output_path, title=None, artist=None):
    # Tier 1: Direct CDN (Never blocked by YouTube, zero bot-checks)
    if download_via_saavn(query, output_path, title, artist):
        return True

    # Tier 2: Mobile client yt-dlp fallback
    if download_via_ytdlp(query, output_path):
        return True

    raise RuntimeError(f"All download tiers failed for query: '{query}'")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/fetch_audio.py <search_query> <output_mp3> [title] [artist]")
        sys.exit(1)
    q = sys.argv[1]
    out = sys.argv[2]
    t = sys.argv[3] if len(sys.argv) > 3 else None
    a = sys.argv[4] if len(sys.argv) > 4 else None
    fetch_audio(q, out, t, a)
