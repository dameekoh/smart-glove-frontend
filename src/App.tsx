import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { RecordingButton } from './components/RecordingButton';

interface Message {
  type: 'voice' | 'arduino' | 'system' | 'interpretation';
  content: string | boolean[];
  timestamp: Date;
  rawWords?: string[];
}

export default function App() {
  const isNative = Capacitor.isNativePlatform();

  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, text]);

  // Polling effect for Arduino data
  useEffect(() => {
    let lastTimestamp: number | null = null;
    let lastMessageContent: string | null = null;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          'https://smart-glove.vercel.app/api/receive-data'
        );
        const data = await response.json();

        if (data.success) {
          const currentTimestamp = Date.now();
          if (!lastTimestamp || currentTimestamp - lastTimestamp >= 2900) {
            // Check if the new data is different from the last message
            const newMessageContent = JSON.stringify(data.sensorData);
            if (newMessageContent !== lastMessageContent) {
              setMessages((prev) => [
                ...prev,
                {
                  type: 'arduino',
                  content: data.sensorData,
                  timestamp: new Date(),
                },
              ]);
              lastMessageContent = newMessageContent;

              // If we have an interpretation, only add it if it's new
              if (data.interpretation) {
                setMessages((prev) => [
                  ...prev,
                  {
                    type: 'interpretation',
                    content: data.interpretation,
                    timestamp: new Date(),
                    rawWords: data.rawWords,
                  },
                ]);
              }

              lastTimestamp = currentTimestamp;
            }
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsConnected(false);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // Keep only last 50 messages
  useEffect(() => {
    if (messages.length > 50) {
      setMessages((prev) => prev.slice(-50));
    }
  }, [messages]);

  useEffect(() => {
    if (isNative) {
      const setupListeners = async () => {
        await SpeechRecognition.removeAllListeners();
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
        await SpeechRecognition.removeAllListeners();

        await SpeechRecognition.addListener('listeningState', (state: any) => {
          if (state.status === 'stopped') {
            setIsRecording(false);
            setIsLoading(false);
          }
        });

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
        if (!text.trim()) {
          await SpeechRecognition.stop();
          setTimeout(() => {
            setIsRecording(false);
            setIsLoading(false);
          }, 500);
          return;
        }

        const currentText = text.trim();
        setMessages((prev) => [
          ...prev,
          {
            type: 'voice',
            content: currentText,
            timestamp: new Date(),
          },
        ]);
        setText('');

        await SpeechRecognition.stop();

        setTimeout(() => {
          if (isRecording) {
            setIsRecording(false);
            setIsLoading(false);
          }
        }, 500);
      } else {
        if (recognitionRef.current) {
          if (!text.trim()) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setIsLoading(false);
            return;
          }

          const currentText = text.trim();
          setMessages((prev) => [
            ...prev,
            {
              type: 'voice',
              content: currentText,
              timestamp: new Date(),
            },
          ]);
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

  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case 'voice':
        return (
          <div key={index} className='flex justify-start mb-4'>
            <div className='max-w-[60%] rounded-xl bg-gray-200 p-3 text-gray-800'>
              {message.content as string}
              <div className='text-xs text-gray-500 mt-1'>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        );

      case 'arduino':
        return (
          <div key={index} className='flex justify-end mb-4'>
            <div className='max-w-[60%] bg-blue-100 rounded-xl p-3'>
              <div className='flex flex-wrap gap-2'>
                {(message.content as boolean[]).map((value, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded ${
                      value
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    Sensor {idx + 1}: {value ? 'ON' : 'OFF'}
                  </span>
                ))}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        );

      case 'interpretation':
        return (
          <div key={index} className='flex justify-center mb-4'>
            <div className='bg-purple-100 px-4 py-2 rounded-xl text-sm text-purple-800 max-w-[80%]'>
              <div className='font-semibold'>{message.content}</div>
              {message.rawWords && (
                <div className='text-xs text-purple-600 mt-1'>
                  Gestures: {message.rawWords.join(' → ')}
                </div>
              )}
            </div>
          </div>
        );

      case 'system':
        return (
          <div key={index} className='flex justify-center mb-4'>
            <div className='bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-600'>
              {message.content as string}
            </div>
          </div>
        );
    }
  };

  return (
    <div className='flex flex-col min-h-screen w-screen'>
      <div className='flex items-center justify-between p-4 border-b bg-white'>
        <h1 className='text-2xl font-semibold text-gray-800'>Smart Glove</h1>
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </div>

      <div className='flex-1 overflow-y-auto bg-gray-50 p-4'>
        <div className='flex flex-col space-y-2 max-w-3xl mx-auto'>
          {messages.map((msg, idx) => renderMessage(msg, idx))}

          {isRecording && text.trim().length > 0 && (
            <div className='flex justify-start mb-4'>
              <div className='max-w-[60%] rounded-xl bg-green-200 p-3 text-gray-800'>
                {text}
              </div>
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
