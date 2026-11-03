#!/usr/bin/env python3
import sys, os, json

def make_stanza_from_lines(start, end, line1, line2):
    w1 = [w.strip() for w in line1.strip().split() if w.strip()]
    w2 = [w.strip() for w in line2.strip().split() if w.strip()]
    total_words = len(w1) + len(w2)
    if total_words == 0:
        return None
    duration = end - start
    line1_dur = duration * (len(w1) / total_words) * 0.94
    line2_dur = duration * (len(w2) / total_words) * 0.94
    pause = (duration - line1_dur - line2_dur) / 2
    
    l1_words = []
    step1 = line1_dur / max(1, len(w1))
    for i, w in enumerate(w1):
        ws = round(start + i * step1, 2)
        we = round(ws + step1 * 0.92, 2)
        l1_words.append({"w": w, "s": ws, "e": we})
        
    l2_words = []
    l2_start = start + line1_dur + pause
    step2 = line2_dur / max(1, len(w2))
    for i, w in enumerate(w2):
        ws = round(l2_start + i * step2, 2)
        we = round(ws + step2 * 0.92, 2)
        l2_words.append({"w": w, "s": ws, "e": we})
        
    return {
        "start": start,
        "end": end,
        "lines": [
            {"words": l1_words},
            {"words": l2_words}
        ]
    }

def build_reel_config(meta_file, words_file, out_config_file="reel_config.json"):
    with open(meta_file, "r", encoding="utf-8") as f:
        meta = json.load(f)

    words_data = {"words": []}
    if os.path.exists(words_file):
        try:
            with open(words_file, "r", encoding="utf-8") as f:
                words_data = json.load(f)
        except Exception:
            pass

    all_words = words_data.get("words", [])

    # If custom scene config is already provided in meta, merge it
    custom_s1 = meta.get("scene1")
    custom_s2 = meta.get("scene2")
    custom_s3 = meta.get("scene3")
    custom_s4 = meta.get("scene4")

    # 1. Scene 1 Stanzas generation (0s to ~13.5s)
    stanzas = []
    
    # Priority 1: Explicit stanzas with word timings
    if custom_s1 and "stanzas" in custom_s1 and len(custom_s1["stanzas"]) > 0:
        stanzas = custom_s1["stanzas"]
    # Priority 2: Curated 2-line stanzas text from scene1
    elif custom_s1 and "stanzas_text" in custom_s1 and len(custom_s1["stanzas_text"]) > 0:
        for st in custom_s1["stanzas_text"]:
            s_obj = make_stanza_from_lines(st.get("start", 0.5), st.get("end", 6.5), st.get("line1", ""), st.get("line2", ""))
            if s_obj:
                stanzas.append(s_obj)
    # Priority 3: Curated 2-line stanzas text from meta root
    elif "stanzas_text" in meta and len(meta["stanzas_text"]) > 0:
        for st in meta["stanzas_text"]:
            s_obj = make_stanza_from_lines(st.get("start", 0.5), st.get("end", 6.5), st.get("line1", ""), st.get("line2", ""))
            if s_obj:
                stanzas.append(s_obj)
    # Priority 4: ASR word alignment fallbacks
    else:
        s1_words = [w for w in all_words if w["start"] < 13.5]
        if len(s1_words) > 0:
            chunk_size = 6
            for i in range(0, len(s1_words), chunk_size):
                chunk = s1_words[i:i + chunk_size]
                subline1_words = chunk[:len(chunk)//2 + (len(chunk)%2)]
                subline2_words = chunk[len(chunk)//2 + (len(chunk)%2):]
                
                lines = []
                if subline1_words:
                    lines.append({"words": [{"w": w["word"], "s": w["start"], "e": w["end"]} for w in subline1_words]})
                if subline2_words:
                    lines.append({"words": [{"w": w["word"], "s": w["start"], "e": w["end"]} for w in subline2_words]})

                stanza_start = chunk[0]["start"]
                stanza_end = chunk[-1]["end"]
                stanzas.append({
                    "start": stanza_start,
                    "end": stanza_end,
                    "lines": lines
                })
        else:
            # Fallback lyrical stanza using song title & artist
            stanzas = [
                {
                    "start": 0.5,
                    "end": 6.5,
                    "lines": [
                        { "words": [{ "w": meta.get("title", "Song"), "s": 0.5, "e": 3.0 }] },
                        { "words": [{ "w": meta.get("artist", "Artist"), "s": 3.2, "e": 6.0 }] }
                    ]
                }
            ]

    # 2. Scene 2 (Editorial Motif + 4-Tier Typography Lockup) (13.5s -> 22.0s)
    s2 = custom_s2 or {}
    if not s2:
        title_lower = meta.get("title", "Song").lower()
        title_upper = meta.get("title", "SONG").upper()
        s2 = {
            "start": 13.5,
            "end": 22.0,
            "line1": { "text": meta.get("hook1", title_lower), "start": 13.5, "end": 15.5 },
            "line2": { "text": meta.get("hook2", title_upper), "start": 15.5, "end": 18.0 },
            "line3": { "text": meta.get("hook3", title_lower), "start": 18.0, "end": 20.0 },
            "line4": { "text": meta.get("hook4", title_lower), "start": 20.0, "end": 22.5 }
        }

    # 3. Scene 3 (Kinetic Drop) (22.0s -> 27.5s)
    s3 = custom_s3 or {
        "start": 22.0,
        "end": 27.5,
        "line1": meta.get("drop_line1", meta.get("title", "DROP LINE 1")),
        "line2": meta.get("drop_line2", meta.get("artist", "DROP LINE 2").upper())
    }

    # 4. Scene 4 (3D Chrome Hero Title & Spotify Capsule) (27.5s -> 33.0s)
    s4 = custom_s4 or {
        "start": 27.5,
        "end": 33.0,
        "heroTitle": meta.get("hero_title", meta.get("title", "HERO TITLE")).upper(),
        "subtitle": meta.get("subtitle", f"{meta.get('title', '')} · {meta.get('artist', '')}"),
        "pillBadge": f"{meta.get('artist', 'Artist')} · {meta.get('title', 'Song')}"
    }

    config = {
        "title": meta.get("title", "Song Title"),
        "artist": meta.get("artist", "Artist"),
        "albumCover": meta.get("albumCover", "album_cover.jpg"),
        "symbolName": meta.get("symbolName", "butterfly"),
        "particleType": meta.get("particleType", "fireflies"),
        "palette": meta.get("palette", {
            "gradientTop": "rgba(82, 18, 48, 0.95)",
            "gradientMid": "#28081a",
            "gradientDark": "#12030d",
            "gradientBottom": "#060105",
            "accentPink": "#ff2a85",
            "accentLight": "#ffa6d2",
            "accentGlow": "#ff0055"
        }),
        "scene1": {
            "duration": 13.5,
            "stanzas": stanzas
        },
        "scene2": s2,
        "scene3": s3,
        "scene4": s4
    }

    with open(out_config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"[+] Reel config generated: {out_config_file}")
    return config

if __name__ == "__main__":
    m = sys.argv[1] if len(sys.argv) > 1 else "song_meta.json"
    w = sys.argv[2] if len(sys.argv) > 2 else "words.json"
    out = sys.argv[3] if len(sys.argv) > 3 else "reel_config.json"
    build_reel_config(m, w, out)
