import json

with open("songs_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

print(f"Total songs: {len(queue)}")
for i, s in enumerate(queue):
    sid = s.get("id")
    st = s.get("status")
    tit = s.get("title")
    cs = s.get("chorus_start")
    print(f"{i+1:2d}. id={sid:<20} status={st:<12} title={tit:<30} chorus_start={cs}")

