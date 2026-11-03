import json

with open("songs_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

for s in queue:
    print("=" * 60)
    print(f"ID: {s.get('id')} | Title: {s.get('title')} | Chorus: {s.get('chorus_start')}")
    print(f"Status: {s.get('status')}")
    print(f"Hooks: 1='{s.get('hook1')}' 2='{s.get('hook2')}' 3='{s.get('hook3')}' 4='{s.get('hook4')}'")
    print(f"Drop: 1='{s.get('drop_line1')}' 2='{s.get('drop_line2')}'")
    print(f"Hero: '{s.get('hero_title')}' | Subtitle: '{s.get('subtitle')}'")
    if "scene1" in s and "stanzas" in s["scene1"]:
        print(f"Scene 1 explicit stanzas: {len(s['scene1']['stanzas'])}")
        for st in s["scene1"]["stanzas"]:
            words_list = []
            for line in st.get("lines", []):
                words_list.append(" ".join([w["w"] for w in line.get("words", [])]))
            print(f"  [{st.get('start')}s - {st.get('end')}s] {' / '.join(words_list)}")
    elif "stanzas_text" in s:
        print(f"Stanzas text: {len(s['stanzas_text'])}")
        for st in s["stanzas_text"]:
            print(f"  [{st.get('start')}s - {st.get('end')}s] {st.get('line1')} / {st.get('line2')}")
    else:
        print("  NO SCENE 1 STANZAS SPECIFIED (uses Whisper)")

