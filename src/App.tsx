import { useState, useCallback, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, text]);

  useEffect(() => {
    if (isNative) {
      const setupListeners = async () => {
        // First remove all listeners to start fresh
        await SpeechRecognition.removeAllListeners();

        // Add a listener for listening state changes
        await SpeechRecognition.addListener('listeningState', (state: any) => {
          if (state.status === 'stopped') {
            setIsRecording(false);
            setIsLoading(false);
          }
        });
      };

      setupListeners();

      return () => {
        SpeechRecognition.removeAllListeners();
      };
    }
  }, [isNative]);

  const startListening = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setText('');

    try {
      if (isNative) {
        const available = await SpeechRecognition.available();
        if (!available.available) {
          throw new Error('Speech recognition not available on this device.');
        }

        await SpeechRecognition.requestPermissions();

        // Remove any existing listeners for a clean start
        await SpeechRecognition.removeAllListeners();

        // Add back the listening state listener
        await SpeechRecognition.addListener('listeningState', (state: any) => {
          if (state.status === 'stopped') {
            setIsRecording(false);
            setIsLoading(false);
          }
        });

        // Add partial results listener
        await SpeechRecognition.addListener('partialResults', (result: any) => {
          if (result && result.matches && result.matches[0]) {
            setText(result.matches[0]);
          }
        });

        await SpeechRecognition.start({
          language: 'en-US',
          maxResults: 2,
          prompt: 'Say something',
          partialResults: true,
          popup: false,
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
            setIsRecording(false);
            setIsLoading(false);
          };

          recognitionRef.current.start();
        } else {
          setError('Speech recognition not supported in this browser');
        }
      }

      // If we got here successfully, we're now recording
      setIsRecording(true);
    } catch (err: any) {
      setError(
        err.message || 'An error occurred while starting speech recognition'
      );
      setIsRecording(false);
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  const stopListening = useCallback(async () => {
    try {
      if (isNative) {
        // If no recognized text, just stop the recognition
        if (!text.trim()) {
          await SpeechRecognition.stop();
          // After stopping, give the plugin time to fire 'stopped' event
          // If not fired, manually reset after a delay
          setTimeout(() => {
            setIsRecording(false);
            setIsLoading(false);
          }, 500);
          return;
        }

        // We have recognized text, add it to messages
        const currentText = text.trim();
        setMessages((prev) => [...prev, currentText]);
        setText('');

        // Stop recognition now
        await SpeechRecognition.stop();

        // Wait a little for the 'listeningState' event to fire.
        // If it doesn't fire, fallback to manually resetting states.
        setTimeout(() => {
          if (isRecording) {
            setIsRecording(false);
            setIsLoading(false);
          }
        }, 500);

        // DO NOT remove all listeners before the event fires.
        // If you want, you can remove them after confirming 'stopped'.
      } else {
        if (recognitionRef.current) {
          if (!text.trim()) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setIsLoading(false);
            return;
          }

          const currentText = text.trim();
          setMessages((prev) => [...prev, currentText]);
          setText('');
          recognitionRef.current.stop();
          setIsRecording(false);
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while stopping recognition');
      setIsRecording(false);
      setIsLoading(false);
    }
  }, [isNative, text, isRecording]);

  const handleToggleRecording = useCallback(async () => {
    if (!isLoading) {
      if (!isRecording) {
        await startListening();
      } else {
        await stopListening();
      }
    }
  }, [isRecording, isLoading, startListening, stopListening]);

  return (
    <div className='flex flex-col min-h-screen w-screen'>
      <h1 className='text-center mt-4 text-2xl font-semibold text-neutral-100'>
        Skibidi Sigma
      </h1>

      <div className='flex flex-col mt-4 space-y-2 flex-1 overflow-y-auto rounded-lg bg-neutral-100 p-4'>
        <div className='flex flex-col space-y-2'>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className='max-w-[60%] rounded-xl bg-gray-200 p-3 text-gray-800'
            >
              {msg}
            </div>
          ))}

          {isRecording && text.trim().length > 0 && (
            <div className='max-w-[60%] rounded-xl bg-green-200 p-3 text-gray-800'>
              {text}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && <p className='text-red-600 text-center mt-2'>Error: {error}</p>}

      <RecordingButton
        isRecording={isRecording}
        isLoading={isLoading}
        onToggleRecording={handleToggleRecording}
      />
    </div>
  );
}
