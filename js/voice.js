export function isVoiceSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

let active = null;
const reportError = (message) => console.warn(`[CodeStories narration] ${message}`);

export function stopVoice({ onError = reportError } = {}) {
  const previous = active;
  active = null;
  previous?.cancel();
  if (!isVoiceSupported()) return true;
  try {
    window.speechSynthesis.cancel();
    return true;
  } catch (error) {
    onError(`Could not stop narration: ${error.message}`);
    return false;
  }
}

export function speakText(text, { onEnd = () => {}, onCancel = () => {}, onError = reportError } = {}) {
  if (!isVoiceSupported() || !text) return false;
  if (!stopVoice({ onError })) return false;
  try {
    const utterance = new window.SpeechSynthesisUtterance(text);
    const entry = { utterance, cancel: onCancel };
    active = entry;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";
    utterance.onend = () => {
      if (active !== entry) return;
      active = null;
      onEnd();
    };
    utterance.onerror = (event) => {
      if (active !== entry) return;
      active = null;
      onError(`Narration stopped (${event.error || "speech unavailable"}). You can continue reading.`);
    };
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    active = null;
    onError(`Narration is unavailable: ${error.message}`);
    return false;
  }
}
