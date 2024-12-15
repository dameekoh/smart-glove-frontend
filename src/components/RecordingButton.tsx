import React from 'react';

function MicrophoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 32 32'
      {...props}
    >
      <path
        fill='currentColor'
        d='M23 14v3a7 7 0 0 1-14 0v-3H7v3a9 9 0 0 0 8 8.94V28h-4v2h10v-2h-4v-2.06A9 9 0 0 0 25 17v-3Z'
      />
      <path
        fill='currentColor'
        d='M16 22a5 5 0 0 0 5-5V7a5 5 0 0 0-10 0v10a5 5 0 0 0 5 5'
      />
    </svg>
  );
}

function StopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 32 32'
      {...props}
    >
      <path
        fill='currentColor'
        d='M24 6H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2'
      />
    </svg>
  );
}

interface RecordingButtonProps {
  isRecording: boolean;
  isLoading: boolean;
  onToggleRecording: () => void;
}

export function RecordingButton({
  isRecording,
  isLoading,
  onToggleRecording,
}: RecordingButtonProps) {
  return (
    <div className='fixed bottom-4 left-1/2 transform -translate-x-1/2'>
      <button
        type='button'
        className={`relative p-8 rounded-full bg-gray-100 
          shadow-inner transition-all duration-300 focus:outline-none focus:ring-4 
          focus:ring-blue-300 focus:ring-opacity-50 
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${!isLoading ? 'hover:shadow-lg active:shadow-md' : ''}
          `}
        onClick={onToggleRecording}
        disabled={isLoading}
      >
        {isRecording ? (
          <>
            <StopIcon className='h-16 w-16 text-red-500 relative z-10' />
            <span className='absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75' />
            <span className='absolute inset-0 rounded-full animate-pulse opacity-50' />
          </>
        ) : (
          <MicrophoneIcon className='h-16 w-16 text-blue-500' />
        )}
      </button>
    </div>
  );
}
