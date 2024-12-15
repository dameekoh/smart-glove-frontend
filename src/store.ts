import { create } from 'zustand';

interface SpeechState {
  messages: string[];
  text: string;
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;

  setMessages: (messages: string[]) => void;
  addMessage: (message: string) => void;
  setText: (text: string) => void;
  setIsRecording: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSpeechStore = create<SpeechState>((set) => ({
  messages: [],
  text: '',
  isRecording: false,
  isLoading: false,
  error: null,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setText: (text) => set({ text }),
  setIsRecording: (val) => set({ isRecording: val }),
  setIsLoading: (val) => set({ isLoading: val }),
  setError: (error) => set({ error }),
}));
