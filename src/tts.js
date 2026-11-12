// Optional browser voice (speechSynthesis) for isolated words and for reading
// instructions aloud. It never pretends: if speech does not start, the
// promise resolves to false and the UI says the voice is unavailable.

export function createTTS(win = window) {
  const synth = win.speechSynthesis;
  const Utterance = win.SpeechSynthesisUtterance;
  let voices = [];

  function refresh() {
    try { voices = synth?.getVoices() ?? []; } catch { voices = []; }
  }
  if (synth) {
    refresh();
    synth.addEventListener?.('voiceschanged', refresh);
  }

  function pick(lang) {
    const prefix = lang.slice(0, 2);
    const preferred = lang === 'en' ? ['en-US', 'en-GB', 'en-AU'] : ['pt-BR', 'pt-PT'];
    for (const tag of preferred) {
      const v = voices.find((x) => x.lang?.replace('_', '-') === tag && x.localService) ?? voices.find((x) => x.lang?.replace('_', '-') === tag);
      if (v) return v;
    }
    return voices.find((x) => x.lang?.toLowerCase().startsWith(prefix)) ?? null;
  }

  return {
    supported: Boolean(synth && Utterance),
    /** True when a voice for the language is known (voices may load late). */
    hasVoice(lang = 'en') { refresh(); return Boolean(pick(lang)); },
    voiceCount() { refresh(); return voices.length; },
    cancel() { try { synth?.cancel(); } catch { /* ignore */ } },
    speak(text, { lang = 'en', rate = 0.9 } = {}) {
      if (!synth || !Utterance) return Promise.resolve(false);
      refresh();
      try { synth.cancel(); } catch { /* ignore */ }
      return new Promise((resolve) => {
        const u = new Utterance(text);
        const voice = pick(lang);
        u.lang = voice?.lang ?? (lang === 'en' ? 'en-US' : 'pt-BR');
        if (voice) u.voice = voice;
        u.rate = rate;
        let started = false;
        const guard = win.setTimeout(() => { if (!started) { try { synth.cancel(); } catch { /* */ } resolve(false); } }, 2500);
        u.onstart = () => { started = true; win.clearTimeout(guard); };
        u.onend = () => { win.clearTimeout(guard); resolve(started); };
        u.onerror = () => { win.clearTimeout(guard); resolve(false); };
        try { synth.speak(u); } catch { win.clearTimeout(guard); resolve(false); }
      });
    },
  };
}
