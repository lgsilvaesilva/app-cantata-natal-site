// Keeps the three sound sources from stepping on each other:
//  - starting a recording pauses the song and the browser voice first,
//    so the microphone does not capture the Jackson 5 recording by accident;
//  - the song cannot start while recording (unless the adult enabled
//    "sing along with headphones" for the Grande Cantata);
//  - leaving a screen stops everything and releases the microphone.

export function createCoordinator({ player, tts }) {
  const recorders = new Set();
  const listeners = new Set();
  let allowMusicWhileRecording = false;

  const isRecording = () => [...recorders].some((r) => ['requesting-permission', 'recording', 'processing'].includes(r.state.status));
  const notify = () => { for (const fn of listeners) fn(); };

  return {
    isRecording,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    notify,
    register(recorder) { recorders.add(recorder); return () => recorders.delete(recorder); },
    /** Per screen: the Grande Cantata may allow music during recording. */
    setAllowMusicWhileRecording(v) { allowMusicWhileRecording = Boolean(v); },
    canPlayMusic: () => allowMusicWhileRecording || !isRecording(),
    async beforeRecord() {
      tts.cancel();
      if (!allowMusicWhileRecording) player.stop();
    },
    beforeMusic() { tts.cancel(); },
    /** Ends active recordings but keeps what was recorded (e.g. app switched). */
    stopRecordings() {
      for (const r of recorders) if (['requesting-permission', 'recording'].includes(r.state.status)) r.stop();
    },
    stopAll() {
      player.stop();
      tts.cancel();
      for (const r of recorders) r.destroy();
      recorders.clear();
      allowMusicWhileRecording = false;
      notify();
    },
  };
}
