import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { RecordingButton } from './components/RecordingButton';
export default function App() {
  const isNative = Capacitor.isNativePlatform();

  const [text, setText] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setText('');

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
          if (result && result.matches && result.matches[0]) {
            setText(result.matches[0]);
          }
        });
      } else {
        const WebSpeechRecognition =
          // @ts-ignore
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (WebSpeechRecognition) {
          recognitionRef.current = new WebSpeechRecognition();
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.interimResults = true;
          recognitionRef.current.continuous = true;

          recognitionRef.current.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((res: any) => res[0].transcript)
              .join('');
            setText(transcript);
          };

          recognitionRef.current.onerror = (event: any) => {
            setError(`Speech recognition error: ${event.error}`);
          };

          recognitionRef.current.start();
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
  }, [isNative]);

  const stopListening = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isNative) {
        await SpeechRecognition.stop();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Add the final recognized text to messages if not empty
      if (text.trim().length > 0) {
        setMessages((prev) => [...prev, text.trim()]);
        setText('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while stopping recognition');
    } finally {
      setIsLoading(false);
    }
  }, [isNative, text]);

  useEffect(() => {
    return () => {
      if (isNative) {
        SpeechRecognition.removeAllListeners();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isNative]);

  const handleToggleRecording = useCallback(() => {
    if (!isLoading) {
      if (!isRecording) {
        setIsRecording(true);
        startListening();
      } else {
        setIsRecording(false);
        stopListening();
      }
    }
  }, [isRecording, isLoading, startListening, stopListening]);

  return (
    <div className='flex flex-col min-h-screen w-screen'>
      <h1 className='text-center mt-4 text-2xl font-semibold text-neutral-100'>
        Skibidi Sigma
      </h1>

      {/* Chat container */}
      <div className='flex flex-col mt-4 space-y-2 flex-1 overflow-y-auto rounded-lg bg-neutral-100 p-4'>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className='max-w-[60%] rounded-xl bg-gray-200 p-3 text-gray-800'
          >
            {msg}
          </div>
        ))}

        {/* Partial transcript message while recording */}
        {isRecording && text && (
          <div className='max-w-[60%] rounded-xl bg-green-200 p-3 text-gray-800'>
            {text}
          </div>
        )}
      </div>

      {error && <p className='text-red-600 text-center mt-2'>Error: {error}</p>}

      {/* Recording Button fixed at bottom */}
      <RecordingButton
        isRecording={isRecording}
        isLoading={isLoading}
        onToggleRecording={handleToggleRecording}
      />
    </div>
  );
}
