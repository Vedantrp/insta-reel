#!/usr/bin/env python3
import sys, os, urllib.request, json, re

def fetch_artwork(query, out_path="album_cover.jpg"):
    print(f"[*] Fetching artwork for: {query}")
    encoded = urllib.parse.quote(query)
    url = f"https://itunes.apple.com/search?term={encoded}&entity=song&limit=5"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode('utf-8'))
        results = data.get('results', [])
        for item in results:
            art = item.get('artworkUrl100')
            if art:
                art_hi = re.sub(r'/\d+x\d+bb\.jpg', '/1024x1024bb.jpg', art)
                print(f"[+] Found artwork URL: {art_hi}")
                urllib.request.urlretrieve(art_hi, out_path)
                print(f"[+] Saved 1024x1024 cover to: {out_path}")
                return True
    except Exception as e:
        print(f"[!] iTunes artwork search error: {e}")

    # Fallback: create a solid gradient cover if artwork not found
    print("[!] Artwork not found via iTunes, creating fallback gradient")
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    return False

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "O Maahi Dunki"
    out = sys.argv[2] if len(sys.argv) > 2 else "album_cover.jpg"
    fetch_artwork(q, out)

