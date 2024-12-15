import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const isNative = Capacitor.isNativePlatform();

interface SpeechRecognitionResult {
  text: string;
  isLoading: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let recognition: any = null;

  const startListening = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        await SpeechRecognition.available();
        await SpeechRecognition.requestPermissions();
        SpeechRecognition.start({
          language: 'en-US',
          maxResults: 2,
          prompt: 'Say something',
          partialResults: true,
          popup: false,
        });
        SpeechRecognition.addListener('partialResults', (result: any) => {
          setText(result.matches[0]);
        });
      } else {
        const SpeechRecognition =
          // @ts-ignore
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = true;
          recognition.continuous = true;

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join('');
            setText(transcript);
          };

          recognition.onerror = (event: any) => {
            setError(`Speech recognition error: ${event.error}`);
          };

          recognition.start();
        } else {
          setError('Speech recognition not supported in this browser');
        }
      }
    } catch (err: any) {
      setError(
        err.message || 'An error occurred while starting speech recognition'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (isNative) {
      await SpeechRecognition.stop();
    } else if (recognition) {
      recognition.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isNative) {
        SpeechRecognition.removeAllListeners();
      } else if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  return { text, isLoading, error, startListening, stopListening };
}
