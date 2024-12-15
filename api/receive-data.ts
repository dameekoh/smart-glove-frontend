import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Store sequences and latest data
let latestSensorData: boolean[] | null = null;
let currentSequence: boolean[][] = [];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Gesture mappings (32 possible combinations)
const GESTURE_MEANINGS: Record<string, string> = {
  // Question words
  '[true,false,false,false,false]': 'what',
  '[false,true,false,false,false]': 'where',
  '[false,false,true,false,false]': 'when',
  '[false,false,false,true,false]': 'who',
  '[false,false,false,false,true]': 'how',

  // Verbs
  '[true,true,false,false,false]': 'go',
  '[true,false,true,false,false]': 'eat',
  '[true,false,false,true,false]': 'drink',
  '[true,false,false,false,true]': 'sleep',

  // Places
  '[false,true,true,false,false]': 'shop',
  '[false,true,false,true,false]': 'home',
  '[false,true,false,false,true]': 'hospital',
  '[false,false,true,true,false]': 'metro',
  '[false,false,true,false,true]': 'school',

  // Common nouns
  '[false,false,false,true,true]': 'food',
  '[true,true,true,false,false]': 'water',
  '[true,true,false,true,false]': 'toilet',
  '[true,true,false,false,true]': 'medicine',

  // Time
  '[true,false,true,true,false]': 'now',
  '[true,false,true,false,true]': 'later',
  '[true,false,false,true,true]': 'tomorrow',

  // Basic responses
  '[false,true,true,true,false]': 'yes',
  '[false,true,true,false,true]': 'no',
  '[false,true,false,true,true]': 'maybe',

  // Adjectives
  '[true,true,true,true,false]': 'good',
  '[true,true,true,false,true]': 'bad',
  '[true,true,false,true,true]': 'sick',
  '[true,false,true,true,true]': 'hungry',

  // Special controls
  '[false,false,false,false,false]': 'space',
  '[false,true,true,true,true]': 'end of sentence',

  // Emergency
  '[true,true,true,true,true]': 'help',
};

async function interpretGestures(sequences: boolean[][]) {
  try {
    // Convert sequences to words
    const words = sequences
      .map((gesture) => {
        const gestureKey = JSON.stringify(gesture);
        return GESTURE_MEANINGS[gestureKey] || 'unknown';
      })
      .filter((word) => word !== 'space');

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Convert this sequence of words into a natural sentence (add necessary articles, prepositions, and conjugations): "${words.join(
            ' '
          )}". Reply with only one complete, grammatically correct sentence.`,
        },
      ],
      model: 'gpt-40-mini',
    });

    return {
      interpretation: completion.choices[0].message.content,
      rawWords: words,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to interpret gestures');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (
        Array.isArray(data) &&
        data.every((item) => typeof item === 'boolean')
      ) {
        latestSensorData = data;
        const isEndOfSentence =
          JSON.stringify(data) ===
          JSON.stringify([false, true, true, true, true]);

        if (isEndOfSentence && currentSequence.length > 0) {
          const { interpretation, rawWords } = await interpretGestures(
            currentSequence
          );
          currentSequence = [];

          return res.status(200).json({
            success: true,
            message: 'Sequence completed',
            sensorData: data,
            interpretation,
            rawWords,
            isEndOfSentence: true,
            timestamp: new Date(),
          });
        } else if (!isEndOfSentence) {
          currentSequence.push(data);
        }

        return res.status(200).json({
          success: true,
          message: 'Data received',
          sensorData: data,
          isEndOfSentence: false,
          timestamp: new Date(),
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid data format',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      sensorData: latestSensorData || [false, false, false, false, false],
      timestamp: new Date(),
    });
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}
