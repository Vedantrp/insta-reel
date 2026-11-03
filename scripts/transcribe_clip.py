#!/usr/bin/env python3
import sys, os, subprocess, json, wave, numpy as np
from faster_whisper import WhisperModel

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DEV_VOWELS = {
    '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ee', '\u0909': 'u',
    '\u090a': 'oo', '\u090b': 'ri', '\u090f': 'e', '\u0910': 'ai', '\u0913': 'o',
    '\u0914': 'au'
}
DEV_MATRAS = {
    '\u093e': 'aa', '\u093f': 'i', '\u0940': 'ee', '\u0941': 'u', '\u0942': 'oo',
    '\u0943': 'ri', '\u0947': 'e', '\u0948': 'ai', '\u0949': 'o', '\u094b': 'o',
    '\u094c': 'au', '\u0902': 'n', '\u0901': 'n', '\u0903': 'h'
}
DEV_CONSONANTS = {
    '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'ng',
    '\u091a': 'ch', '\u091b': 'chh', '\u091c': 'j', '\u091d': 'jh', '\u091e': 'ny',
    '\u091f': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
    '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
    '\u092a': 'p', '\u092b': 'ph', '\u092c': 'b', '\u092d': 'bh', '\u092e': 'm',
    '\u092f': 'y', '\u0930': 'r', '\u0932': 'l', '\u0933': 'l', '\u0935': 'v',
    '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h',
    '\u0958': 'q', '\u0959': 'kh', '\u095a': 'gh', '\u095b': 'z', '\u095c': 'd',
    '\u095d': 'rh', '\u095e': 'f'
}
VIRAMA = '\u094d'

def devanagari_to_roman(text):
    if not any('\u0900' <= ch <= '\u097f' for ch in text):
        return text
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in DEV_VOWELS:
            out.append(DEV_VOWELS[ch])
            i += 1
        elif ch in DEV_CONSONANTS:
            cons = DEV_CONSONANTS[ch]
            if i + 1 < n:
                nxt = text[i + 1]
                if nxt == VIRAMA:
                    out.append(cons)
                    i += 2
                    continue
                elif nxt in DEV_MATRAS:
                    out.append(cons + DEV_MATRAS[nxt])
                    i += 2
                    continue
            if i + 1 == n:
                out.append(cons)
            else:
                out.append(cons + 'a')
            i += 1
        elif ch in DEV_MATRAS:
            out.append(DEV_MATRAS[ch])
            i += 1
        else:
            out.append(ch)
            i += 1
    return "".join(out)

def transcribe_audio(audio_path, out_json_path="words.json", initial_prompt=""):
    print(f"[*] Transcribing audio: {audio_path}")
    mono_wav = "temp_mono_16k.wav"
    subprocess.run([
        "ffmpeg", "-y", "-i", audio_path,
        "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
        mono_wav
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    print("[*] Loading Whisper model (base)...")
    model = WhisperModel("base", device="cpu", compute_type="int8")

    with wave.open(mono_wav, "rb") as wf:
        audio_np = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

    try:
        os.remove(mono_wav)
    except:
        pass

    segments, info = model.transcribe(
        audio_np,
        word_timestamps=True,
        initial_prompt=initial_prompt,
        language="hi"
    )

    results = []
    all_words = []
    for seg in segments:
        seg_words = []
        if seg.words:
            for w in seg.words:
                clean_word = w.word.strip()
                if clean_word:
                    clean_word = devanagari_to_roman(clean_word)
                    w_obj = {
                        "word": clean_word,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2)
                    }
                    seg_words.append(w_obj)
                    all_words.append(w_obj)
        results.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
            "words": seg_words
        })

    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump({"segments": results, "words": all_words}, f, indent=2, ensure_ascii=False)

    print(f"[+] Transcription complete! Total words: {len(all_words)} -> {out_json_path}")
    return results

if __name__ == "__main__":
    audio = sys.argv[1] if len(sys.argv) > 1 else "clip.mp3"
    out = sys.argv[2] if len(sys.argv) > 2 else "words.json"
    prompt = sys.argv[3] if len(sys.argv) > 3 else ""
    transcribe_audio(audio, out, prompt)

