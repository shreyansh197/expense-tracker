"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SpeechRecognitionHookResult {
  transcript: string;
  listening: boolean;
  supported: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Lightweight Web Speech API wrapper.
 * Returns interim transcripts for live feedback, final transcript on stop.
 * Falls back gracefully — `supported` is false when API is unavailable.
 */
export function useSpeechRecognition(
  onResult: (transcript: string) => void,
  lang = "en-US"
): SpeechRecognitionHookResult {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError("Speech recognition not supported in this browser");
      return;
    }
    setError(null);
    setTranscript("");

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      const text = final || interim;
      setTranscript(text);
      if (final) onResultRef.current(final);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted") return; // user-initiated stop
      setError(
        event.error === "not-allowed"
          ? "Microphone access denied"
          : event.error === "no-speech"
            ? "No speech detected — try again"
            : `Voice error: ${event.error}`
      );
      setListening(false);
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    // Auto-stop after 8 seconds to prevent runaway recording when user walks away
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, 8000);
  }, [supported, lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { transcript, listening, supported, error, start, stop };
}
