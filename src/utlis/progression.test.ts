import { describe, it, expect } from 'vitest';
import { isAnswerCorrect, calculateNextStreak, calculateXpGain, Exercise } from './progression';

describe('Progression Utilities', () => {
  describe('isAnswerCorrect', () => {
    it('validates select-correct exercises', () => {
      const exercise: Exercise = {
        id: '1',
        type: 'select-correct',
        question: 'How are you?',
        answer: 'باشم',
        options: ['خراپم', 'باشم']
      };
      
      expect(isAnswerCorrect(exercise, { 
        selectedOption: 'باشم', 
        translationWords: [], 
        completedPairs: [] 
      })).toBe(true);
      
      expect(isAnswerCorrect(exercise, { 
        selectedOption: 'خراپم', 
        translationWords: [], 
        completedPairs: [] 
      })).toBe(false);
    });

    it('validates translation exercises', () => {
      const exercise: Exercise = {
        id: '2',
        type: 'translation',
        question: 'I like apples',
        answer: 'من سێوەکانم خۆش دەوێت'
      };
      
      expect(isAnswerCorrect(exercise, { 
        selectedOption: null, 
        translationWords: ['من', 'سێوەکانم', 'خۆش', 'دەوێت'], 
        completedPairs: [] 
      })).toBe(true);
      
      expect(isAnswerCorrect(exercise, { 
        selectedOption: null, 
        translationWords: ['من', 'خۆش', 'دەوێت'], 
        completedPairs: [] 
      })).toBe(false);
    });

    it('validates match exercises', () => {
      const exercise: Exercise = {
        id: '3',
        type: 'match',
        question: 'Match the words',
        answer: '',
        pairs: [
          { left: 'apple', right: 'سێو' },
          { left: 'bread', right: 'نان' }
        ]
      };
      
      expect(isAnswerCorrect(exercise, { 
        selectedOption: null, 
        translationWords: [], 
        completedPairs: ['apple', 'سێو', 'bread', 'نان'] 
      })).toBe(true);
      
      expect(isAnswerCorrect(exercise, { 
        selectedOption: null, 
        translationWords: [], 
        completedPairs: ['apple', 'سێو'] 
      })).toBe(false);
    });
  });

  describe('calculateNextStreak', () => {
    it('starts a new streak if no last activity', () => {
      const result = calculateNextStreak(0, null, '2026-04-21');
      expect(result.streak).toBe(1);
      expect(result.lastActivity).toBe('2026-04-21');
    });

    it('increments streak if last activity was yesterday', () => {
      const result = calculateNextStreak(5, '2026-04-20', '2026-04-21');
      expect(result.streak).toBe(6);
    });

    it('resets streak to 1 if last activity was more than a day ago', () => {
      const result = calculateNextStreak(10, '2026-04-18', '2026-04-21');
      expect(result.streak).toBe(1);
    });

    it('retains streak if already active today', () => {
      const result = calculateNextStreak(3, '2026-04-21', '2026-04-21');
      expect(result.streak).toBe(3);
    });
  });

  describe('calculateXpGain', () => {
    it('adds points to existing XP', () => {
      expect(calculateXpGain(100, 10)).toBe(110);
      expect(calculateXpGain(0, 10)).toBe(10);
    });
  });
});
