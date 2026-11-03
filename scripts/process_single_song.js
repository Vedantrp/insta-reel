#!/usr/bin/env node
/**
 * process_single_song.js
 * End-to-end automated processor for a single song in the daily queue.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function run(cmd, desc) {
  console.log(`\n==============================================`);
  console.log(`[*] ${desc}`);
  console.log(`[CMD] ${cmd}`);
  console.log(`==============================================`);
  execSync(cmd, { stdio: 'inherit' });
}

async function processSong(song, outputDir = 'output') {
  const songId = song.id || song.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  console.log(`\n======================================================`);
  console.log(`[*] PROCESSING SONG: ${song.title} - ${song.artist}`);
  console.log(`[*] Song ID: ${songId}`);
  console.log(`======================================================`);

  const tmpDir = path.join(os.tmpdir(), `reel_run_${songId}_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const fullAudioPath = path.join(tmpDir, 'full_audio.mp3');
  const clipAudioPath = path.join(tmpDir, 'clip.mp3');
  const coverPath = path.join(tmpDir, 'album_cover.jpg');
  const wordsJsonPath = path.join(tmpDir, 'words.json');
  const songMetaPath = path.join(tmpDir, 'song_meta.json');
  const reelConfigPath = path.join(tmpDir, 'reel_config.json');

  const finalOutputMp4 = path.resolve(path.join(outputDir, `${songId}_aesthetic_9_16.mp4`));

  try {
    // 1. Download official audio via yt-dlp
    const searchQuery = song.search_query || `${song.title} ${song.artist} official audio`;
    const ytdlpCmd = `yt-dlp -x --audio-format mp3 -o "${fullAudioPath}" "ytsearch1:${searchQuery.replace(/"/g, '')}"`;
    run(ytdlpCmd, `Downloading Audio: ${searchQuery}`);

    // 2. Cut chorus segment (default 33.00s)
    const startTime = song.chorus_start || '00:00:40.00';
    const duration = song.duration || 33.00;
    const cutCmd = `ffmpeg -y -ss ${startTime} -i "${fullAudioPath}" -t ${duration} -c:a libmp3lame -b:a 320k "${clipAudioPath}"`;
    run(cutCmd, `Cutting ${duration}s Chorus Clip from ${startTime}`);

    // 3. Fetch official 1024x1024 artwork via iTunes API
    const artQuery = `${song.title} ${song.artist}`;
    const artCmd = `python scripts/fetch_artwork.py "${artQuery}" "${coverPath}"`;
    run(artCmd, `Fetching 1024x1024 Album Art`);

    // 4. Transcribe word-level timestamps using Whisper
    const autoPrompt = song.initial_prompt ||
      `Romanized Hindi English Latin lyrics: ${song.title} ${song.artist} ${song.hook1 || ''} ${song.hook2 || ''} ${song.hook3 || ''} ${song.hook4 || ''} ${song.drop_line1 || ''} ${song.drop_line2 || ''} ${song.subtitle || ''}`;
    const cleanPrompt = autoPrompt.replace(/["\n\r]/g, ' ').trim();
    const transcribeCmd = `python scripts/transcribe_clip.py "${clipAudioPath}" "${wordsJsonPath}" "${cleanPrompt}"`;
    run(transcribeCmd, `Running Faster-Whisper Word Alignment`);

    // 5. Build dynamic reel config
    const metaObj = {
      title: song.title,
      artist: song.artist,
      albumCover: 'album_cover.jpg',
      symbolName: song.symbolName || 'butterfly',
      particleType: song.particleType || 'fireflies',
      palette: song.palette || {
        gradientTop: "rgba(82, 18, 48, 0.95)",
        gradientMid: "#28081a",
        gradientDark: "#12030d",
        gradientBottom: "#060105",
        accentPink: "#ff2a85",
        accentLight: "#ffa6d2",
        accentGlow: "#ff0055"
      },
      scene1: song.scene1,
      scene2: song.scene2,
      scene3: song.scene3,
      scene4: song.scene4,
      hero_title: song.hero_title || song.title,
      subtitle: song.subtitle || `${song.title} · ${song.artist}`,
      hook1: song.hook1,
      hook2: song.hook2,
      hook3: song.hook3,
      hook4: song.hook4,
      drop_line1: song.drop_line1,
      drop_line2: song.drop_line2
    };
    fs.writeFileSync(songMetaPath, JSON.stringify(metaObj, null, 2));

    const buildCfgCmd = `python scripts/build_config.py "${songMetaPath}" "${wordsJsonPath}" "${reelConfigPath}"`;
    run(buildCfgCmd, `Generating Dynamic Multi-line Reel Config`);

    // 6. Setup local rendering workspace in tmpDir
    fs.copyFileSync(path.resolve('engine/aesthetic_template.html'), path.join(tmpDir, 'index.html'));
    fs.cpSync(path.resolve('assets'), path.join(tmpDir, 'assets'), { recursive: true });

    // 7. Render reel
    const renderCmd = `node scripts/render_reel.js --dir "${tmpDir}" --audio "${clipAudioPath}" --output "${finalOutputMp4}" --duration ${duration}`;
    run(renderCmd, `Executing Headless Chrome 1080x1920 Frame Render & Mux`);

    console.log(`\n[SUCCESS] Completed reel generation for: ${song.title}`);
    console.log(`[OUTPUT] ${finalOutputMp4}`);

    // Clean up temporary workspace
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}

    return {
      success: true,
      songId,
      title: song.title,
      outputPath: finalOutputMp4
    };
  } catch (err) {
    console.error(`\n[!] Error processing song ${song.title}:`, err);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    return {
      success: false,
      songId,
      title: song.title,
      error: err.message
    };
  }
}

if (require.main === module) {
  const songJson = process.argv[2];
  if (!songJson) {
    console.error('Usage: node scripts/process_single_song.js <song_json_or_path>');
    process.exit(1);
  }
  let song;
  if (fs.existsSync(songJson)) {
    song = JSON.parse(fs.readFileSync(songJson, 'utf8'));
  } else {
    song = JSON.parse(songJson);
  }
  processSong(song).then(res => {
    if (!res.success) process.exit(1);
  });
}

module.exports = { processSong };

