#!/usr/bin/env node
/**
 * daily_batch.js
 * Master orchestrator for generating daily reels batch.
 * Can be run locally or autonomously inside GitHub Actions.
 */

const fs = require('fs');
const path = require('path');
const { processSong } = require('./process_single_song');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    count: 5,
    queueFile: 'songs_queue.json',
    outputDir: 'output',
    forceId: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count') options.count = parseInt(args[++i], 10);
    else if (args[i] === '--queue') options.queueFile = path.resolve(args[++i]);
    else if (args[i] === '--output') options.outputDir = path.resolve(args[++i]);
    else if (args[i] === '--force') options.forceId = args[++i];
  }
  return options;
}

async function runDailyBatch() {
  const options = parseArgs();
  console.log(`======================================================`);
  console.log(`[🚀] STARTING DAILY REELS BATCH GENERATOR`);
  console.log(`[*] Target count: ${options.count} reels`);
  console.log(`[*] Queue file: ${options.queueFile}`);
  console.log(`[*] Output directory: ${options.outputDir}`);
  console.log(`======================================================`);

  if (!fs.existsSync(options.queueFile)) {
    throw new Error(`Queue file not found: ${options.queueFile}`);
  }

  const queue = JSON.parse(fs.readFileSync(options.queueFile, 'utf8'));

  // Filter pending songs or specific force ID
  let targetSongs = [];
  if (options.forceId) {
    targetSongs = queue.filter(s => s.id === options.forceId);
  } else {
    targetSongs = queue.filter(s => s.status !== 'completed').slice(0, options.count);
  }

  if (targetSongs.length === 0) {
    console.log('[!] No pending songs found in queue! All songs have been completed.');
    process.exit(0);
  }

  console.log(`[+] Found ${targetSongs.length} songs queued for generation:`);
  targetSongs.forEach((s, idx) => console.log(`  ${idx + 1}. [${s.id}] ${s.title} - ${s.artist}`));

  const todayStr = new Date().toISOString().split('T')[0];
  const batchOutputDir = path.join(options.outputDir, todayStr);
  fs.mkdirSync(batchOutputDir, { recursive: true });

  const results = [];

  for (let i = 0; i < targetSongs.length; i++) {
    const song = targetSongs[i];
    console.log(`\n------------------------------------------------------`);
    console.log(`[🎬 BATCH PROGRESS: ${i + 1}/${targetSongs.length}] Generating: ${song.title}`);
    console.log(`------------------------------------------------------`);

    const result = await processSong(song, batchOutputDir);
    results.push(result);

    if (result.success) {
      // Mark as completed in the queue
      const songInQueue = queue.find(s => s.id === song.id);
      if (songInQueue) {
        songInQueue.status = 'completed';
        songInQueue.completed_at = new Date().toISOString();
        songInQueue.video_file = path.basename(result.outputPath);
      }
      // Save queue immediately so state is preserved
      fs.writeFileSync(options.queueFile, JSON.stringify(queue, null, 2));
    } else {
      console.error(`[!] Failed to generate reel for: ${song.title} (${result.error})`);
    }
  }

  // Summary report
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const summary = {
    date: todayStr,
    generatedAt: new Date().toISOString(),
    totalRequested: targetSongs.length,
    successfulCount: successful.length,
    failedCount: failed.length,
    videos: successful.map(s => ({
      title: s.title,
      songId: s.songId,
      path: s.outputPath,
      sizeMb: fs.existsSync(s.outputPath) ? (fs.statSync(s.outputPath).size / (1024 * 1024)).toFixed(2) : 0
    })),
    errors: failed.map(f => ({ songId: f.songId, title: f.title, error: f.error }))
  };

  fs.writeFileSync(path.join(batchOutputDir, 'batch_summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(options.outputDir, 'latest_summary.json'), JSON.stringify(summary, null, 2));

  console.log(`\n======================================================`);
  console.log(`[🎉] DAILY BATCH COMPLETED`);
  console.log(`[*] Success: ${successful.length}/${targetSongs.length}`);
  if (failed.length > 0) console.log(`[!] Failed: ${failed.length}`);
  console.log(`[*] Output Folder: ${batchOutputDir}`);
  console.log(`======================================================\n`);

  if (successful.length === 0 && targetSongs.length > 0) {
    process.exit(1);
  }
}

runDailyBatch().catch(err => {
  console.error('[!] Daily batch execution fatal error:', err);
  process.exit(1);
});

