# 🎬 Aesthetic Lyric Reels Automation (100% Free on GitHub Actions)

Autonomous, daily 1080×1920 (9:16) motion-design lyric reel generator powered by:
- **Spotify 3D Glassmorphism Player Card** with real-time word-level karaoke glowing highlights
- **Thematic Procedural Vector Neon Motifs** tailored to lyrics (`butterfly`, `crescent_moon`, `infinity_heart`, `flame`, `lotus`, `rose`) with audio-reactive beat bloom
- **4-Tier Editorial Typography** (*Playfair Display Italic*, *Syne Uppercase*, *Great Vibes Script*)
- **3D Metallic Chrome Hero Title** with anamorphic specular lens flares
- **Dynamic Atmospheric Particle Systems** (`fireflies`, `stardust`, `embers`, `petals`)
- **Faster-Whisper Word Alignment** & Headless Chrome frame-by-frame CDP render

---

## ⚡ Zero Budget Architecture ($0 Cost)

This entire pipeline runs completely **free of cost** on **GitHub Actions** (using free cloud Ubuntu runners):
- **Free Compute**: Uses GitHub Actions free tier (2,000 minutes/month for private repos, **unlimited** for public repos). 5 daily reels take ~10-12 minutes per day.
- **No Third-Party Subscriptions**: Uses `yt-dlp` for official audio, iTunes Search API for 1024×1024 official cover art, open-source `faster-whisper` for word alignment, and Headless Chrome for canvas rendering.
- **Automated Delivery**: Generated reels are automatically published as **GitHub Releases** and **GitHub Artifacts** every single day for 1-click download directly on your phone or PC.
- **Auto Queue Management**: GitHub Actions automatically commits and updates `songs_queue.json` after every run so songs never repeat.

---

## 🚀 How to Set Up (One-Time Setup in 2 Minutes)

### Step 1: Initialize Git and Push to GitHub

In your project folder, run:

```bash
git init
git add .
git commit -m "Initial commit: Aesthetic lyric reels automation"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

*(You can make the repo **Public** for unlimited free Actions minutes, or **Private** with 2,000 free minutes/month).*

---

### Step 2: Enable GitHub Actions Workflow Permissions

To allow the automated runner to commit updated queue states and publish releases:
1. Go to your GitHub repository -> **Settings** -> **Actions** -> **General**.
2. Scroll to **Workflow permissions**.
3. Select **"Read and write permissions"**.
4. Check **"Allow GitHub Actions to create and approve pull requests"**.
5. Click **Save**.

---

## ⏰ How the Automation Runs

1. **Daily Automatic Schedule**:
   - The workflow automatically triggers every day at `04:00 UTC` (`09:30 AM IST`).
   - It picks the next 5 `pending` songs from `songs_queue.json`.
   - Renders each 1080×1920 reel with 320k AAC audio.
   - Publishes a new **GitHub Release** (`Reels-YYYY-MM-DD`) with all 5 MP4 files ready for download.
   - Marks those 5 songs as `completed` in `songs_queue.json` and pushes the commit.

2. **Manual 1-Click Trigger (Run Anytime)**:
   - Go to the **Actions** tab in your GitHub repository.
   - Click **"Daily Reels Generator"** in the left sidebar.
   - Click **"Run workflow"** -> enter the desired number of reels (e.g. `1` or `5`) -> click **Run workflow**.

---

## 🎵 Adding More Songs to the Queue

Open `songs_queue.json` and append any song entry:

```json
{
  "id": "chal_ve_watna",
  "title": "Chal Ve Watna",
  "artist": "Arijit Singh · Dunki",
  "search_query": "Chal Ve Watna Arijit Singh Dunki official audio",
  "chorus_start": "00:00:35.00",
  "duration": 33.0,
  "hero_title": "CHAL VE WATNA",
  "symbolName": "butterfly",
  "particleType": "fireflies",
  "palette": {
    "gradientTop": "rgba(75, 30, 20, 0.95)",
    "gradientMid": "#30130b",
    "gradientDark": "#160703",
    "gradientBottom": "#070201",
    "accentPink": "#fb923c",
    "accentLight": "#fed7aa",
    "accentGlow": "#ea580c"
  },
  "hook1": "chal ve watna",
  "hook2": "WATNA VE",
  "hook3": "tera deedar",
  "hook4": "watna",
  "drop_line1": "apne watan ki mitti",
  "drop_line2": "YAAD AAYEGI",
  "subtitle": "chal ve watna mere watna...",
  "status": "pending"
}
```

> **Available Thematic Symbols**: `butterfly`, `crescent_moon`, `infinity_heart`, `flame`, `lotus`, `rose`  
> **Available Particle Systems**: `fireflies`, `stardust`, `embers`, `petals`

Commit and push `songs_queue.json`, and the automated cloud runner will process it next!

---

## 💻 Running Locally (Optional)

You can also run the generator on your local machine anytime:

```bash
# Generate 1 test reel
node scripts/daily_batch.js --count 1

# Generate a batch of 5 reels
node scripts/daily_batch.js --count 5

# Force a specific song from queue
node scripts/daily_batch.js --force sajni
```

