export interface Exercise {
  id: string;
  type: 'select-correct' | 'translation' | 'match' | 'fill-blank' | 'construct';
  question: string;
  options?: string[];
  answer: string | string[];
  audio?: string;
  pairs?: { left: string; right: string }[];
  tip?: string;
  khaniTip?: string; // Legacy support if needed, but we should use 'tip'
}

export function isAnswerCorrect(
  exercise: Exercise,
  state: {
    selectedOption: string | null;
    translationWords: string[];
    completedPairs: string[];
  }
): boolean {
  // Enhanced Kurdish normalization
  const normalize = (s: string) => 
    s.trim()
     .toLowerCase()
     .replace(/[.,!?;:]/g, '') // Remove punctuation
     .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove ZWNJ and other invisible chars
     .replace(/\s+/g, ' ');

  if (exercise.type === 'select-correct' || exercise.type === 'fill-blank') {
    return state.selectedOption === exercise.answer;
  } else if (exercise.type === 'translation' || exercise.type === 'construct') {
    const userAns = normalize(state.translationWords.join(' '));
    const answers = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer as string];
    
    return answers.some(ans => {
      const correctAns = normalize(ans);
      
      // 1. Exact or normalized string match
      if (userAns === correctAns) return true;
      
      // 2. Ignore ALL spaces (Kurdish suffixes often variably attached)
      // e.g. "ئەمە سێوە" vs "ئەمە سێو ە"
      if (userAns.replace(/\s/g, '') === correctAns.replace(/\s/g, '')) return true;

      // 3. Handle common Kurdish character variations (e.g. Arabic vs Kurdish 'ye')
      // This is less common in modern standard but good for resilience
      const softNormalize = (str: string) => str.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
      if (softNormalize(userAns.replace(/\s/g, '')) === softNormalize(correctAns.replace(/\s/g, ''))) return true;

      return false;
    });
  } else if (exercise.type === 'match') {
    return state.completedPairs.length === (exercise.pairs?.length || 0) * 2;
  }
  return false;
}

export function calculateNextStreak(
  currentStreak: number,
  lastActivityDate: string | null,
  today: string
): { streak: number; lastActivity: string } {
  if (lastActivityDate === today) {
    return { streak: currentStreak, lastActivity: today };
  }

  const lastDate = lastActivityDate ? new Date(lastActivityDate) : null;
  const todayDate = new Date(today);
  
  if (!lastDate) {
    return { streak: 1, lastActivity: today };
  }

  // Calculate day difference
  const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { streak: currentStreak + 1, lastActivity: today };
  } else {
    return { streak: 1, lastActivity: today };
  }
}

export function calculateXpGain(currentXp: number, points: number = 10): number {
  return currentXp + points;
}
