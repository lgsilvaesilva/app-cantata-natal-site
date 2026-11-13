// iPhone audio routing (Safari 16.4+ `navigator.audioSession`).
//
// Without this, iOS gives the page an "ambient" session: the ring/silent
// switch mutes the sound, and once the microphone has been used the output
// can stay on the quiet ear speaker. Both only show up as "it works with
// headphones". So:
//  - normally we ask for "playback" (loud speaker, ignores the silent switch);
//  - only while the microphone is needed we ask for "play-and-record".
// Browsers without the API ignore all of this.

export function createAudioSession(nav = globalThis.navigator) {
  const session = nav?.audioSession;
  function set(type) {
    if (!session) return false;
    try {
      if (session.type !== type) session.type = type;
      return true;
    } catch {
      return false;
    }
  }
  return {
    supported: Boolean(session),
    useSpeaker: () => set('playback'),
    useMic: () => set('play-and-record'),
    get type() { return session?.type ?? 'unsupported'; },
  };
}

export const audioSession = createAudioSession();
