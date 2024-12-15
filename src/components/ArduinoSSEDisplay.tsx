import { useState, useEffect, useRef } from 'react';

interface Message {
  type: 'arduino' | 'system';
  content: boolean[] | string;
  timestamp: Date;
}

export function ArduinoSSEDisplay() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('https://smart-glove.vercel.app/api/sse');

        eventSource.onopen = () => {
          setIsConnected(true);
          setMessages((prev) => [
            ...prev,
            {
              type: 'system',
              content: 'Connected to Arduino',
              timestamp: new Date(),
            },
          ]);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.sensorData) {
              setMessages((prev) => [
                ...prev,
                {
                  type: 'arduino',
                  content: data.sensorData,
                  timestamp: new Date(),
                },
              ]);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setMessages((prev) => [
            ...prev,
            {
              type: 'system',
              content: 'Connection lost. Retrying...',
              timestamp: new Date(),
            },
          ]);
          eventSource?.close();
          setTimeout(connectSSE, 5000);
        };
      } catch (error) {
        setIsConnected(false);
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, []);

  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case 'arduino':
        return (
          <div key={index} className='flex justify-start mb-4'>
            <div className='flex items-start max-w-[80%]'>
              <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2'>
                A
              </div>
              <div>
                <div className='bg-blue-100 p-3 rounded-lg'>
                  <div className='flex flex-wrap gap-2'>
                    {(message.content as boolean[]).map(
                      (value: boolean, idx: number) => (
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
                      )
                    )}
                  </div>
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
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

      default:
        return null;
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <div className='bg-white rounded-lg shadow'>
        <div className='border-b p-4 flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='font-semibold'>Arduino Chat</div>
            <div
              className={`ml-2 w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        <div className='h-[600px] overflow-y-auto p-4'>
          {messages.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
