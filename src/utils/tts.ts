export function getBestJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith("ja"));
  if (voices.length === 0) return null;
  // Prefer female voices, prioritise high-quality named ones
  return (
    voices.find((v) => v.name.includes("Kyoko")) ?? // macOS/iOS female (best)
    voices.find((v) => v.name.includes("O-ren")) ?? // macOS female alternative
    voices.find((v) => /female/i.test(v.name)) ?? // any explicitly female
    voices.find((v) => !v.name.toLowerCase().includes("compact")) ??
    voices[0]
  );
}

export function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  // Wait a tick for cancel() to settle before issuing a new utterance —
  // some browsers silently drop speak() calls made immediately after cancel().
  setTimeout(() => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";
    utt.rate = 0.75; // slow down for clarity

    const assignVoiceAndSpeak = () => {
      const voice = getBestJapaneseVoice();
      if (voice) utt.voice = voice;
      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      assignVoiceAndSpeak();
    } else {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        assignVoiceAndSpeak,
        { once: true },
      );
    }
  }, 50);
}
