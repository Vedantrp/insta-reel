#!/usr/bin/env node
/**
 * render_reel.js
 * Cross-platform Headless Chrome CDP Renderer for 1080x1920 9:16 Lyric Reels.
 * Runs seamlessly on both Local Windows/Mac and GitHub Actions Linux Runners.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const { spawn, execSync } = require('child_process');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function findChromePath() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  if (process.platform === 'win32') {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
    ];
    for (const p of winPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else {
    // Linux / GitHub Actions runner
    const linuxBinaries = ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'];
    for (const bin of linuxBinaries) {
      try {
        const p = execSync(`which ${bin}`, { encoding: 'utf8' }).trim();
        if (p && fs.existsSync(p)) return p;
      } catch (e) {}
    }
  }
  return 'google-chrome';
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    workDir: process.cwd(),
    audio: 'clip.mp3',
    output: 'output.mp4',
    fps: 24,
    duration: 33.00,
    chromePath: findChromePath()
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir') options.workDir = path.resolve(args[++i]);
    else if (args[i] === '--audio') options.audio = path.resolve(args[++i]);
    else if (args[i] === '--output') options.output = path.resolve(args[++i]);
    else if (args[i] === '--fps') options.fps = parseInt(args[++i], 10);
    else if (args[i] === '--duration') options.duration = parseFloat(args[++i]);
    else if (args[i] === '--chrome') options.chromePath = args[++i];
  }
  return options;
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const curId = this.msgId++;
      const onMsg = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === curId) {
          this.ws.removeEventListener('message', onMsg);
          if (d.error) reject(new Error(d.error.message));
          else resolve(d.result);
        }
      };
      this.ws.addEventListener('message', onMsg);
      this.ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res && res.exceptionDetails) {
      throw new Error('CDP Evaluate Exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res && res.result ? res.result.value : null;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(rootDir, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.json': 'application/json'
        };
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function main() {
  const options = parseArgs();
  console.log(`[*] Chrome binary: ${options.chromePath}`);
  console.log(`[*] Workspace directory: ${options.workDir}`);
  console.log(`[*] Audio source: ${options.audio}`);
  console.log(`[*] Output destination: ${options.output}`);

  if (!fs.existsSync(options.audio)) {
    throw new Error(`Audio file does not exist: ${options.audio}`);
  }

  const fps = options.fps;
  const totalFrames = Math.ceil(options.duration * fps);
  console.log(`[*] Total frames to render: ${totalFrames} (${options.duration}s @ ${fps}fps)`);

  const { server, port: serverPort } = await startStaticServer(options.workDir);
  console.log(`[+] Local asset server listening on port ${serverPort}`);

  const debugPort = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-reel-runner-'));

  const chromeProc = spawn(options.chromePath, [
    `--remote-debugging-port=${debugPort}`,
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-default-apps',
    '--mute-audio',
    '--window-size=1080,1920',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-web-security',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let pageWsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      if (res.ok) {
        const pages = await res.json();
        const targetPage = pages.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
        if (targetPage) {
          pageWsUrl = targetPage.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {}
    await sleep(250);
  }

  if (!pageWsUrl) {
    chromeProc.kill();
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    throw new Error('Failed to connect to Chrome remote debugging port.');
  }

  const cdp = new SimpleCDP(pageWsUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const pageUrl = `http://127.0.0.1:${serverPort}/index.html`;
  console.log(`[*] Navigating to canvas engine: ${pageUrl}`);
  await cdp.send('Page.navigate', { url: pageUrl });
  await sleep(1500);

  console.log('[*] Waiting for canvas engine to mount...');
  for (let i = 0; i < 30; i++) {
    const isReady = await cdp.evaluate('typeof window.initEngine === "function"');
    if (isReady) break;
    await sleep(250);
  }

  console.log('[*] Initializing engine assets, fonts & config...');
  const initSuccess = await cdp.evaluate('window.initEngine()');
  console.log('[+] Engine initialized successfully:', initSuccess);

  // Pipe frames directly to ffmpeg
  const tempSilentVideo = path.join(os.tmpdir(), `silent_${Date.now()}.mp4`);
  const ffmpegProc = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    tempSilentVideo
  ]);

  ffmpegProc.stderr.on('data', () => {});

  const renderStart = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    const timestamp = f / fps;
    const dataUrl = await cdp.evaluate(`(function() {
      window.renderFrameAt(${timestamp});
      return document.getElementById("mainCanvas").toDataURL("image/jpeg", 0.88);
    })()`);

    if (!dataUrl || !dataUrl.startsWith('data:image/jpeg;base64,')) {
      throw new Error(`Frame ${f} failed to capture data URL`);
    }

    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    ffmpegProc.stdin.write(Buffer.from(base64Data, 'base64'));

    if ((f + 1) % 45 === 0 || f === totalFrames - 1) {
      const elapsed = (Date.now() - renderStart) / 1000;
      const speed = ((f + 1) / elapsed).toFixed(1);
      const pct = (((f + 1) / totalFrames) * 100).toFixed(1);
      process.stdout.write(`\r  [Render] Frame ${f + 1}/${totalFrames} (${pct}%) - ${speed} fps - ${elapsed.toFixed(1)}s elapsed`);
    }
  }

  ffmpegProc.stdin.end();
  await new Promise(res => ffmpegProc.on('close', res));
  console.log(`\n[+] Visual frames encoding completed.`);

  cdp.close();
  try { chromeProc.kill(); } catch (e) {}
  try { server.close(); } catch (e) {}
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  // Mux video with audio
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  console.log(`[*] Muxing final reel video with audio: ${options.audio}`);
  execSync(`ffmpeg -y -i "${tempSilentVideo}" -i "${options.audio}" -c:v copy -c:a aac -b:a 320k -shortest "${options.output}"`, { stdio: 'inherit' });

  try { fs.unlinkSync(tempSilentVideo); } catch (e) {}

  const sizeMb = (fs.statSync(options.output).size / (1024 * 1024)).toFixed(2);
  console.log(`\n[SUCCESS] Final reel saved: ${options.output} (${sizeMb} MB)\n`);
}

main().catch(err => {
  console.error('[!] Render failure:', err);
  process.exit(1);
});

