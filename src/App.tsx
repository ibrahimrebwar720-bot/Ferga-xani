/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useMemo, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Home, 
  CheckCircle,
  Circle,
  Star,
  Sun,
  Moon,
  Settings,
  Trophy,
  Zap,
  Book,
  Calendar,
  Crown,
  Globe,
  Award,
  Flame,
  X,
  PlayCircle,
  Mail,
  Volume2,
  VolumeX,
  Music,
  Download,
  User as UserIcon,
  LogOut,
  Upload,
  Trash2,
  Loader2,
  History,
  RotateCcw,
  Palette,
  Music2,
  Sparkles,
  Target,
  Users,
  Heart,
  Library,
  Plus,
  Wifi,
  WifiOff,
  Check,
  Edit3,
  Info,
  ScrollText,
  Languages, 
  Type, 
  Quote,
  Layers,
  Brain,
  Play,
  Search,
  Minus,
  Copy,
  MapPin,
  Apple,
  Carrot,
  Mountain,
  TreePine,
  Diamond,
  Hexagon,
  Scroll,
  Leaf,
  Map,
  Briefcase,
  Pen
} from 'lucide-react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  updateProfile as updateFirebaseProfile,
  deleteUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  FieldPath,
  arrayUnion, 
  getDocFromServer, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { kurdishDictionary } from './data/dictionary';

import { grammarData, DialectGrammar } from './data/grammar';
import { isAnswerCorrect, calculateNextStreak, calculateXpGain, Exercise as ProgressionExercise } from './utils/progression';

const KHANI_LOGO = '/khani.png';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistence failed: Browser not supported');
        }
    });
} catch (e) {
    console.error("Persistence setup error:", e);
}

const auth = getAuth(app);

// Error handling helper
const handleFirestoreError = (error: any, operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write', path: string | null, user: FirebaseUser | null) => {
  if (error?.code === 'resource-exhausted') {
    const errorInfo = {
      error: 'Quota exceeded. The daily limit for this database has been reached. It will reset in 24 hours.',
      operationType,
      path,
      isQuota: true
    };
    console.error("Firestore Quota Error:", errorInfo);
    
    // Store in session to prevent further spamming writes
    sessionStorage.setItem('ferga_quota_exceeded', 'true');
    
    // Throw to trigger ErrorBoundary for critical failures
    throw new Error(JSON.stringify(errorInfo));
  }
  
  const errorInfo = {
    error: error.message || String(error),
    operationType,
    path,
    authInfo: user ? {
      userId: user.uid,
      email: user.email || '',
    } : null
  };
  console.error("Firestore Error:", errorInfo);
  return errorInfo;
};

const testConnection = async () => {
  if (sessionStorage.getItem('ferga_conn_verified') || sessionStorage.getItem('ferga_quota_exceeded')) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful");
    sessionStorage.setItem('ferga_conn_verified', 'true');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      console.error("Firestore connection test failed:", error);
    }
  }
};
testConnection();

type TargetDialect = 'Sorani' | 'Kurmanji' | 'Hawrami' | 'Luri' | 'Zazaki';
type InterfaceLang = 'Sorani' | 'Kurmanji';

const SyncInput = ({ value, onSync, className, placeholder, autoFocus, type = 'text' }: any) => {
  const [localValue, setLocalValue] = useState(value || '');
  useEffect(() => { setLocalValue(value || ''); }, [value]);
  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => { if (localValue !== value) onSync(localValue); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className={`${className} font-afarin2`}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
};

const SyncTextarea = ({ value, onSync, className, placeholder }: any) => {
  const [localValue, setLocalValue] = useState(value || '');
  useEffect(() => { setLocalValue(value || ''); }, [value]);
  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => { if (localValue !== value) onSync(localValue); }}
      className={`${className} font-afarin2`}
      placeholder={placeholder}
    />
  );
};

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

const dialectThemes: Record<TargetDialect, {
    primary: string,
    primaryLight: string,
    secondary: string,
    accent: string,
    bg: string,
    text: string,
    ring: string,
    gradient: string,
    // Dark mode variants
    darkBg: string,
    darkText: string,
    lightBg: string,
    lightText: string
}> = {
    Sorani: {
        primary: '#e11d48', // rose-600
        primaryLight: '#fb7185', // rose-400
        secondary: '#f43f5e', // rose-500
        accent: '#fb923c', // orange-400
        bg: '#05010a', // Forced dark
        text: '#f8fafc',
        ring: 'rgba(225, 29, 72, 0.2)',
        gradient: 'from-rose-600 to-orange-600',
        darkBg: '#05010a',
        darkText: '#f8fafc',
        lightBg: '#05010a', // Forced dark for aesthetics
        lightText: '#f8fafc'
    },
    Kurmanji: {
        primary: '#eab308', // yellow-500
        primaryLight: '#facc15', // yellow-400
        secondary: '#ca8a04', // yellow-600
        accent: '#22c55e', // green-500
        bg: '#05010a', 
        text: '#fef3c7',
        ring: 'rgba(234, 179, 8, 0.2)',
        gradient: 'from-yellow-500 to-amber-600',
        darkBg: '#05010a',
        darkText: '#fef3c7',
        lightBg: '#05010a',
        lightText: '#fef3c7'
    },
    Hawrami: {
        primary: '#16a34a', // green-600
        primaryLight: '#4ade80', // green-400
        secondary: '#15803d', // green-700
        accent: '#2dd4bf', // teal-400
        bg: '#05010a',
        text: '#ecfdf5',
        ring: 'rgba(22, 163, 74, 0.2)',
        gradient: 'from-green-600 to-teal-600',
        darkBg: '#05010a',
        darkText: '#ecfdf5',
        lightBg: '#05010a',
        lightText: '#ecfdf5'
    },
    Zazaki: {
        primary: '#9333ea', // purple-600
        primaryLight: '#c084fc', // purple-400
        secondary: '#7e22ce', // purple-700
        accent: '#818cf8', // indigo-400
        bg: '#05010a', 
        text: '#f5f3ff',
        ring: 'rgba(147, 51, 234, 0.2)',
        gradient: 'from-purple-600 to-indigo-600',
        darkBg: '#05010a',
        darkText: '#f5f3ff',
        lightBg: '#05010a',
        lightText: '#f5f3ff'
    },
    Luri: {
        primary: '#2563eb', // blue-600
        primaryLight: '#60a5fa', // blue-400
        secondary: '#1d4ed8', // blue-700
        accent: '#22d3ee', // cyan-400
        bg: '#05010a',
        text: '#eff6ff',
        ring: 'rgba(37, 99, 235, 0.2)',
        gradient: 'from-blue-600 to-cyan-600',
        darkBg: '#05010a',
        darkText: '#eff6ff',
        lightBg: '#05010a',
        lightText: '#eff6ff'
    }
};

const KurdistanMap = ({ className = "" }: { className?: string }) => (
  <div className={`pointer-events-none select-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full fill-white/[0.1] stroke-white/20" strokeWidth="0.5">
      <path d="M20,40 Q30,35 45,30 Q60,25 75,35 Q85,45 80,60 Q75,75 55,80 Q35,85 25,70 Q15,55 20,40 Z" />
    </svg>
  </div>
);

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229'; // Default indigo-600
};

const ThemeInjected = ({ dialect, mode }: { dialect: TargetDialect, mode: 'dark' }) => {
    const theme = dialectThemes[dialect] || dialectThemes.Sorani;
    const pageBg = '#05010a';
    const pageText = theme.darkText;
    const primary = theme.primary;
    const primaryRgb = hexToRgb(primary);

    return (
        <style dangerouslySetInnerHTML={{ __html: `
            :root {
                --primary: ${primary};
                --primary-rgb: ${primaryRgb};
                --primary-light: ${theme.primaryLight};
                --secondary: ${theme.secondary};
                --accent: ${theme.accent};
                --bg: ${pageBg};
                --text: ${pageText};
                --ring: ${theme.ring};
                --page-bg: #0b1120;
                --page-text: #f8fafc;
                --card-bg: rgba(30, 41, 59, 0.4);
                --card-border: rgba(255, 255, 255, 0.08);
                --glass-bg: rgba(15, 23, 42, 0.85);
                --smooth-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
            }
            body { 
                background-color: ${pageBg} !important; 
                color: ${pageText} !important; 
                font-feature-settings: "cv02", "cv03", "cv04", "cv11";
                -webkit-font-smoothing: antialiased;
            }
            #root {
                min-height: 100vh;
                position: relative;
                background-color: ${pageBg} !important;
            }
            .theme-primary { color: var(--primary) !important; }
            .theme-text { color: ${pageText} !important; }
            .theme-bg-page { background-color: ${pageBg} !important; }
            .theme-bg-primary { background-color: var(--primary) !important; color: white !important; }
            .theme-bg-soft { background-color: rgba(255, 255, 255, 0.03) !important; }
            .theme-border-soft { border-color: var(--card-border) !important; }
            .theme-card { 
                background-color: var(--card-bg); 
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid var(--card-border); 
                box-shadow: var(--smooth-shadow);
            }
            .smooth-glass {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            .interactive-card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .interactive-card:hover {
                transform: translateY(-4px);
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
                box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);
            }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        ` }} />
    );
};

interface Exercise {
  id: string;
  type: 'select-correct' | 'translation' | 'match' | 'fill-blank' | 'construct' | 'intro';
  question: string;
  options?: string[];
  answer: string | string[];
  pairs?: { left: string; right: string }[];
  hint?: string;
  tip?: string;
  khaniTip?: string;
  funFact?: string;
}

interface Lesson {
  id: number;
  unitId: number;
  title: string;
  category: string;
  exercises: Exercise[];
}

interface Unit {
  id: number;
  title: string;
  description: string;
  theme?: string;
  lessons: Lesson[];
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  streak: number;
  lastReview?: number;
  nextReview?: number;
}

interface Achievement {
  id: string;
  category: 'lessons' | 'xp' | 'streak' | 'dialects' | 'social';
  title: { Sorani: string; Kurmanji: string };
  description: { Sorani: string; Kurmanji: string };
  icon: string;
  requirement: (stats: any) => boolean;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  // --- LESSON CHALLENGES ---
  {
    id: 'lesson_1',
    category: 'lessons',
    title: { Sorani: 'هەنگاوی یەکەم', Kurmanji: 'Gava Yekem' },
    description: { Sorani: 'یەکەم وانەت بە سەرکەوتوویی تەواو کرد', Kurmanji: 'Te dersa xwe ya yekem qedand' },
    icon: 'target',
    requirement: (s) => s.learnedCount >= 1,
    color: 'bg-green-500'
  },
  {
    id: 'lesson_10',
    category: 'lessons',
    title: { Sorani: 'خوێنەری پڕکار', Kurmanji: 'Xwendekarê Çalak' },
    description: { Sorani: '١٠ وانەت تەواو کردووە', Kurmanji: 'Te 10 ders qedandin' },
    icon: 'book',
    requirement: (s) => s.learnedCount >= 10,
    color: 'bg-blue-500'
  },
  {
    id: 'lesson_50',
    category: 'lessons',
    title: { Sorani: 'زانای زمان', Kurmanji: 'Zanistê Ziman' },
    description: { Sorani: '٥٠ وانەت بڕیوە، شکۆمەندیت!', Kurmanji: 'Te 50 ders qedandin, pîroz be!' },
    icon: 'award',
    requirement: (s) => s.learnedCount >= 50,
    color: 'bg-purple-600'
  },

  // --- XP MILESTONES ---
  {
    id: 'xp_100',
    category: 'xp',
    title: { Sorani: 'سەرەتایەکی باش', Kurmanji: 'Seretayek Baş' },
    description: { Sorani: 'گەیشتیتە ١٠٠ خاڵی توانست', Kurmanji: 'Te 100 XP bi dest xist' },
    icon: 'zap',
    requirement: (s) => s.xp >= 100,
    color: 'bg-yellow-400'
  },
  {
    id: 'xp_1000',
    category: 'xp',
    title: { Sorani: 'هەزارەی فێربوون', Kurmanji: 'Hezara Fêrbûnê' },
    description: { Sorani: '١٠٠٠ خاڵی توانستت کۆکردەوە', Kurmanji: 'Te 1000 XP kom kir' },
    icon: 'star',
    requirement: (s) => s.xp >= 1000,
    color: 'bg-yellow-600'
  },
  {
    id: 'xp_5000',
    category: 'xp',
    title: { Sorani: 'ئەستێرەی فێرگا', Kurmanji: 'Stêra Fêrgayê' },
    description: { Sorani: '٥٠٠٠ خاڵ! ئەتۆ ئەفسانەییت', Kurmanji: '5000 XP! Tu efsane yî' },
    icon: 'trophy',
    requirement: (s) => s.xp >= 5000,
    color: 'bg-amber-500'
  },

  // --- STREAK HEROES ---
  {
    id: 'streak_3',
    category: 'streak',
    title: { Sorani: 'گوڕی فێربوون', Kurmanji: 'Taya Fêrbûnê' },
    description: { Sorani: '٣ ڕۆژ بەردەوامی لە فێربوون', Kurmanji: '3 roj berdewamiya fêrbûnê' },
    icon: 'flame',
    requirement: (s) => s.streak >= 3,
    color: 'bg-orange-500'
  },
  {
    id: 'streak_7',
    category: 'streak',
    title: { Sorani: 'هەفتەیەکی پڕ مانا', Kurmanji: 'Hefteyek tije wate' },
    description: { Sorani: '٧ ڕۆژ بێ وەستان فێربووی', Kurmanji: '7 roj bê rawestiyan' },
    icon: 'calendar',
    requirement: (s) => s.streak >= 7,
    color: 'bg-red-500'
  },
  {
    id: 'streak_30',
    category: 'streak',
    title: { Sorani: 'پشوودرێژی کوردانە', Kurmanji: 'Bîhnfirehiya Kurdî' },
    description: { Sorani: 'مانگێکی تەواو بەردەوام بوویت', Kurmanji: 'Mehekê te berdewam kir' },
    icon: 'crown',
    requirement: (s) => s.streak >= 30,
    color: 'bg-indigo-600'
  },

  // --- DIALECT SPECIFIC ---
  {
    id: 'sorani_expert',
    category: 'dialects',
    title: { Sorani: 'شارەزای سۆرانی', Kurmanji: 'Pisporê Soranî' },
    description: { Sorani: '٥ وانەی سۆرانیت تەواو کرد', Kurmanji: 'Te 5 dersên Soranî qedandin' },
    icon: 'languages',
    requirement: (s) => (s.dialectCounts?.Sorani || 0) >= 5,
    color: 'bg-rose-500'
  },
  {
    id: 'kurmanji_expert',
    category: 'dialects',
    title: { Sorani: 'شارەزای کورمانجی', Kurmanji: 'Pisporê Kurmancî' },
    description: { Sorani: '٥ وانەی کورمانجیت تەواو کرد', Kurmanji: 'Te 5 dersên Kurmancî qedandin' },
    icon: 'languages',
    requirement: (s) => (s.dialectCounts?.Kurmanji || 0) >= 5,
    color: 'bg-yellow-500'
  },
  {
    id: 'hawrami_expert',
    category: 'dialects',
    title: { Sorani: 'شارەزای هەورامی', Kurmanji: 'Pisporê Hewramî' },
    description: { Sorani: '٢ وانەی هەورامیت تەواو کرد', Kurmanji: 'Te 2 dersên Hewramî qedandin' },
    icon: 'languages',
    requirement: (s) => (s.dialectCounts?.Hawrami || 0) >= 2,
    color: 'bg-green-600'
  },
  {
    id: 'zazaki_expert',
    category: 'dialects',
    title: { Sorani: 'شارەزای زازاکی', Kurmanji: 'Pisporê Zazakî' },
    description: { Sorani: '٢ وانەی زازاکیت تەواو کرد', Kurmanji: 'Te 2 dersên Zazakî qedandin' },
    icon: 'languages',
    requirement: (s) => (s.dialectCounts?.Zazaki || 0) >= 2,
    color: 'bg-purple-600'
  },
  {
    id: 'luri_expert',
    category: 'dialects',
    title: { Sorani: 'شارەزای لوڕی', Kurmanji: 'Pisporê Lurî' },
    description: { Sorani: '٢ وانەی لوڕیت تەواو کرد', Kurmanji: 'Te 2 dersên Lurî qedandin' },
    icon: 'languages',
    requirement: (s) => (s.dialectCounts?.Luri || 0) >= 2,
    color: 'bg-blue-600'
  },

  // --- SPECIAL MIX ---
  {
    id: 'polyglot',
    category: 'dialects',
    title: { Sorani: 'فێرخوازی گشتگیر', Kurmanji: 'Xwendekarê Giştî' },
    description: { Sorani: 'لە هەموو شێوەزارەکان وانەت خوێندوە', Kurmanji: 'Te di her devokekê de ders xwendine' },
    icon: 'globe',
    requirement: (s) => Object.keys(s.dialectCounts || {}).length >= 5,
    color: 'bg-teal-500'
  }
];

const KhaniPoetMascot = ({ className = "w-32 h-32", mood = 'happy', onClick }: { className?: string, mood?: 'happy' | 'thinking' | 'wink', onClick?: () => void }) => (
  <motion.div 
    onClick={onClick}
    whileHover={onClick ? { scale: 1.05, rotate: [0, -2, 2, 0] } : {}}
    whileTap={onClick ? { scale: 0.95 } : {}}
    animate={mood === 'happy' ? { y: [0, -5, 0], scale: [1, 1.02, 1] } : mood === 'thinking' ? { scale: [1, 0.98, 1], rotate: [-1, 1, -1] } : {}}
    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    className={`${className} relative overflow-hidden rounded-full bg-[#1a1c2c] border-4 border-amber-900/30 shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
  >
    <img 
      src={KHANI_LOGO} 
      onError={(e) => {
          if (e.currentTarget.src.includes(KHANI_LOGO)) {
              e.currentTarget.src = 'khani.png';
          }
      }}
      alt="Ehmedê Xanî" 
      className={`w-full h-full object-contain scale-110 brightness-110 contrast-110 ${mood === 'thinking' ? 'grayscale' : ''}`}
      referrerPolicy="no-referrer"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />
  </motion.div>
);

const dialectAlphabets: Record<string, { chars: { char: string; desc: { Sorani: string; Kurmanji: string } }[] }> = {
  sorani: {
    chars: [
      { char: "ڕ", desc: { Sorani: "ڕی قورس: بە دەنگێکی بەهێزتر دەردەبڕدرێت وەک لە 'ر'ی ئاسایی.", Kurmanji: "ڕ (R): Bi dengekî xurttir tê derxistin ji 'r'ya asayî." } },
      { char: "ڵ", desc: { Sorani: "ڵی قورس: لە دواوەی زمان دەردەبڕدرێت وەک لە 'وڵات'.", Kurmanji: "ڵ (L): Ji paşiya zimên tê derxistin wek di 'Welat' de." } },
      { char: "ڤ", desc: { Sorani: "پیتی ڤ: دەنگێکی هاوشێوەی 'V'ی ئینگلیزی هەیە. نموونە: 'تاڤگە'.", Kurmanji: "Tîpa ڤ (V): Dengê 'V' yê îngilîzî dide. Mînak: 'Tavge'." } },
      { char: "ۆ", desc: { Sorani: "پیتی ۆ: دەنگی 'O'یەکی درێژ دەدات.", Kurmanji: "Tîpa ۆ (O): Dengê 'O'yekî dirêj dide." } },
      { char: "ێ", desc: { Sorani: "پیتی ێ: دەنگی 'E'یەکی درێژ دەدات (وەک 'Hey').", Kurmanji: "Tîpa ێ (E): Dengê 'E'yekî dirêj dide (wek 'Hey')." } }
    ]
  },
  kurmanji: {
    chars: [
      { char: "Ç", desc: { Sorani: "پیتی Ç: دەنگی 'چ' دەدات. نموونە: 'Çav' (چاو).", Kurmanji: "Tîpa Ç: Dengê 'ç' dide. Mînak: 'Çav'." } },
      { char: "Ş", desc: { Sorani: "پیتی Ş: دەنگی 'ش' دەدات. نموونە: 'Şew' (شەو).", Kurmanji: "Tîpa Ş: Dengê 'ş' dide. Mînak: 'Şew'." } },
      { char: "Ê", desc: { Sorani: "پیتی Ê: دەنگی 'ێ'ی سۆرانی دەدات. نموونە: 'Dê'.", Kurmanji: "Tîpa Ê: Dengê 'ê' ya Soranî dide. Mînak: 'Dê'." } }
    ]
  },
  hawrami: {
    chars: [
      { char: "ۆ", desc: { Sorani: "ۆ (O): لە هەورامیدا زۆر ناو دەستنیشان دەکات لە کۆتایی وشە.", Kurmanji: "ۆ (O): Di Hewramî de ji bo nîşandana navan tê bikaranîn." } },
      { char: "ڎ", desc: { Sorani: "ڎ: ئەم پیتە تایبەتە بە هەورامی، دەنگێکی 'د'ی قورسی هەیە.", Kurmanji: "ڎ: Ev tîp taybet e bi Hewramî, dengê 'd'yek xurt e." } },
      { char: "ێ", desc: { Sorani: "ێ (E): دەنگی 'ێ'ی درێژ لە کۆتایی ناوە مێینەکاندا زۆرە.", Kurmanji: "ێ (E): Dengê 'ê' yê dirêj di navên mê de pir heye." } }
    ]
  },
  zazaki: {
    chars: [
      { char: "Ğ", desc: { Sorani: "Ğ: پیتی 'غ'ی سۆرانییە کە بە شێوەیەکی نەرم دەردەبڕدرێت.", Kurmanji: "Ğ: Tîpa 'ğ' ye ku bi dengekî nerm tê xwendin." } },
      { char: "Ê", desc: { Sorani: "Ê: پیتی 'ێ'ی سۆرانی دەدات. نموونە: 'Zerrê'.", Kurmanji: "Ê: Dengê 'ê' ya Soranî dide. Mînak: 'Zerrê'." } },
      { char: "Û", desc: { Sorani: "Û: دەنگی 'وو'ی سۆرانی دەدات.", Kurmanji: "Û: Dengê 'û' yê dirêj (wek 'û' ya Soranî) dide." } }
    ]
  },
  luri: {
    chars: [
      { char: "ڤ", desc: { Sorani: "ڤ: ئەم دەنگە لە زۆربەی زاراوەکانی لوڕیدا بە باوی بەکاردێت.", Kurmanji: "ڤ (V): Ev deng di piraniya devokên Lurî de bi kar tê." } },
      { char: "ۆ", desc: { Sorani: "ۆ: دەنگێکی کورت و خێرایە لە هەندێک وشەی لوڕیدا.", Kurmanji: "ۆ: Dengê 'O'yê ye ku di Lurî de xurt e." } }
    ]
  }
};


const uiLabels = {
  Sorani: {
    title: 'فێرگەی خانی',
    home: 'سەرەکی',
    leaderboard: 'ڕیزبەندی',
    profile: 'ناسنامە',
    interface: 'ڕووکاری ئەپ',
    target: 'زاراوە',
    lesson: 'وانە',
    start: 'دەستپێبکە',
    learned: 'تەواو',
    continue: 'بەردەوام بە',
    back: 'بەرەوپاش',
    lessonPrefix: 'وانەی',
    gems: 'گەوهەر',
    streak: 'بەردەوامی',
    unit: 'ئاستی',
    check: 'بپشکنە',
    correct: 'ناوازەیە!',
    wrong: 'هەڵەیە، وەڵامی ڕاست:',
    completeTitle: 'ئاستەکە تەواو بوو!',
    xp: 'توانست',
    accuracy: 'دروستی',
    tip: 'ئامۆژگاری فێرگا',
    email: 'پەیامی ئەلیکترۆنی',
    login: 'چوونەژوورەوە',
    logout: 'چوونەدەرەوە',
    locked: 'داخراوە',
    loginTitle: 'فێرگەی خانی: فێربوونی شێوەزارە کوردییەکان',
    googleLogin: 'چوونەژوورەوە بە گووگڵ',
    sounds: 'دەنگەکان',
    music: 'میوزیک',
    on: 'داگیرساو',
    off: 'کوژاوە',
    save: 'پاشەکەوت',
    edit: 'چاکسازی',
    displayName: 'ناو',
    upload: 'دانانی وێنە',
    dailyGoal: 'ئامانجی ڕۆژانە',
    completed: 'تەواو کراوە',
    grammar: 'فێرگەی شێوەزارەکان',
    darkMode: 'دۆخی تاریک',
    theme: 'ڕووکار',
    compareGrammar: 'بەراوردی ڕێزمان',
    selectDialects: 'زاراوەکان هەڵبژێرە',
    difference: 'جیاوازییەکان',
    translator: 'وەرگێڕ',
    flashcards: 'فلاشکارد',
    explore: 'گەڕان لە ڕێزمان',
    history: 'مێژوو',
    deleteAccount: 'سڕینەوەی هەژمار',
    confirmDelete: 'ئایا دڵنیایت لە سڕینەوەی هەژمارەکەت؟ ئەم کارە ناگەڕێتەوە.',
    open: 'بیکەرەوە',
    checking: 'لە پشکنیندایە...',
    idiom: 'پەند',
    rankingTab: 'ڕیزبەندی',
    achievementsTab: 'دەستکەوتەکان',
    aboutUs: 'دەربارەی ئێمە',
    bio: 'بایۆ',
    banner: 'بەرگ',
    level: 'لیڤڵ',
    lessonsCompleted: 'وانە تەواوبووەکان',
    mission: 'ئامانج',
    team: 'تیم',
    culture: 'کولتوور و زمان',
    missionDesc: 'فێرگە هەوڵێکە بۆ پاراستن و برەودان بە شێوەزارە جیاوازەکانی زمانی کوردی و نزیککردنەوەی نەوەی نوێ لە ڕەچەڵەک و مێژووی خۆی.',
    teamDesc: 'ئێمە گروپێک لە دڵسۆزانی زمان و تەکنەلۆژیاین کە دەمانەوێت بە ئامرازە نوێیەکان خزمەت بە زمانی دایک بکەین.',
    cultureDesc: 'زمانی کوردی یەکێکە لە دەوڵەمەندترین زمانەکان و فێربوونی شێوەزارەکانی نیشانەی زیندوویی و یەکڕیزی کولتووری ئێمەیە.',
    fontSize: 'قەبارەی فۆنت',
    smallText: 'بچووک',
    mediumText: 'ناوه‌ند',
    largeText: 'گەورە',
    notes: 'تێبینی زمان'
  },
  Kurmanji: {
    title: 'Fêrga Xanî',
    home: 'Sereke',
    leaderboard: 'Rêzbendî',
    profile: 'Nasname',
    interface: 'Mijara Pergalê',
    target: 'Devok',
    lesson: 'Ders',
    start: 'Dest pê bike',
    learned: 'Qetiya',
    continue: 'Berdewam bike',
    back: 'Vegere',
    lessonPrefix: 'Dersa',
    gems: 'Gewher',
    streak: 'Berdewamî',
    unit: 'Asta',
    check: 'Kontrol bike',
    correct: 'Nayab e!',
    wrong: 'Şaş e, bersiva rast:',
    completeTitle: 'Asta te qediya!',
    xp: 'Hêz',
    accuracy: 'Durustî',
    tip: 'Şîreta Fêrgehê',
    email: 'E-mail',
    login: 'Têketin',
    logout: 'Derketin',
    locked: 'Girtî ye',
    loginTitle: 'Fêrga Xanî: Fêrbûna devokên kurdî',
    googleLogin: 'Bi Google têkeve',
    sounds: 'Deng',
    music: 'Muzîk',
    on: 'Vekirî',
    off: 'Girtî',
    save: 'Tomar bike',
    edit: 'Caksazî',
    displayName: 'Nav',
    upload: 'Wêne barkirin',
    dailyGoal: 'Armanca rojane',
    completed: 'Qediya ye',
    grammar: 'Fêrgeya Devokan',
    darkMode: 'Mijara Tarî',
    theme: 'Mijar',
    compareGrammar: 'Berawirdkirina Rêzimanê',
    selectDialects: 'Devokan hilbijêre',
    difference: 'Cudahî',
    translator: 'Wergera Devokan',
    flashcards: 'Flashcards',
    explore: 'Lêgerîna rêzimanê',
    history: 'Dîrok',
    deleteAccount: 'Hesab jê bibe',
    confirmDelete: 'Ma tu ji jêbirina hesaba xwe bawer î? Ev kiryar nayê vegerandin.',
    open: 'Veke',
    checking: 'Tê kontrolkirin...',
    idiom: 'Biwêja Astê',
    rankingTab: 'Rêzbendî',
    achievementsTab: 'Destkeftin',
    aboutUs: 'Derbarê Me',
    level: 'Lîvel',
    lessonsCompleted: 'Wanên Temambûyî',
    mission: 'Mîsyon',
    team: 'Tîm',
    culture: 'Çand û Ziman',
    missionDesc: 'Fêrge hewildanek e ji bo parastin û pêşvebirina devokên cihêreng ên zimanê kurdî û nêzîkkirina nifşê nû ji koka xwe û dîroka xwe.',
    teamDesc: 'Em komek dilxwazên ziman û teknolojiyê ne ku dixwazin bi amûrên nûjen xizmeta zimanê dayikê bikin.',
    cultureDesc: 'Zimanê kurdî yek ji zimanên herî dewlemend e û fêrbûna devokên wî nîşana zindîbûn û yekitiya çanda me ye.',
    fontSize: 'Mezinahiya Fontê',
    smallText: 'Biçûk',
    mediumText: 'Navîn',
    largeText: 'Mezin',
    notes: 'Têbîniyên Ziman',
    bio: 'Biyo',
    banner: 'Berper'
  }
};

const getUnitAdvice = (unitId: number) => {
    const advice: Record<number, { 
      sorani: string, 
      kurmanji: string, 
      idiomSorani?: string, 
      meaningSorani?: string,
      idiomKurmanji?: string,
      meaningKurmanji?: string 
    }> = {
      1: {
        sorani: "بنەماکان بناغەی زمانن. سڵاوکردن لە کولتووری کوردیدا نیشانەی ڕێز و کردنەوەی دەرگای دڵە. هەوڵ بدە لە دەربڕینی وشەکاندا ئاوازی زمانەکە بپارێزیت. فێربوونی پیتەکان و دەنگەکان یەکەم هەنگاوە بەرەو جیهانێکی نوێ.",
        kurmanji: "Bingeh bingeha ziman in. Silavdayîn di çanda Kurdî de nîşana rêzgirtinê û vekirina deriyên dil e. Hewl bide di axaftina peyvan de muzîka ziman biparêzî. Hînbûna tîp û bengan gava yekem e ber bi cîhanek nû.",
        idiomSorani: "دەست پێ بکەی کار نیوەی تەواو بووە",
        meaningSorani: "هەر کارێک دەست پێ بکەیت، وەک ئەوە وایە نیوەیت بڕیبێت.",
        idiomKurmanji: "Destpêkirin nîvê xelasîyê ye",
        meaningKurmanji: "Heke tu dest bi karekî bikî, te nîvê wî xelas kiriye."
      },
      2: {
        sorani: "خێزان و ماڵ و خواردن، سێکوچکەی ژیانی کوردەوارین. ناسینی ناوەکانی خزمایەتی و پێکهاتەی خواردنەکان، تۆ دەباتە ناو قووڵایی میوانداری و خەسڵەتی خێزانی کورد. هەرگیز لە بیرت نەچێت کە سفرەی کورد هەمیشە بۆ میوان ئاوەڵایە.",
        kurmanji: "Malbat, mal û xwarin, bingeha jiyana Kurdewarî ne. Naskirina navên xizmtiyê û pêkhateyên xwarinan, te dimeşîne kûrahiya mêvandarî û taybetmendiya malbata Kurd.",
        idiomSorani: "ماڵ بە مێوان ئاوایە",
        meaningSorani: "میوان بەرەکەت بۆ ماڵ دەهێنێت و ماڵ قەدری دەگیرێت.",
        idiomKurmanji: "Mal bi mêvanan şên dibe",
        meaningKurmanji: "Mêvan bereketa malê ye û mal bi mêvanan tê naskirin."
      },
      3: {
        sorani: "سروشت و ئاژەڵان ناسنامەی چیاکانی کوردستانن. کورد و شاخ هەمیشە هاوڕێی یەک بوون. فێربوونی ئەم وشانە، پەیوەندیت لەگەڵ ژینگەی ڕەسەنی کوردستان بەهێز دەکات. پاراستنی ژینگە پاراستنی ژیانە.",
        kurmanji: "Xweza û heywan nasnameya çiyayên Kurdistanê ne. Kurd û çiya her tim hevalên hev bûne. Hînbûna van peyvan, têکiliya te ya bi jîngeha resen a Kurdistanê re xurtir dike.",
        idiomSorani: "چیا تەنیا هاوڕێی کوردە",
        meaningSorani: "ئاماژەیە بۆ مێژووی کورد کە هەمیشە شاخ پەناگەی بووە.",
        idiomKurmanji: "Çiya tenê hevalên Kurdan in",
        meaningKurmanji: "Nîşana wê yekê ye ku çiya her tim bûne star û parêzerê Kurdan."
      },
      4: {
        sorani: "کردارەکان هێز دەدەنە دەربڕینەکانت و جەستەش ئامرازی جێبەجێکردنیانە. فێربوونی کردارە بنەڕەتییەکان و تێگەیشتن لە جەستەی مرۆڤ، بنەمایەکی گرنگە بۆ گفتوگۆیەکی زیندوو. زمان بە کردارەوە دەدرەوشێتەوە.",
        kurmanji: "Lêker hêzê didin derbirînên te û gewde jî amraza pêkanîna wan e. Hînbûna lêkerên bingehîn û fêmkirina gewdeyê mirovan, bingehê axaftineke zindî ye.",
        idiomSorani: "بەردی گەورە نیشانەی نەهاویشتنە",
        meaningSorani: "کاتێک کەسێک بەڵێنی گەورە دەدات بەڵام توانای نییە.",
        idiomKurmanji: "Berê mezin nîşana neavêtinê ye",
        meaningKurmanji: "Dema kesek armancên pir mezin datîne lê baweriya wî bi xwe nîn e."
      },
      5: {
        sorani: "ڕەنگەکان و کات و وەسف، جوانی دەدەنە زمان. لە کەلتووری کوردیدا ڕەنگەکان مانا و هێمای جیاوازیان هەیە و کاتیش بەپێی وەرزەکان و سروشت گوزارشتی لێ دەکرێت. هەر ساتێک دەرفەتێکە بۆ فێربوون.",
        kurmanji: "Reng, dem û wesf, bedewiyê didin ziman. Di çanda Kurdî de reng xwedî wateyên cuda ne û dem jî li gorî werz û xweزayê tê derbirîn.",
        idiomSorani: "کات وەک زێڕ وایە",
        meaningSorani: "کات زۆر بەنرخە و نابێت بە فیڕۆ بدرێت.",
        idiomKurmanji: "Dem zêr e",
        meaningKurmanji: "Wext pir bi qîmet e û nabe ku vala here."
      },
      6: {
        sorani: "زانست و خوێندن کلیلی داهاتوویەکی ڕووناکە. بەکارهێنانی زاراوە ئەکادیمی و زانستییەکان بە زمانی دایک، یارمەتیدەرە بۆ گەشەسەندنی فیکری و پاراستنی زمان لە فەوتان. هەوڵ بدە هەمیشە بەدوای زانیندا بگەڕێیت.",
        kurmanji: "Zanist û xwendin kilîta pašerojeke ronî ye. Bikaranîna terîmên akademîк û زانیstî bi zimanê dayikê, alîkar e ji bo gešepêdana fikrî û parastina ziman.",
        idiomSorani: "خوێندن ڕووناکییە",
        meaningSorani: "زانست مێشک و ژیان ڕووناک دەکاتەوە.",
        idiomKurmanji: "Xwendin ronahî ye",
        meaningKurmanji: "Zanîn û xwendin riya jiyanê ronî nikin."
      },
      7: {
        sorani: "ژمارەکان زمانی ژاکاو و بازرگانی و هەموو بوارەکانی ژیانن. بێ زانینی ژمارەکان، پەیوەندییە دارایی و کاتییەکانی مرۆڤ پەکدەست دەبن. ژماردن و حسابکردن بەشێکی دانەبڕاوی ڕۆژانەیە.",
        kurmanji: "Hejmar zimanê بازرگانی û hemû qadên jiyanê ne. Bêyî naskirina hejmaran, têکiliyên darayî û yên demê yên mirovan kêm dimînin.",
        idiomSorani: "حساب حسابە، کاکا برایە",
        meaningSorani: "لە کار و حسابدا دەبێت ورد بیت، تەنانەت لەگەڵ نزیکترین کەسیش.",
        idiomKurmanji: "Hesab hesab e, bira bira ye",
        meaningKurmanji: "Divê di کار û حساب de meriv cidî be, her چiqas dostanî hebe jî."
      },
      8: {
        sorani: "مێژوو و کەلتوور ڕەگی قووڵی نەتەوەن. ناسینی شوێنەوار و دەستنووس و ڕووداوە مێژووییەکان، زانیاریت لەسەر شووناس و ڕەسەنایەتی خۆت زیاد دەکات. نەتەوەی بێ مێژوو وەک داری بێ ڕەگ وایە.",
        kurmanji: "Dîrok û čand koka kûr a neteweyan in. Naskirina šûnewar, destnivîs û rûdanên dîrokî, zaniariyan li ser nasname û resenatiya te zêde dike.",
        idiomSorani: "داری بێ ڕەگ وشک دەبێت",
        meaningSorani: "کەسێک کە ڕابردوو و کەلتووری خۆی لەبیر بکات، داهاتووی نابێت.",
        idiomKurmanji: "Darê bê kok hišk dibe",
        meaningKurmanji: "Mirovê ku čand û koka xwe nas neke, zû winda dibe."
      },
      9: {
        sorani: "میوەکان سەرچاوەی وزە و بەشی دانەبڕاوی کوردستانن. کوردستان بە هەنار و هەنجیر و سێوی جیاواز بەناوبانگە کە هەریەکەیان چیرۆکێکی کشتوکاڵی و خۆشییان هەیە. لێرەدا فێری دەبیت چۆن وەسفی تامی خۆشی میوەکان بکەیت.",
        kurmanji: "Fêkî čavkaniya enerjiyê û bešeke bingehîn a Kurdistanê ne. Kurdistan bi henar, hejîr û sêvên xwe yên cuda navdar e.",
        idiomSorani: "میوەی گەییو بۆ خۆی دەکەوێت",
        meaningSorani: "کارێک کاتەکەی هات، بۆ خۆی جێبەجێ دەبێت و پێویستی بە پەلە نییە.",
        idiomKurmanji: "Fêkiyê gihîštî xwe bi xwe dikeve",
        meaningKurmanji: "Dema wextê tištekî hat, ew bi serê خۆ پێک tê."
      },
      10: {
        sorani: "سەوزەکان بنەمای سفرەی تەندروستی کوردین. زۆرێک لە سەوزە کێوییەکانی ناو چیاکانی کوردستان، هەم خواردن و هەم دەرمانی سروشتین. فێربونی ناوی ئەمانە یارمەتیت دەدات بۆ تێگەیشتن لە کەلتووری خواردەمەنی.",
        kurmanji: "Sebze bingeha sifreya tendurist a Kurdî ne. Gelek ji sebzeyên kovî yên li čiyayên Kurdistanê, hem xwarin û hem jî dermanên xweزayî ne.",
        idiomSorani: "سەوزە بە ئاو شین دەبێت",
        meaningSorani: "هەر شتێک پێویستی بە سەرچاوە و یارمەتی هەیە بۆ ئەوەی گەشە بکات.",
        idiomKurmanji: "Sebze bi avê شîn dibe",
        meaningKurmanji: "Her tišt bi ked û alîkariyê geش dibe, bê čavkanî nabe."
      },
      11: {
        sorani: "گەشت و سەفەر ئاسۆی بیرکردنەوە فراوان دەکات. فێربوونی ناوی شوێنەکان و وشەی گەشتوگوزار، یارمەتیدەرە بۆ ئەوەی لە هەر گەشتێکدا باشتر پەیوەندی ببەستیت. گەورەیی جیهان لە گەشتدا دەبینرێت.",
        kurmanji: "Gešt û sefar asoya ramanê firehtir dike. Hînbûna navên cîhan û peyvên geštiyariyê, alîکار e daku tu di ہر geštekê de têkiliyeke baštir deynî.",
        idiomSorani: "گەشت زانیارییە",
        meaningSorani: "بینینی وڵاتان و شوێنە جیاوازەکان وەک خوێندنەوەی کتێبێک وایە.",
        idiomKurmanji: "Ger û gešt zanyarî ye",
        meaningKurmanji: "Mirov ہر ku bigere, ew qas zilm û zanێنê زêde dike."
      },
      12: {
        sorani: "کار و بازرگانی کۆڵەکەی ئابوورین. زانینی ئەم زاراوانە لە جیهانی کاردا، دەرفەتی زیاترت بۆ دەڕەخسێنێت و متمانە بە زمانەکەت زیاتر دەکات. قسە و مامەڵە لە بازاڕدا هونەرە.",
        kurmanji: "Kar û بازرگانی stûnên aboriyê ne. Zanîna van terîمان di cîhana کار de, derfetên زêdetir ji bo te peyda dike û baweriya te bi zمانê te زêdetir dike.",
        idiomSorani: "دەست و برد لە کاردا فەرزە",
        meaningSorani: "دەبێت لە کاردا خێرا و لێهاتوو بیت بۆ ئەوەی سەرکەوتوو بیت.",
        idiomKurmanji: "Dest û ling di kar de pir girîng in",
        meaningKurmanji: "Divê mirov di kar de čust û čalak be da ku serketî bibe."
      },
      13: {
        sorani: "هونەر و ئەدەب زمانی ڕۆحی کوردین. شیعر و موزیک هەمیشە هاوڕێی مێژووی پڕ هەور و نشێوی ئێمە بوون و پارێزەری شووناسمان بوون. لێرەدا دەچیتە ناو دڵی چاند و فەرهەنگ.",
        kurmanji: "Huner û edeb zimanê ruhê Kurdî ne. Helbest û موزîک ہر tim hevalên dîroka me ya dagirtî bi bilindî û nizmiyan bûne.",
        idiomSorani: "هونەر قەدری هەیە",
        meaningSorani: "کەسێک بەهرەیەکی هەبێت، هەمیشە جێگەی ڕێزە لە ناو خەڵکدا.",
        idiomKurmanji: "Huner hejayî ڕêزê ye",
        meaningKurmanji: "Kesê xwedî huner, di nav civakê de ہر tim bi qîmet e."
      },
      14: {
        sorani: "تەندروستی و هەستەکان دووانەیەکی گرنگی مرۆڤن. گوزارشتکردن لە ئازار و خۆشی، و تێگەیشتن لە باری تەندروستی، یەکەم هەنگاوە بۆ ژیانێکی باشتر. مێشکی ساغ لە لەشی ساغدایە.",
        kurmanji: "Tenduristî û hest duwemeke girîng a mirov in. Derbirîna êš û šahiyan, û fêmkirina rewšta tenduristiyê, gava yekem e bo jiyaneke baštir.",
        idiomSorani: "تەندروستی تاجی سەرە",
        meaningSorani: "مرۆڤ کە تەندروست بێت، دەوڵەمەندترین و بەهێزترین کەسە.",
        idiomKurmanji: "Tenduristî tac e li ser سرê mirovan",
        meaningKurmanji: "Mirovê saxlem mîna padîšah e, tenduristî dewlemendiya هری mezin e."
      },
      15: {
        sorani: "ئاستی پێشکەوتوو واتە قووڵبوونەوە لە فیکر و فەلسەفەی زمان. لێرەدا تۆ واتای وشەکان لە چوارچێوەیەکی فراوانتر و ژیرانەتردا بەکاردەهێنیت. ئێستا تۆ دەتوانی ببی بە مامۆستایەک بۆ ئەوانی تریش.",
        kurmanji: "Asta پێšketî tê wateya kûrbûna di fikir û felsefeya ziman de. Li vir tu wateya peyvan di čarčoveyeke berfirehtir û biaqiltir de bi kar tînî.",
        idiomSorani: "زانیاری بێ سنوورە",
        meaningSorani: "هەرچەند فێری šت ببێن، هێشتا بوار ماوە بۆ زانینی زیاتر.",
        idiomKurmanji: "Zanîn bê سînor e",
        meaningKurmanji: "Zanîn mîna دایێ ye, kûr be jî tu qet nagiheyî dawiyê."
      }
    };
    return advice[unitId] || { sorani: "", kurmanji: "" };
  };
const getUnitData = (target: TargetDialect, interfaceLang: InterfaceLang, appConfig: any): Unit[] => {
  const isSorani = interfaceLang === 'Sorani';
  const dialectKey = target.toLowerCase() as 'sorani' | 'kurmanji' | 'hawrami' | 'zazaki' | 'luri';
  const interfaceKey = interfaceLang.toLowerCase() as 'sorani' | 'kurmanji' | 'hawrami' | 'zazaki' | 'luri';

  const getDialectName = (d: string) => {
    const names: Record<string, string> = {
      Sorani: isSorani ? 'سۆرانی' : 'Soranî',
      Kurmanji: isSorani ? 'کورمانجی' : 'Kurmancî',
      Hawrami: isSorani ? 'ھەورامی' : 'Hewramî',
      Luri: isSorani ? 'لوڕی' : 'Lurî',
      Zazaki: isSorani ? 'زازاکی' : 'Zazakî'
    };
    return names[d] || d;
  };

  const getPronoun = (p: string) => (kurdishDictionary.pronouns as any)[p]?.[dialectKey] || p;

  const baseDict = kurdishDictionary.dictionary;
  const extraDict = appConfig?.customDictionary || [];
  const academicDict = [...baseDict, ...extraDict];
  
  const unitDefinitions = [
    { id: 1, categories: ['Greetings', 'Basics'], name: isSorani ? 'دەسپێکی زمان' : 'Seretayê Ziman', theme: 'from-rose-600 to-amber-600', motif: 'sun' },
    { id: 2, categories: ['Family', 'Home', 'Food'], name: isSorani ? 'خێزان و خاک' : 'Malbat u Ax', theme: 'from-emerald-600 to-teal-700', motif: 'tree' },
    { id: 3, categories: ['Nature', 'Animals'], name: isSorani ? 'گەردوون و سروشت' : 'Gerdûn u Xweza', theme: 'from-sky-600 to-indigo-700', motif: 'mountain' },
    { id: 4, categories: ['Verbs', 'Body'], name: isSorani ? 'جێبەجێکردن و جەستە' : 'Lêker u Gewde', theme: 'from-violet-600 to-purple-700', motif: 'star' },
    { id: 5, categories: ['Colors', 'Adjectives', 'Time'], name: isSorani ? 'جوانی و مێژوو' : 'Bedewî u Dîrok', theme: 'from-orange-600 to-red-700', motif: 'diamond' },
    { id: 6, categories: ['Education', 'Science'], name: isSorani ? 'زانست و بیرکاری' : 'Zanist u Matematîk', theme: 'from-blue-600 to-cyan-700', motif: 'book' },
    { id: 7, categories: ['Numbers'], name: isSorani ? 'ژمارە و بڕ' : 'Hejmar u Birr', theme: 'from-fuchsia-600 to-pink-700', motif: 'hexagon' },
    { id: 8, categories: ['History'], name: isSorani ? 'کەلتوور و ڕەسەنایەتی' : 'Kultûr u Resenatî', theme: 'from-amber-700 to-orange-800', motif: 'scroll' },
    { id: 9, categories: ['Fruits'], name: isSorani ? 'میوە بەتامەکان' : 'Fêkiyên Xweş', theme: 'from-yellow-500 to-orange-600', motif: 'circle' },
    { id: 10, categories: ['Vegetables'], name: isSorani ? 'سەوزە و تەندروستی' : 'Sebze u Tenduristî', theme: 'from-green-600 to-emerald-800', motif: 'leaf' },
    { id: 11, categories: ['Travel', 'Places'], name: isSorani ? 'گەشتیار و جیهان' : 'Geştyar u Cîhan', theme: 'from-cyan-600 to-blue-800', motif: 'map' },
    { id: 12, categories: ['Work', 'Business'], name: isSorani ? 'ئیش و بازرگانی' : 'Kar u Bazirganî', theme: 'from-slate-700 to-slate-900', motif: 'briefcase' },
    { id: 13, categories: ['Arts', 'Culture'], name: isSorani ? 'ئەدەب و هۆنراوە' : 'Edeb u Helbest', theme: 'from-rose-700 to-purple-900', motif: 'pen' },
    { id: 14, categories: ['Health', 'Emotions'], name: isSorani ? 'هەست و دڵشادی' : 'Hest u Dilşadî', theme: 'from-red-600 to-rose-800', motif: 'heart' },
    { id: 15, categories: ['Advanced'], name: isSorani ? 'تەواوکاری و زانست' : 'Temamkarî u Zanist', theme: 'from-zinc-700 to-zinc-900', motif: 'zap' }
  ];

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, React.ReactNode> = {
      Greetings: <Sparkles size={24} />,
      Basics: <Zap size={24} />,
      Family: <Users size={24} />,
      Home: <Home size={24} />,
      Food: <Heart size={24} />,
      Nature: <Sun size={24} />,
      Animals: <Brain size={24} />, // or a different one
      Verbs: <Play size={24} />,
      Body: <Type size={24} />,
      Colors: <Palette size={24} />,
      Adjectives: <Edit3 size={24} />,
      Numbers: <Star size={24} />,
      Time: <Calendar size={24} />,
      Education: <GraduationCap size={24} />,
      Science: <Brain size={24} />,
      Travel: <Globe size={24} />,
      Places: <MapPin size={18} />,
      Work: <Award size={24} />,
      Business: <Trophy size={24} />,
      Arts: <Music size={24} />,
      Culture: <ScrollText size={24} />,
      Health: <Heart size={24} />,
      Emotions: <Heart size={24} />,
      History: <History size={24} />,
      Grammar: <Library size={24} />,
      Advanced: <Crown size={24} />,
      Fruits: <Apple size={24} />,
      Vegetables: <Carrot size={24} />
    };
    return icons[cat] || <BookOpen size={24} />;
  };

  const getCategoryName = (cat: string) => {
    const cats: Record<string, string> = {
      Greetings: isSorani ? 'سڵاوکردن' : 'Silavdayîn',
      Basics: isSorani ? 'بنەماکان' : 'Bingehîn',
      Family: isSorani ? 'خێزان' : 'Malbat',
      Home: isSorani ? 'ماڵ' : 'Mal',
      Food: isSorani ? 'خواردن' : 'Xwarin',
      Nature: isSorani ? 'سروشت' : 'Xweza',
      Animals: isSorani ? 'ئاژەڵان' : 'Heywan',
      Verbs: isSorani ? 'کردارەکان' : 'Lêker',
      Body: isSorani ? 'جەستە' : 'Gewde',
      Colors: isSorani ? 'ڕەنگەکان' : 'Reng',
      Adjectives: isSorani ? 'هاوەڵناوەکان' : 'Hevalnav',
      Numbers: isSorani ? 'ژمارەکان' : 'Hejmar',
      Time: isSorani ? 'کاتەکان' : 'Dem',
      Education: isSorani ? 'پەروەردە' : 'Perwerde',
      Science: isSorani ? 'زانست' : 'Zanist',
      Travel: isSorani ? 'گەشت' : 'Geşt',
      Places: isSorani ? 'شوێنەکان' : 'Cîh',
      Work: isSorani ? 'کار' : 'Kar',
      Business: isSorani ? 'بازرگانی' : 'Bazirganî',
      Arts: isSorani ? 'هونەر' : 'Huner',
      Culture: isSorani ? 'کەلتوور' : 'Çand',
      Health: isSorani ? 'تەندروستی' : 'Tenduristî',
      Emotions: isSorani ? 'هەستەکان' : 'Hest',
      History: isSorani ? 'مێژوو' : 'Dîrok',
      Grammar: isSorani ? 'ڕێزمان' : 'Rêziman',
      Advanced: isSorani ? 'پێشکەوتوو' : 'Pêşketî'
    };
    return cats[cat] || cat;
  };

  const getSOVLesson = (target: TargetDialect, interfaceLang: InterfaceLang, unitId: number): Lesson => {
    const isSorani = interfaceLang === 'Sorani';
    const dialectId = target.toLowerCase();
    
    const contentMap: Record<string, any> = {
      sorani: {
        intro: {
          Sorani: "ڕستەسازی سۆرانی بەزۆری (بکەر - بەرکار - کردار)ـە. وەک: من نان دەخۆم.",
          Kurmanji: "Rêzimana Soranî (Biker - Berkar - Lêker) e. Wek: Min nan dexom."
        },
        idioms: [
          { 
            phrase: "هەموو شتێک بە خوێ، خوێش بە ماناوە.", 
            meaning: { Sorani: "هەموو شتێک پێویستی بە هاوسەنگی و ژیری هەیە.", Kurmanji: "Her tişt bi xwê, xwê jî bi manayê. Yanî her tişt bi hevsengî û zanyariyê xweş e." },
            context: { Sorani: "ئەم پەندە کاتێک بەکاردێت کە باس لە گرنگی عەقڵ و دانایی بکرێت لە کارەکاندا.", Kurmanji: "Ev pend dema ku qala girîngiya aqil û zanabûnê di karan de tê kirin, tê bikaranîn." }
          },
          {
            phrase: "خەریکی چییت؟",
            meaning: { Sorani: "بە واتای ئەوە دێت کە ئێستا چ دەکەیت؟", Kurmanji: "Tê wateya 'Tu bi çi re mijûl î?'" },
            context: { Sorani: "شێوازێکی باوی پرسینی بارودۆخی کەسێکە بە شێوەیەکی نافەرمی.", Kurmanji: "Şêweyekî asayî yê pirsîna rewşa kesekî ye bi awayekî nefermî." }
          }
        ],
        exercises: [
          { q: "نان دەخۆم من", a: "من نان دەخۆم", options: ["من", "نان", "دەخۆم"] },
          { q: "ئەو دەڕوات بۆ ماڵەوە", a: "ئەو بۆ ماڵەوە دەڕوات", options: ["ئەو", "بۆ", "ماڵەوە", "دەڕوات"] },
          { q: "ئێمە کوردین", a: "ئێمە کوردین", options: ["ئێمە", "کوردین"] }
        ]
      },
      kurmanji: {
        intro: {
          Sorani: "ڕستەسازی کرمانجی (Biker - Berkar - Lêker)ـە. وەک: Ez nanî dixwim.",
          Kurmanji: "Rêziknameya hevokan di Kurmancî de (Biker - Berkar - Lêker) e. Wek: Ez nanî dixwim."
        },
        idioms: [
          {
            phrase: "Şêr şêr e, çi jin e çi mêr e.",
            meaning: { Sorani: "شێر هەر شێرە، چ مێ بێت یان نێر. ئاماژەیە بۆ یەکسانی و ئازایەتی.", Kurmanji: "Şêr şêr e, heta jin be an mêr be. Nîşana wekhevî û wêrekiyê ye." },
            context: { Sorani: "ئەم پەندە بۆ نیشاندانی ئەوە بەکاردێت کە لێهاتوویی پەیوەندی بە ڕەگەزەوە نییە.", Kurmanji: "Ev pend ji bo nîşandana wê yekê tê bikaranîn ku huner û jêhatîbûn ne girêdayî zayendê ye." }
          },
          {
            phrase: "Çavê min li rê ye.",
            meaning: { Sorani: "چاوەڕێم یان بە تەمام.", Kurmanji: "Ez li benda te me an jî ez çavdar im." },
            context: { Sorani: "کاتێک بەکاردێت کە بە پەرۆشەوە چاوەڕێی هاتنی کەسێک یان ڕووداوێک بیت.", Kurmanji: "Dema ku tu bi kelecan li benda hatina kesekî an bûyerekî bî, tê bikaranîn." }
          }
        ],
        exercises: [
          { q: "dixwim nanî Ez", a: "Ez nanî dixwim", options: ["Ez", "nanî", "dixwim"] },
          { q: "diçî malê Tu", a: "Tu diçî malê", options: ["Tu", "diçî", "malê"] },
          { q: "Em kurd in", a: "Em kurd in", options: ["Em", "kurd", "in"] }
        ]
      },
      hawrami: {
        intro: {
          Sorani: "ڕستەسازی هەورامی (بکەر - بەرکار - کردار)ـە. وەک: من نان مۆرو.",
          Kurmanji: "Rêzimana Hewramî (Biker - Berkar - Lêker) e. Wek: Min nan mewanu."
        },
        idioms: [
          {
            phrase: "ڕاو مەلان ڕاو پووشین.",
            meaning: { Sorani: "ڕاستەوخۆ دەڵێت ڕێگای باڵندەکان بە کایە داپۆشراوە. مەبەست لێی ڕێگایەکی نادیار یان ناسکە.", Kurmanji: "Riya çivîkan bi kayê hatiye girtin. Yanî riyeke nediyar an jî nazik e." },
            context: { Sorani: "کاتێک بەکاردێت کە باس لە کارێکی قورس یان ڕێگایەکی نەزانراو بکرێت.", Kurmanji: "Dema ku qala karekî dijwar an riyeke nenas tê kirin, tê bikaranîn." }
          }
        ],
        exercises: [
          { q: "نان مۆرو من", a: "من نان مۆرو", options: ["من", "نان", "مۆرو"] },
          { q: "لۆ ماڵ ملۆ ئەو", a: "ئەو لۆ ماڵ ملۆ", options: ["ئەو", "لۆ", "ماڵ", "ملۆ"] }
        ]
      },
      luri: {
        intro: {
          Sorani: "ڕستەسازی لوڕی (بکەر - بەرکار - کردار)ـە. وەک: مه نون می هورم.",
          Kurmanji: "Rêzimana Lurî (Biker - Berkar - Lêker) e. Wek: Me nûn mi hwerum."
        },
        idioms: [
          {
            phrase: "تیەم ڕێ.",
            meaning: { Sorani: "چاو لە ڕێگام، واتە چاوەڕێم.", Kurmanji: "Çav li rê me, yanî ez li bendê me." },
            context: { Sorani: "بۆ دەربڕینی هەستی پەرۆشی بۆ بینینی کەسێک بەکاردێت.", Kurmanji: "Ji bo nîşandana hestê kelecaniyê ji bo dîtina kesekî tê bikaranîn." }
          }
        ],
        exercises: [
          { q: "می هورم نون مه", a: "مه نون mi هورم", options: ["مه", "نون", "mi", "هورم"] }
        ]
      },
      zazaki: {
        intro: {
          Sorani: "ڕستەسازی زازاکی (Biker - Berkar - Lêker)ـە. وەک: Ez nan wenan.",
          Kurmanji: "Rêzimana Zazakî (Biker - Berkar - Lêker) e. Wek: Ez nan wenan."
        },
        idioms: [
          {
            phrase: "Mase derya de nêroşîyeno.",
            meaning: { Sorani: "ماسی لە ناو دەریا نافرۆشرێت.", Kurmanji: "Masî di deryayê de nayê firotin." },
            context: { Sorani: "کاتێک بەکاردێت کە کەسێک بیەوێت شتێک بفرۆشێت کە هێشتا دەستی نەکەوتووە.", Kurmanji: "Gava ku kesek bixwaze tiştekî bifiroşe ku hîna bi dest nexistiye, tê gotin." }
          }
        ],
        exercises: [
          { q: "wenan nan Ez", a: "Ez nan wenan", options: ["Ez", "nan", "wenan"] }
        ]
      }
    };

    const current = contentMap[dialectId] || contentMap.sorani;
    const alphabetInfo = dialectAlphabets[dialectId];
    
    const exercises: Exercise[] = [];

    if (alphabetInfo) {
      alphabetInfo.chars.forEach((c, idx) => {
        exercises.push({
          id: `u-${unitId}-alpha-${idx}`,
          type: 'intro',
          question: isSorani ? `پیتی تایبەت: ${c.char}` : `Tîpa Taybet: ${c.char}`,
          answer: "",
          hint: (c.desc as any)[interfaceLang] || c.desc.Sorani,
          tip: isSorani 
            ? `ئەم پیتە "${c.char}" جیاکەرەوەیەکی گرنگی ئەم شێوەزارەیە.` 
            : `Ev tîpa "${c.char}" taybetmendiyeke girîng a vê devokê ye.`
        });
      });
    }

    /* Content for Idioms - restored and improved */
    const khaniIdioms = current.idioms || [];
    if (khaniIdioms.length > 0) {
      const idiom = khaniIdioms[Math.floor(Math.random() * khaniIdioms.length)];
      exercises.push({
        id: `u-${unitId}-idiom`,
        type: 'intro',
        question: isSorani ? "پەندی کوردی و دانایی" : "Pendê Kurdî u Zanabûn",
        answer: "",
        hint: `"${idiom.phrase}"`,
        tip: (idiom.meaning as any)[interfaceLang] || idiom.meaning.Sorani,
        khaniTip: (idiom.context as any)[interfaceLang] || idiom.context.Sorani
      });
    }

    exercises.push({
      id: `u-${unitId}-sov-intro`,
      type: 'intro',
      question: isSorani ? "بنەماکانی ڕستەسازی (SOV)" : "Bingehên Hevokê (SOV)",
      answer: "",
      hint: isSorani ? `بکەر + بەرکار + کردار` : `Biker + Berkar + Lêker`,
      tip: isSorani 
        ? "زۆربەی زمانە کوردییەکان پەیڕەوی ڕیزبەندی (SOV) دەکەن، بەڵام هەندێک شێوەزار لە باری دیاریکراودا جیاوازن."
        : "Piraniya zimanên Kurdî rêza (SOV) dişopînin, lê hinek devok di rewşên taybet de cuda ne.",
      khaniTip: isSorani 
        ? "خانی دەڵێت: 'ڕستە وەک تەنافێکە، ئەگەر کردار لە کۆتایی نەبێت هەموو شتێک دەپچڕێت'." 
        : "Xanî dibêje: 'Hevok wekî werîsekî ye, ger lêker li dawiyê nebe dê her tişt biqete'."
    });

    exercises.push(...current.exercises.map((ex: any, idx: number) => ({
      id: `u-${unitId}-sov-ex-${idx}`,
      type: 'construct' as const,
      question: isSorani ? "ڕستەکە ڕێکبخە:" : "Hevokê saz bike:",
      answer: ex.a,
      options: ex.options.sort(() => Math.random() - 0.5),
      hint: isSorani ? `بکەر + بەرکار + کردار` : `Biker + Berkar + Lêker`,
      tip: isSorani
        ? "بیری خۆت بخەرەوە کە کردار هەمیشە دەکەوێتە کۆتایی ڕستە."
        : "Bîne bîra xwe ku lêker her tim dikeve dawiya hevokê."
    })));

    return {
      id: (unitId * 1000) + 50, 
      unitId: unitId,
      title: isSorani ? "ڕستەسازی" : "Hevoksazî",
      category: isSorani ? "ڕێزمان" : "Rêziman",
      exercises: exercises
    };
  };

  return unitDefinitions.map(unitDef => {
    const unitWords = academicDict.filter(w => unitDef.categories.includes(w.category as string));
    const lessons: Lesson[] = [];
    const questionsPerLesson = 8;
    const lessonCount = Math.max(1, Math.ceil(unitWords.length / questionsPerLesson));

    for (let l = 0; l < lessonCount; l++) {
      const exercises: Exercise[] = [];
      const currentLessonWords = unitWords.slice(l * questionsPerLesson, (l + 1) * questionsPerLesson);
      
      // If no words in this category, skip
      if (currentLessonWords.length === 0) continue;

      // Add Intro Exercise at the start of each lesson
      const khaniQuotes = [
         { s: "فێربوونی زمان، کلیلی دەرگای ئازادییە.", k: "Fêrbûna ziman, kilîta deriyê azadiyê ye." },
         { s: "نەتەوەیەک زمانی خۆی پاراست، ناسنامەی خۆی پاراستووە.", k: "Neteweyek ger zimanê xwe biparêze, nasnameya xwe parastiye." },
         { s: "هەر وشەیەک دەیزانیت، پەنجەرەیەکە ڕووەو ڕووناکی.", k: "Her peyva ku tu dizanî, pencereyek e ber bi ronahiyê ve." },
         { s: "خوێندن و زانین هێزی ئێمەن.", k: "Xwendin u zanîn hêza me ne." }
      ];
      const randomQuote = khaniQuotes[Math.floor(Math.random() * khaniQuotes.length)];

      exercises.push({
        id: `u-${unitDef.id}-l-${l}-intro`,
        type: 'intro',
        question: isSorani ? `بەخێربێیت بۆ وانەی ${unitDef.name}` : `Bi xer hatî dersa ${unitDef.name}`,
        answer: "",
        hint: isSorani 
          ? `ئەمڕۆ فێری کۆمەڵێک وشەی گرنگ دەبین لە پۆلی "${getCategoryName(unitDef.categories[0])}".` 
          : `Îro em ê çend peyvên girîng di kategoriya "${getCategoryName(unitDef.categories[0])}" de hîn bibin.`,
        khaniTip: isSorani ? randomQuote.s : randomQuote.k
      });

      currentLessonWords.forEach((item, i) => {
        const targetWord = item[dialectKey]!;
        const interfaceWord = item[interfaceKey]!;

        const getDistractors = (count: number, current: string, key: any) => {
          const distractors: string[] = [];
          const words = academicDict;
          const startIdx = Math.floor(Math.random() * words.length);
          for (let k = 0; k < words.length && distractors.length < count; k++) {
            const word = words[(startIdx + k) % words.length];
            const val = (word as any)[key];
            if (val && val !== current && !distractors.includes(val)) {
                distractors.push(val);
            }
          }
          return distractors;
        };

        const getDialectHint = (item: any) => {
            const isVerb = item.category === 'Verbs';
            const cat = item.category;
            
            if (isVerb) {
                return isSorani 
                    ? `لە زمانی کوردیدا کردار ڕەگی ڕستەیە. بۆ نموونە "${item[dialectKey]}" لەم ڕستەیەدا چۆن دەبینیت؟` 
                    : `Di zimanê kurdî de lêker bingeha hevokê ye. Bo nimûne tu "${item[dialectKey]}" di vê hevokê de çawa dibînî?`;
            }
            if (cat === 'Greetings') {
                return isSorani
                    ? "سڵاوکردن لە کولتووری کوردیدا تەنها وشە نییە، بەڵکو دەسپێکی پەیوەندییەکی مرۆیی قووڵە. هەوڵ بدە جیاوازی نێوان سڵاوە فەرمی و نافەرمییەکان بزانیت."
                    : "Silavdayîn di çanda Kurdî de ne tenê peyv e, lê destpêka têkiliyeke mirovî ya kûr e. Hewl bide cudahiya di navbera silavên fermî û nefermî de hîn bibî.";
            }
            if (cat === 'Basics') {
                return isSorani
                    ? "بنەماکانی زمان وەک بناغەی خانوویەکن. تا بناغەکەت بەهێزتر بێت، زمانەکەت پاراوتر و پارێزراوتر دەبێت لە هەڵە."
                    : "Bingehên ziman mîna bingeha xaniyekî ne. Çiqas bingeha te bi hêz be, zimanê te ewqasî zelal û ji şaşiyan dûr dibe.";
            }
            if (cat === 'Family') {
                return isSorani
                    ? "خێزان چەقی کۆمەڵگای کوردییە. ناوناسینی خزمە نزیک و دوورەکان نیشانەی ڕێزگرتنە لە ڕەگ و ڕیشەی مرۆڤ."
                    : "Malbat navenda civaka Kurdî ye. Naskirina xizmên nêzîk û dûr nîşana rêzgirtina li koka mirov e.";
            }
            if (cat === 'Home') {
                return isSorani
                    ? "ماڵ لای کورد شوێنی حەوانەوە و میواندارییە. فێربوونی ناوی بەشەکانی ماڵ یارمەتیدەرە بۆ گوزارشتکردن لە ژیانی ڕۆژانەت."
                    : "Mal li ba Kurdan cîhê hêsanî û mêvandarî ye. Hînbûna navên beşên malê alîkar e ji bo derbirîna jiyana te ya rojane.";
            }
            if (cat === 'Food') {
                return isSorani
                    ? "خواردنی کوردی مێژوویەکی دەوڵەمەندی هەیە. ناسینی ناوەکان تەنها خواردن نییە، بەڵکو ناسینی تامی خاک و میواندارییە."
                    : "Xwarina Kurdî xwedî dîrokeke dewlemend e. Naskirina navan ne tenê xwarin e, lê naskirina tama ax û mêvandariyê ye.";
            }
            if (cat === 'Nature') {
                return isSorani
                    ? "سروشتی کوردستان بە چیا و دارستانەکانی وەسف دەکرێت. پاراستنی ئەم سروشتە لە ڕێگەی ناسینی ناو و بایەخی پێکهاتەکانیەوە دەست پێ دەکات."
                    : "Xwezaya Kurdistanê bi çiya û daristanên xwe tê naskirin. Parastina vê xwezayê bi naskirina nav û girîngiya pêkhateyên wê dest pê dike.";
            }
            if (cat === 'Animals') {
                return isSorani
                    ? "ئاژەڵان بەشێکی دانەبڕاون لە ژینگەی ئێمە. لە ئەفسانە و مێژووی کوردیدا، هەندێک ئاژەڵ وەک ئەسپ و هەڵۆ هێمای ئازایەتی و بەرزین."
                    : "Heywan beşeke bingehîn a jîngeha me ne. Di efsane û dîroka Kurdî de, hinek heywan mîna hesp û teyran nîşana mêrxasî û bilindbûnê ne.";
            }
            if (cat === 'Body') {
                return isSorani
                    ? "ناسینی ئەندامەکانی جەستە زانیارییەکی سەرەکییە بۆ تەندروستی و پەیوەندی ڕۆژانە."
                    : "Naskirina endamên lêşê mirovan agahiyeke bingehîn e ji bo tenduristî û têkiliyên rojane.";
            }
            if (cat === 'Colors') {
                return isSorani
                    ? "ڕەنگەکان جیهانی ئێمە دەڕازێننەوە. لە جلوبەرگی کوردیدا، ڕەنگە گەشەکان هێمای خۆشی و هیوان."
                    : "Reng cîhana me dixemilînin. Di kincên Kurdî de, rengên geş nîşana şahî û hêviyê ne.";
            }
            if (cat === 'Adjectives') {
                return isSorani
                    ? "هاوەڵناوەکان تام و چێژ دەدەنە زمان. بە بەکارهێنانیان دەتوانیت بەوردی وەسفی هەست و دیمەنەکان بکەیت."
                    : "Hevalnav tam û çêjê didin ziman. Bi bikaranîna wan tu dikarî bi hûrgulî wesfa hest û dîmenan bikî.";
            }
            if (cat === 'Numbers') {
                return isSorani
                    ? "ژمارەکان زمانی بازاڕ و زانست و کاتن. بێ ژمارەکان ناتوانین کارەکانمان ڕێک بخەین."
                    : "Hejmar zimanê bazar, zanist û demê ne. Bêyî hejmaran em nikarin karên xwe birêkûpêk bikin.";
            }
            if (cat === 'Time') {
                return isSorani
                    ? "کات گرانبەهاترین سەرمایەیە. ناسینی وشەکانی پەیوەست بە کات، ژیانت بەرهەمدارتر دەکات."
                    : "Dem sermayeya herî bi qîmet e. Naskirina peyvên girêdayî demê, jiyana te berhemdartir dike.";
            }
            if (cat === 'Education') {
                return isSorani
                    ? "خوێندن کلیلی ڕزگاری و پێشکەوتنی نەتەوەیە. هەوڵ بدە هەمیشە فێری وشەی نوێ بیت بۆ دەوڵەمەندکردنی هزرت."
                    : "Xwendin kilîta rizgarî û pêşketina neteweyan e. Hewl bide her tim peyvên nû hîn bibî daku hişê xwe dewlemend bikî.";
            }
            if (cat === 'Science') {
                return isSorani
                    ? "زانست ڕێگای ڕاستییە. بەکارهێنانی زاراوە زانستییەکان بە زمانی دایک، نیشانەی گەشەسەندنی زمان و نەتەوەیە."
                    : "Zanist riya rastiyê ye. Bikaranîna terîmên zanistî bi zimanê dayikê, nîşana geşepêdana ziman û neteweyê ye.";
            }
            if (cat === 'Travel') {
                return isSorani
                    ? "گەشتکردن پەنجەرەیەکە ڕووەو جیهانە. فێربوونی وشەی گەشت، ڕێگاکەت ئاسانتر و گەشتەکەت خۆشتر دەکات."
                    : "Geştkirin pencereyek e ber bi cîhanê ve. Hînbûna peyvên geştê, riya te hêsantir û geşta te xweştir dike.";
            }
            if (cat === 'Places') {
                return isSorani
                    ? "شوێنەکان ناسنامەی جوگرافییان هەیە. هەر شوێنێک مێژوویەکی لە پشتە کە شایانی فێربوونە."
                    : "Cîhan nasnameya wan a cografî heye. Li pişt her cîhekî dîrokê heye ku hêjayî hînbûnê ye.";
            }
            if (cat === 'Work') {
                return isSorani
                    ? "کار شکۆمەندی بە مرۆڤ دەبەخشێت. فێربوونی پیشە جیاوازەکان ئاسۆی بیرکردنەوەت فراوان دەکات."
                    : "Kar rûmetê dide mirovan. Hînbûna pîşeyên cuda asoya ramana te firehtir dike.";
            }
            if (cat === 'Business') {
                return isSorani
                    ? "بازرگانی زمانی پەیوەندییە ئابوورییەکانە. ئاشنابوون بەم زاراوانە بۆ جیهانی ئەمڕۆ زۆر پێویستە."
                    : "Bazirganî zimanê têkiliyên aborî ye. Naskirina van terîman ji bo cîhana îro pir pêwîst e.";
            }
            if (cat === 'Arts') {
                return isSorani
                    ? "هونەر زمانی دڵە. موزیک و وێنەکێشان و شیعر هێمای زیندوێتی و کەلتووری دەوڵەمەندی ئێمەن."
                    : "Huner zimanê dil e. Muzîk, wênekêşî û helbest nîşana zindîbûn û çanda me ya dewlemend in.";
            }
            if (cat === 'Culture') {
                return isSorani
                    ? "کەلتوور کۆی ئەزموونی باوباپیرانە. پاراستنی زمان گەورەترین هەنگاوە بۆ پاراستنی ئەم کەلتوورە."
                    : "Çand koma ezmûna bav û kalan e. Parastina ziman gava herî mezin e ji bo parastina vê çandê.";
            }
            if (cat === 'Health') {
                return isSorani
                    ? "تەندروستی تاجێکە لەسەر سەری مرۆڤ. زانینی ناوەکان یارمەتیدەرە تا باشتر ئاگاداری جەستەی خۆت بیت."
                    : "Tenduristî tacek e li ser serê mirovan. Zanîna navan alîkar e daku tu çêtir hay ji lêşê xwe hebe.";
            }
            if (cat === 'Emotions') {
                return isSorani
                    ? "هەستەکان ڕەنگی ژیانن. گوزارشتکردن لە خۆشی و ناخۆشی بە زمانی دایک کاریگەرییەکی قووڵتری هەیە."
                    : "Hest rengê jiyanê ne. Derbirîna şahî û xemgîniyê bi zimanê dayikê bandoreke kûrtir dike.";
            }
            if (cat === 'History') {
                return isSorani
                    ? "مێژوو چراکەی داهاتووە. ناسینی ڕابردوو ڕێگەمان بۆ ڕووناک دەکاتەوە کە کێین و بەرەو کوێ دەچین."
                    : "Dîrok çiraya paşerojê ye. Naskirina rabirdûyê riya me ronî dike ku em kî ne û ber bi ku ve diçin.";
            }
            if (cat === 'Advanced') {
                return isSorani
                    ? "ئاستی پێشکەوتوو واتە قووڵبوونەوە لە زمان. لێرەدا وشەکان هێز و واتای قووڵتر وەردەگرن."
                    : "Asta pêşketî tê wateya kûrbûna di ziman de. Li vir peyv hêz û wateyên kûrtir werdigirin.";
            }
            if (cat === 'Fruits') {
                return isSorani
                    ? "میوەکان سەرچاوەی وزە و تەندروستین. کوردستان بە میوەی نایاب وەک هەنار و هەنجیر و سێو بەناوبانگە."
                    : "Fêkî çavkaniya enerjî û tenduristiyê ne. Kurdistan bi fêkiyên xweş mîna henar, hejîr û sêvan navdar e.";
            }
            if (cat === 'Vegetables') {
                return isSorani
                    ? "سەوزەکان پێکهاتەی بنەڕەتی سفرەی کوردین. هەر یەکێکیان سوودێکی تایبەت بە جەستە دەگەیەنن."
                    : "Sebze pêkhateyên bingehîn ên sifreya Kurdî ne. Her yek ji wan feydeyek taybet dide lêşê mirov.";
            }
            
            return isSorani 
                ? `ئەم وشەیە "${item[dialectKey]}" لە شێوەزاری ${getDialectName(target)}دا واتایەکی قووڵی هەیە.` 
                : `Ev peyva "${item[dialectKey]}" di devoka ${getDialectName(target)} de xwedî wateyeke kûr e.`;
        };

        const typeRoll = (i + l) % 4;
        if (typeRoll === 0) {
          exercises.push({
            id: `u-${unitDef.id}-l-${l}-ex-${i}-s`,
            type: 'select-correct',
            question: isSorani 
              ? `واتای وشەی "${targetWord}" لە ${getDialectName(target)}دا چییە؟` 
              : `Wateya peyva "${targetWord}" di ${getDialectName(target)} de çi ye?`,
            answer: interfaceWord,
            options: [interfaceWord, ...getDistractors(3, interfaceWord, interfaceKey)].sort(() => Math.random() - 0.5),
            hint: getDialectHint(item),
            tip: (item as any).tip ? ((item as any).tip[interfaceLang] || (item as any).tip['Sorani']) : undefined
          });
        } else if (typeRoll === 1) {
          exercises.push({
            id: `u-${unitDef.id}-l-${l}-ex-${i}-t`,
            type: 'translation',
            question: isSorani 
              ? `بیکە بە ${getDialectName(interfaceLang)}: "${targetWord}"` 
              : `Bike ${getDialectName(interfaceLang)}: "${targetWord}"`,
            answer: interfaceWord,
            options: [interfaceWord, ...getDistractors(3, interfaceWord, interfaceKey)].sort(() => Math.random() - 0.5),
            hint: getDialectHint(item),
            tip: (item as any).tip ? ((item as any).tip[interfaceLang] || (item as any).tip['Sorani']) : undefined
          });
        } else if (typeRoll === 2) {
            const extraPairs = academicDict.filter(w => w[dialectKey] !== targetWord).slice(0, 3);
            const pairs = [
              { left: targetWord, right: interfaceWord },
              ...extraPairs.map(p => ({ left: p[dialectKey]!, right: p[interfaceKey]! }))
            ];
            
            exercises.push({
                id: `u-${unitDef.id}-l-${l}-ex-${i}-m`,
                type: 'match',
                question: isSorani ? 'بگونجێنە' : 'Li hev bîne',
                pairs: pairs,
                options: pairs.map(p => p.left).sort(() => Math.random() - 0.5),
                answer: pairs.map(p => p.right).sort(() => Math.random() - 0.5),
                hint: isSorani ? "هەوڵبدە وشە هاوتاکان بەیەکەوە ببەستیتەوە." : "Hewl bide peyvên hevwate bi hev re girê bide.",
                tip: (item as any).tip ? ((item as any).tip[interfaceLang] || (item as any).tip['Sorani']) : undefined
            });
        } else {
            // Improved Sentiment & Semantic construction logic
            const category = item.category || '';
            const isAdj = ['Adjectives', 'Colors', 'Emotions'].includes(category);
            const isPlace = ['Places', 'Nature'].includes(category);
            const isVerb = category === 'Verbs';
            
            // Define categories that work well with "This is [Word]"
            const isNoun = [
              'Family', 'Food', 'Body', 'Home', 'Animals', 'Education', 
              'Business', 'Arts', 'Culture', 'Health', 'Science', 
              'Travel', 'Places', 'Fruits', 'Vegetables', 'History', 'Numbers'
            ].includes(category);

            const pronouns = ['من', 'تۆ', 'ئەو'];
            let answerStr = '';
            let words: string[] = [];

            if (isVerb) {
              // Pattern: "I like [Verb]" -> "من حەزم لە [خواردن]ە" / "Ez ji [xwarinê] hez dikim"
              const pronoun = getPronoun('من');
              const lowerWord = target === 'Kurmanji' ? targetWord.toLowerCase() : targetWord;
              if (target === 'Kurmanji') {
                const suffix = lowerWord.endsWith('n') ? lowerWord.slice(0, -1) + 'nê' : lowerWord; // Simple Kurmanji case suffix
                answerStr = `${pronoun} ji ${suffix} hez dikim`;
                words = [pronoun, 'ji', suffix, 'hez', 'dikim'];
              } else {
                answerStr = `${pronoun} حەزم لە ${targetWord}ە`;
                words = [pronoun, 'حەزم', 'لە', `${targetWord}ە`];
              }
            } else if (isAdj) {
              // Pattern: "[P] am [Adj]" -> "من جوانم", "Tu bedew î"
              const randomPronounKey = pronouns[Math.floor(Math.random() * pronouns.length)];
              const pronoun = getPronoun(randomPronounKey);
              const lowerWord = target === 'Kurmanji' ? targetWord.toLowerCase() : targetWord;

              if (target === 'Kurmanji') {
                const copula = randomPronounKey === 'من' ? 'im' : (randomPronounKey === 'تۆ' ? 'î' : 'e');
                answerStr = `${pronoun} ${lowerWord} ${copula}`;
                words = [pronoun, lowerWord, copula];
              } else {
                let copula = '';
                if (randomPronounKey === 'من') copula = 'م';
                else if (randomPronounKey === 'تۆ') copula = 'یت';
                else copula = /[اەووێی]$/.test(lowerWord) ? 'یە' : 'ە';
                
                answerStr = `${pronoun} ${lowerWord}${copula}`;
                words = [pronoun, `${lowerWord}${copula}`];
              }
            } else if (isPlace) {
              // Pattern: "I am in [Place]" -> "من لە شارم", "Ez li bajar im"
              const pronoun = getPronoun('من');
              const lowerWord = target === 'Kurmanji' ? targetWord.toLowerCase() : targetWord;
              if (target === 'Kurmanji') {
                answerStr = `${pronoun} li ${lowerWord} im`;
                words = [pronoun, 'li', lowerWord, 'im'];
              } else {
                answerStr = `${pronoun} لە ${targetWord}م`;
                words = [pronoun, 'لە', `${targetWord}م`];
              }
            } else if (isNoun) {
              // Pattern: "This is [Word]" -> "ئەمە نانە", "Ev nan e"
              const lowerWord = target === 'Kurmanji' ? targetWord.toLowerCase() : targetWord;
              if (target === 'Kurmanji') {
                answerStr = `Ev ${lowerWord} e`;
                words = ['Ev', lowerWord, 'e'];
              } else {
                const suffix = /[اەووێی]$/.test(targetWord) ? 'یە' : 'ە';
                answerStr = `ئەمە ${targetWord}${suffix}`;
                words = ['ئەمە', `${targetWord}${suffix}`];
              }
            } else {
              // Fallback to translation for problematic categories like "Basics" or "Greetings"
              exercises.push({
                id: `u-${unitDef.id}-l-${l}-ex-${i}-c-alt`,
                type: 'translation',
                question: isSorani 
                  ? `واتای ئەم وشەیە چییە؟: "${targetWord}"` 
                  : `Wateya vê peyvê çi ye?: "${targetWord}"`,
                answer: interfaceWord,
                options: [interfaceWord, ...getDistractors(3, interfaceWord, interfaceKey)].sort(() => Math.random() - 0.5),
                hint: getDialectHint(item),
                tip: (item as any).tip ? ((item as any).tip[interfaceLang] || (item as any).tip['Sorani']) : undefined
              });
              return; // Skip the rest of the loop for this item as we already pushed an exercise
            }

            // Add 1-2 distractors
            const distractors = getDistractors(2, "", dialectKey);
            const finalOptions = [...words, ...distractors].sort(() => Math.random() - 0.5);

            exercises.push({
                id: `u-${unitDef.id}-l-${l}-ex-${i}-c`,
                type: 'construct',
                question: isSorani 
                  ? `ڕستەی ئەم وشەیە ڕێکبخە: "${interfaceWord}"` 
                  : `Hevoka vê peyvê saz bike: "${interfaceWord}"`,
                answer: answerStr,
                options: finalOptions,
                hint: isSorani ? `واتای وشەکە زانیاریت لەسەر دەدات: ${item[interfaceKey]}` : `Wateya peyvê agahiyê dide te: ${item[interfaceKey]}`,
                tip: (item as any).tip ? ((item as any).tip[interfaceLang] || (item as any).tip['Sorani']) : undefined
            });
        }
      });

      lessons.push({
        id: unitDef.id * 1000 + l,
        unitId: unitDef.id,
        title: isSorani ? `وانەی ${l + 1}` : `Dersa ${l + 1}`,
        category: unitDef.name,
        exercises: exercises
      });
    }

    if (unitDef.id === 1) {
      lessons.push(getSOVLesson(target, interfaceLang, unitDef.id));
    }

    return {
      id: unitDef.id,
      title: unitDef.name,
      description: `${unitWords.length} ${isSorani ? 'وشەی پسپۆڕی' : 'Peyvên pisporî'}`,
      theme: unitDef.theme,
      lessons: lessons,
      categories: unitDef.categories,
      motif: unitDef.motif
    };
  });
};

// Global data constant for level metadata access outside useMemo
const levelsData = [
    { id: 1, count: 50 },
    { id: 2, count: 75 },
    { id: 3, count: 100 },
    { id: 4, count: 125 },
    { id: 5, count: 150 },
    { id: 6, count: 200 },
    { id: 7, count: 250 },
    { id: 8, count: 300 },
    { id: 9, count: 350 },
    { id: 10, count: 400 },
    { id: 11, count: 450 },
    { id: 12, count: 500 },
    { id: 13, count: 550 },
    { id: 14, count: 600 },
    { id: 15, count: 800 }
];

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "هەڵەیەک ڕوویدا لە کاتی بارکردنی ئەپەکە.";
      let isQuota = false;
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `هەڵەی داتابەیس: ${parsed.error}`;
        if (parsed.isQuota) {
            isQuota = true;
            // Native localization check would be better but searching UI state is hard here, 
            // the error message inside parsed.error might already be enough or we override.
            errorMessage = "ژمارەی هەوڵە ڕێگەپێدراوەکانی ڕۆژانەی پڕۆژەکە تەواو بووە. تکایە بەیانی سەردانمان بکەرەوە.";
        }
      } catch (e) {}
      
      return (
        <div className="min-h-screen theme-bg-page flex items-center justify-center p-6 text-center text-white" style={{ backgroundColor: '#05010a' }}>
          <div className="max-w-md p-8 bg-slate-900 border border-white/10 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {isQuota ? <Zap size={32} className="text-yellow-500" /> : <X size={32} className="text-red-500" />}
            </div>
            <h2 className="text-2xl font-black mb-4">{isQuota ? "کۆتای ڕۆژانە" : "هەڵەیەک ڕوویدا"}</h2>
            <p className="opacity-60 mb-8 font-medium italic">{errorMessage}</p>
            {isQuota ? (
               <p className="text-xs opacity-40 mb-8">Ev sepan li ser plana belaş a Firebase e. Kotaya rojane qediya ye, sibê dîsa were.</p>
            ) : null}
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-all pointer-events-auto"
            >
              {isQuota ? "دووبارەو پێداچوونەوە" : "دووبارە بارکردنەوە"}
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Helper to ensure image URLs are direct and compatible (e.g. Postimages)
const formatImageUrl = (url: string) => {
  if (!url) return '';
  let finalUrl = url.trim();
  
  // Basic cleaning
  if (finalUrl.startsWith('www.')) finalUrl = 'https://' + finalUrl;
  
  // Handle Postimages page links -> attempt conversion to direct link
  // Postimages direct links are usually: i.postimg.cc/CODE/filename.ext
  // Page links are: postimg.cc/CODE
  if (finalUrl.includes('postimg.cc') && !finalUrl.includes('i.postimg.cc')) {
     const parts = finalUrl.split('/');
     const code = parts[parts.length - 1];
     if (code && code.length > 4) {
       // We don't know the extension, but often appending a dummy one works on some hosts 
       // or we just warn. Better: point them to Direct Link.
       // For now, let's just try to fix common mistake if it's just the domain.
       return finalUrl.replace('postimg.cc/', 'i.postimg.cc/') + '/image.png';
     }
  }
  return finalUrl;
};

// YouTube/Video helper
const formatVideoEmbed = (url: string) => {
  if (!url) return '';
  
  // YouTube handle
  if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      return `<div class="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>`;
    }
  }
  
  // Vimeo handle
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (videoId) {
      return `<div class="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"><iframe src="https://player.vimeo.com/video/${videoId}" class="w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    }
  }
  
  // Direct MP4 or other files
  return `<div class="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"><video src="${url}" controls class="w-full h-full object-cover"></video></div>`;
};

// Audio helper
const formatAudioEmbed = (url: string) => {
  if (!url) return '';
  return `<div class="w-full bg-white/5 border border-white/10 p-4 rounded-2xl shadow-xl flex items-center justify-center"><audio src="${url}" controls class="w-full"></audio></div>`;
};

export default function App() {
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<'ranking' | 'achievements'>('ranking');
  const [interfaceLang, setInterfaceLang] = useState<InterfaceLang>(() => (localStorage.getItem('ferga_interface') as InterfaceLang) || 'Sorani');
  const [targetDialect, setTargetDialect] = useState<TargetDialect>(() => (localStorage.getItem('ferga_target') as TargetDialect) || 'Sorani');
  const [themeMode, setThemeMode] = useState<'dark'>('dark');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const [adminSubTab, setAdminSubTab] = useState<'general' | 'labels' | 'tabs' | 'school'>('general');
  const [activeAdminDialect, setActiveAdminDialect] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [showSectionAdder, setShowSectionAdder] = useState(false);
  const [appConfig, setAppConfig] = useState<any>({ 
    labels: {}, 
    dialectSchoolContent: {
      'منداڵان': []
    }, 
    extraTabs: [],
    version: 1 
  });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const isAdminUser = useMemo(() => {
    return user?.email === 'ibrahimrebwar2026@gmail.com' || user?.email === 'ibrahimrebwr2026@gmail.com';
  }, [user]);

  // Load Global App Config
  useEffect(() => {
    const path = 'app/global';
    const unsub = onSnapshot(doc(db, 'app', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.dialectSchoolContent) data.dialectSchoolContent = {};
        setAppConfig(data);
      }
      setIsConfigLoaded(true);
    }, (err) => {
      handleFirestoreError(err, 'get', path, user);
      setIsConfigLoaded(true); // Don't block app even on error
    });
    return () => unsub();
  }, [user]);

  const saveGlobalConfig = async (newConfig: any) => {
    if (sessionStorage.getItem('ferga_quota_exceeded')) return;
    const path = 'app/global';
    try {
      if (newConfig.dialectSchoolContent) {
        const cleaned: any = {};
        Object.entries(newConfig.dialectSchoolContent).forEach(([key, val]) => {
          if (key.trim()) cleaned[key.trim()] = val;
        });
        newConfig.dialectSchoolContent = cleaned;
      }
      await setDoc(doc(db, 'app', 'global'), newConfig, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'write', path, user);
    }
  };

  const labels = useMemo(() => {
    const base = uiLabels[interfaceLang];
    const remote = appConfig?.labels?.[interfaceLang] || {};
    return { ...base, ...remote };
  }, [interfaceLang, appConfig]);

  const activeTabsList = useMemo(() => {
    const defaultTabs = [
      { id: 'home', icon: Home, label: labels.home },
      { id: 'grammar', icon: Library, label: labels.grammar },
      { id: 'leaderboard', icon: Trophy, label: labels.leaderboard },
      { id: 'translator', icon: Languages, label: labels.translator },
      { id: 'flashcards', icon: Layers, label: labels.flashcards },
      { id: 'profile', icon: UserIcon, label: labels.profile }
    ];
    
    if (isAdminUser) {
      defaultTabs.push({ id: 'admin', icon: Crown, label: (interfaceLang === 'Sorani' ? 'ئەدمین' : 'Admin') });
    }
    
    if (appConfig?.extraTabs) {
      return [...defaultTabs, ...appConfig.extraTabs];
    }
    return defaultTabs;
  }, [labels, appConfig, isAdminUser, interfaceLang]);

  const [onboardingStage, setOnboardingStage] = useState<'interface' | 'target' | 'complete'>(() => {
    if (!localStorage.getItem('ferga_interface')) return 'interface';
    if (!localStorage.getItem('ferga_target')) return 'target';
    return 'complete';
  });

  const updateGlobalLabel = (key: string, value: string) => {
    const newLabels = {
      ...appConfig?.labels,
      [interfaceLang]: {
        ...(appConfig?.labels?.[interfaceLang] || {}),
        [key]: value
      }
    };
    saveGlobalConfig({ labels: newLabels });
  };
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [learnedLessons, setLearnedLessons] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('ferga_progress');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [achievements, setAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem('ferga_achievements');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<string>('home');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardSessionActive, setFlashcardSessionActive] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [croppingType, setCroppingType] = useState<'avatar' | 'banner'>('avatar');
  
  // Cropping states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<any | null>(null);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('ferga_xp')) || 0);
  const [lives, setLives] = useState(5);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('ferga_streak')) || 0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(() => localStorage.getItem('ferga_last_activity'));
  const [lessonsToday, setLessonsToday] = useState(() => {
    const lastDate = localStorage.getItem('ferga_last_activity');
    if (lastDate === new Date().toISOString().split('T')[0]) {
      return Number(localStorage.getItem('ferga_lessons_today')) || 0;
    }
    return 0;
  });
  const [dailyGoal, setDailyGoal] = useState(() => Number(localStorage.getItem('ferga_daily_goal')) || 2);
  const [searchTerm, setSearchTerm] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Auth Loading Fallback Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 8000); // 8s fallback
    return () => clearTimeout(timer);
  }, []);
  const [authStatus, setAuthStatus] = useState<'idle' | 'linking' | 'sent' | 'success'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [activeGrammarDialectId, setActiveGrammarDialectId] = useState('sorani');
  const [grammarView, setGrammarView] = useState<'explore' | 'compare'>('explore');
  const [compareDialects, setCompareDialects] = useState<{ d1: string; d2: string }>({ d1: 'sorani', d2: 'kurmanji' });
  const [expandedGrammarSections, setExpandedGrammarSections] = useState<Set<string>>(new Set());
  const [schoolDialect, setSchoolDialect] = useState<string | null>(null);
  const [schoolGrouping, setSchoolGrouping] = useState<'dialect' | 'book' | 'author'>(() => (localStorage.getItem('ferga_school_group') as any) || 'dialect');

  useEffect(() => {
    localStorage.setItem('ferga_school_group', schoolGrouping);
  }, [schoolGrouping]);
  const [selectedSchoolCategory, setSelectedSchoolCategory] = useState<string | null>(null);
  const [selectedSchoolTopic, setSelectedSchoolTopic] = useState<any | null>(null);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  const allSchoolTopics = useMemo(() => {
    const all: any[] = [];
    Object.entries(appConfig?.dialectSchoolContent || {}).forEach(([dialect, topics]: any) => {
      if (Array.isArray(topics)) {
        topics.forEach((t: any) => {
          all.push({ ...t, dialect });
        });
      }
    });
    return all;
  }, [appConfig?.dialectSchoolContent]);
  const [schoolTopicReadStatus, setSchoolTopicReadStatus] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('ferga_school_read');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('ferga_school_read', JSON.stringify(Array.from(schoolTopicReadStatus)));
  }, [schoolTopicReadStatus]);

  const toggleSchoolTopicRead = (topicId: string) => {
    setSchoolTopicReadStatus(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
        playSound(correctAudio);
      }
      return next;
    });
  };

  const getTopicUniqueId = (topic: any) => {
    return `${topic.dialect || 'global'}-${topic.title}-${topic.author || 'noauthor'}`;
  };

  const [readingFontSize, setReadingFontSize] = useState(() => Number(localStorage.getItem('ferga_school_font_size')) || 16);
  const [schoolReadingBg, setSchoolReadingBg] = useState(() => localStorage.getItem('ferga_school_bg') || 'transparent');
  const [schoolReadingColor, setSchoolReadingColor] = useState(() => localStorage.getItem('ferga_school_color') || 'rgba(255,255,255,0.8)');

  useEffect(() => {
    localStorage.setItem('ferga_school_font_size', readingFontSize.toString());
  }, [readingFontSize]);

  useEffect(() => {
    localStorage.setItem('ferga_school_bg', schoolReadingBg);
  }, [schoolReadingBg]);

  useEffect(() => {
    localStorage.setItem('ferga_school_color', schoolReadingColor);
  }, [schoolReadingColor]);

  const [fontSize, setFontSize] = useState(() => localStorage.getItem('ferga_font_size') || 'medium');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('toast' as any, handleToast);
    return () => window.removeEventListener('toast' as any, handleToast);
  }, []);
  const [editingTopic, setEditingTopic] = useState<{ lang: string; index: number | null }>({ lang: '', index: null });
  const [editingTabIdx, setEditingTabIdx] = useState<number | null>(null);
  const [deletingTabId, setDeletingTabId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingDialectKey, setEditingDialectKey] = useState<{ original: string; current: string } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const scale = fontSize === 'small' ? '0.92rem' : fontSize === 'large' ? '1.1rem' : '1rem';
    document.documentElement.style.fontSize = scale;
  }, [fontSize]);

  // Audio Refs initialized lazily
  const clickAudio = useRef<HTMLAudioElement | null>(null);
  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const wrongAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio with high-quality, high-compatibility URLs
    clickAudio.current = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
    correctAudio.current = new Audio('https://www.soundjay.com/misc/sounds/bell-ring-01.mp3');
    wrongAudio.current = new Audio('https://www.soundjay.com/misc/sounds/fail-trumpet-01.mp3');
    
    [clickAudio.current, correctAudio.current, wrongAudio.current].forEach(a => {
        if (a) {
            a.volume = 1.0;
            a.preload = 'auto';
        }
    });

    const unlockAudio = () => {
        [clickAudio.current, correctAudio.current, wrongAudio.current].forEach(a => {
            if (a) {
                a.play().then(() => {
                    a.pause();
                    a.currentTime = 0;
                }).catch(() => {});
            }
        });
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('click', unlockAudio);

    return () => {
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('click', unlockAudio);
    };
  }, []);

  const playSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }
  };

  const resetExerciseState = () => {
    setSelectedOption(null);
    setUsedOptionIndices([]);
    setMatchPairs({ left: null, right: null });
    setCompletedPairs([]);
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!activeLesson) return;
    const currentEx = activeLesson.exercises[exerciseIndex];
    const isCorrect = isAnswerCorrect(currentEx, {
      selectedOption,
      translationWords: usedOptionIndices.map(i => currentEx.options?.[i] || ''),
      completedPairs
    });

    if (isCorrect) {
      setFeedback('correct');
      playSound(correctAudio);
      const isReviewCorrection = missedIndices.has(exerciseIndex);
      const points = isReviewCorrection ? 5 : 10;
      if (isReviewCorrection) {
        setReviewQueue(prev => prev.filter(idx => idx !== exerciseIndex));
      }
      setXp(prev => {
        const next = prev + points;
        if (!user) {
          localStorage.setItem('ferga_xp', String(next));
        }
        // Note: We removed the immediate Firestore update here to save quota.
        // It will be synced at the end of the lesson in finishLesson().
        return next;
      });
    } else {
      setFeedback('wrong');
      playSound(wrongAudio);
      setLives(prev => Math.max(0, prev - 1));
      if (!missedIndices.has(exerciseIndex)) {
        setReviewQueue(prev => [...prev, exerciseIndex]);
        setMissedIndices(prev => new Set(prev).add(exerciseIndex));
      } else {
        setXp(prev => {
          const next = Math.max(0, prev - 2);
          if (!user) {
            localStorage.setItem('ferga_xp', String(next));
          }
          return next;
        });
      }
    }
  };

  const nextExercise = () => {
    if (!activeLesson) return;
    playSound(clickAudio);
    setShowHint(false);
    const isInitialRun = exerciseIndex < activeLesson.exercises.length - 1;
    const hasMoreInReview = reviewQueue.length > 0;
    if (isInitialRun) {
      setExerciseIndex(prev => prev + 1);
      resetExerciseState();
    } else if (hasMoreInReview) {
      const nextIdx = reviewQueue[0];
      setExerciseIndex(nextIdx);
      resetExerciseState();
    } else {
      finishLesson();
    }
  };

  const finishLesson = () => {
    if (!activeLesson) return;
    setIsLessonComplete(true);
    const key = `${targetDialect}-${activeLessonId}`;
    const newSet = new Set(learnedLessons);
    newSet.add(key);
    setLearnedLessons(newSet);
    const today = new Date().toISOString().split('T')[0];
    const { streak: newStreak, lastActivity: lastDate } = calculateNextStreak(streak, lastActivityDate, today);
    const isNewDay = lastActivityDate !== today;
    const nextLessonsToday = isNewDay ? 1 : lessonsToday + 1;
    setLessonsToday(nextLessonsToday);
    if (lastDate !== lastActivityDate) {
      setStreak(newStreak);
      setLastActivityDate(lastDate);
    }
    if (user && !sessionStorage.getItem('ferga_quota_exceeded')) {
      // Sync total cumulative XP at the end of the lesson
      const totalXp = xp + 10;
      setXp(totalXp);
      updateDoc(doc(db, 'users', user.uid), { 
          learnedLessons: arrayUnion(key),
          streak: newStreak,
          lastActivity: today,
          lessonsToday: nextLessonsToday,
          xp: totalXp
      }).catch(e => handleFirestoreError(e, 'update', `users/${user.uid}`, user));
    } else {
      const totalXp = xp + 10;
      localStorage.setItem('ferga_progress', JSON.stringify(Array.from(newSet)));
      localStorage.setItem('ferga_streak', String(newStreak));
      localStorage.setItem('ferga_last_activity', today);
      localStorage.setItem('ferga_lessons_today', String(nextLessonsToday));
      localStorage.setItem('ferga_xp', String(totalXp));
      setXp(totalXp);
    }
  };

  // Real-time Leaderboard
  useEffect(() => {
    if (!user || activeTab !== 'leaderboard') return;
    
    const q = query(
      collection(db, 'users'), 
      orderBy('xp', 'desc'), 
      limit(1000)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaderboard(data);
    }, (e) => {
      handleFirestoreError(e, 'list', 'users', user);
    });
    
    return () => unsub();
  }, [user, activeTab]);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [usedOptionIndices, setUsedOptionIndices] = useState<number[]>([]);
  const [matchPairs, setMatchPairs] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [completedPairs, setCompletedPairs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isLessonComplete, setIsLessonComplete] = useState(false);

  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [missedIndices, setMissedIndices] = useState<Set<number>>(new Set());

  const kurdishTips = {
    Sorani: [
      "خۆت دەزانی؟ زمانی کوردی زۆر دەوڵەمەندە و چەندین شێوەزاری جیاوازی هەیە!",
      "فێربوونی وشە نوێیەکان بە بەکارهێنانیان لە ڕستەدا زۆر کاریگەرترە.",
      "خانی دەڵێت: 'زمانی کوردی، نیشانەی نەتەوەیە'.",
      "ئایا دەزانی کە شێوەزاری سۆرانی پاشگرێکی زۆری هەیە بۆ دروستکردنی وشەی نوێ؟",
      "بزنە کێوی (کەڵ) ناسنامەی شاخەکانی کوردستانە."
    ],
    Kurmanji: [
      "Zimanê kurdî gelek dewlemend e û xwedî gelek devokên cuda ye!",
      "Di Kurmancî de zayenda nêr û mê (Gender) gelek girîng e.",
      "Fêrbûna peyvên nû bi bikaranîna wan di hevokan de hêsantir dibe.",
      "Xanî dibêje: 'Zimanê kurdî, nasnameya me ye'.",
      "Gelo tu dizanî ku herêma Behdînan bi devokek taybet a Kurmancî diaxivin?"
    ]
  };

  const [homeMascotTip, setHomeMascotTip] = useState<string | null>(() => {
    const tips = interfaceLang === 'Sorani' ? kurdishTips.Sorani : kurdishTips.Kurmanji;
    return tips[Math.floor(Math.random() * tips.length)];
  });
  const [homeMascotMood, setHomeMascotMood] = useState<'happy' | 'thinking' | 'wink'>('happy');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setEditDisplayName(u.displayName || '');
        setEditPhotoURL(u.photoURL || '');
        // Load progress from Firestore
        const docRef = doc(db, 'users', u.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setLearnedLessons(new Set(data.learnedLessons || []));
            setXp(data.xp || 0);
            setStreak(data.streak || 0);
            setLastActivityDate(data.lastActivity || null);
            setEditBio(data.bio || '');
            setEditBannerUrl(data.bannerUrl || '');
            
            const today = new Date().toISOString().split('T')[0];
            if (data.lastActivity === today) {
              setLessonsToday(data.lessonsToday || 0);
            } else {
              setLessonsToday(0);
            }
            setDailyGoal(data.dailyGoal || 2);
            setAchievements(data.achievements || []);
            
            if (data.interfaceLang) setInterfaceLang(data.interfaceLang);
            if (data.targetDialect) setTargetDialect(data.targetDialect);

            // Load Flashcards
            const fcRef = collection(db, 'users', u.uid, 'flashcards');
            const fcSnap = await getDocs(fcRef);
            const fcData = fcSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
            setFlashcards(fcData);

            // Update profile if changed (Google profile info might update)
            const updates: any = {};
            const cleanAuthName = u.displayName || '';
            const cleanAuthPhoto = u.photoURL || '';
            const cleanDbName = data.displayName || '';
            const cleanDbPhoto = data.photoURL || '';

            if (cleanAuthName && cleanDbName !== cleanAuthName) updates.displayName = cleanAuthName;
            if (cleanAuthPhoto && cleanDbPhoto !== cleanAuthPhoto) updates.photoURL = cleanAuthPhoto;
            
            if (Object.keys(updates).length > 0 && !sessionStorage.getItem('ferga_quota_exceeded')) {
              updateDoc(docRef, updates).catch((e) => handleFirestoreError(e, 'update', `users/${u.uid}`, u));
            }
          } else {
            // Initialize user doc
            try {
              await setDoc(docRef, { 
                xp: 0, 
                learnedLessons: [], 
                email: u.email, 
                streak: 0, 
                lastActivity: '',
                lessonsToday: 0,
                dailyGoal: 2,
                achievements: [],
                displayName: u.displayName || 'فێرخواز',
                photoURL: u.photoURL || ''
              });
            } catch (e) {
              handleFirestoreError(e, 'create', `users/${u.uid}`, u);
            }
          }
        } catch (error) {
          handleFirestoreError(error, 'get', `users/${u.uid}`, u);
        }
      } else {
        // Fallback to local
        try {
          const saved = localStorage.getItem('ferga_progress');
          if (saved) setLearnedLessons(new Set(JSON.parse(saved)));
          setXp(Number(localStorage.getItem('ferga_xp')) || 0);
          setStreak(Number(localStorage.getItem('ferga_streak')) || 0);
          setLastActivityDate(localStorage.getItem('ferga_last_activity'));
        } catch (e) {
          console.warn("Failed to load local storage progress:", e);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const dialectKey = targetDialect.toLowerCase() as 'sorani' | 'kurmanji' | 'hawrami' | 'zazaki' | 'luri';
  const interfaceKey = interfaceLang.toLowerCase() as 'sorani' | 'kurmanji' | 'hawrami' | 'zazaki' | 'luri';
  const isSorani = interfaceLang === 'Sorani';
  const isRTL = interfaceLang === 'Sorani';
  const academicDict = useMemo(() => {
    const baseDict = kurdishDictionary.dictionary;
    const extraDict = appConfig?.customDictionary || [];
    return [...baseDict, ...extraDict];
  }, [appConfig]);

  const units = useMemo(() => getUnitData(targetDialect, interfaceLang, appConfig), [targetDialect, interfaceLang, appConfig]);
  const activeLesson = useMemo(() => {
    if (!activeLessonId) return null;
    return units.flatMap(u => u.lessons).find(l => l.id === activeLessonId);
  }, [activeLessonId, units]);

  const activeUnit = useMemo(() => {
    if (!activeLessonId || !units) return null;
    return units.find(u => u.lessons.some(l => l.id === activeLessonId));
  }, [activeLessonId, units]);


  const handleDialectChange = (d: TargetDialect) => {
    playSound(clickAudio);
    setTargetDialect(d);
    localStorage.setItem('ferga_target', d);
    if (user && !sessionStorage.getItem('ferga_quota_exceeded')) {
      updateDoc(doc(db, 'users', user.uid), { targetDialect: d }).catch(e => handleFirestoreError(e, 'update', `users/${user.uid}`, user));
    }
    setActiveLessonId(null);
    setOnboardingStage('complete');
  };

  const handleInterfaceChange = (i: InterfaceLang) => {
    playSound(clickAudio);
    setInterfaceLang(i);
    localStorage.setItem('ferga_interface', i);
    if (user && !sessionStorage.getItem('ferga_quota_exceeded')) {
      updateDoc(doc(db, 'users', user.uid), { interfaceLang: i }).catch(e => handleFirestoreError(e, 'update', `users/${user.uid}`, user));
    }
    if (onboardingStage === 'interface') {
      setOnboardingStage('target');
    }
  };

  const startLesson = (id: number) => {
    setActiveLessonId(id);
    setExerciseIndex(0);
    setLives(5);
    setSelectedOption(null);
    setUsedOptionIndices([]);
    setMatchPairs({ left: null, right: null });
    setIsLessonComplete(false);
    setReviewQueue([]);
    setMissedIndices(new Set());
  };



  const updateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateFirebaseProfile(user, {
        displayName: editDisplayName,
        photoURL: editPhotoURL
      });

      // 2. Update Firestore
      const docRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(docRef, {
          displayName: editDisplayName,
          photoURL: editPhotoURL,
          bannerUrl: editBannerUrl,
          bio: editBio
        });
      } catch (e) {
        handleFirestoreError(e, 'update', `users/${user.uid}`, user);
      }
      
      // 3. Force reload user to sync auth state
      await user.reload();
      setUser({...auth.currentUser} as FirebaseUser);
      
      playSound(correctAudio);
    } catch (e) {
      console.error("Profile Update Error:", e);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm(labels.confirmDelete)) {
        try {
            const uid = user.uid;
            // First delete user from Auth - this is most likely to fail (re-auth needed)
            await deleteUser(user);
            // If we're here, auth deletion succeeded, now cleanup data
            await deleteDoc(doc(db, 'users', uid));
            
            // Clean up local storage too
            localStorage.clear();
            window.location.reload();
        } catch (error: any) {
            console.error("Error deleting account:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert(interfaceLang === 'Sorani' 
                  ? 'بۆ چاودێری ئاساییش، تکایە جارێکی تر بچۆژوورەوە و پاشان هەوڵی سڕینەوە بدە.' 
                  : 'Ji bo ewlehiyê, ji kerema xwe dîsa têkevin û paşê hewl bidin jêbirinê.');
            } else {
                alert(error.message);
            }
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsReadingFile(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
        setIsReadingFile(false);
        playSound(clickAudio);
      };
      reader.onerror = () => {
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropSave = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppingType === 'avatar') {
          setEditPhotoURL(croppedImage);
        } else {
          setEditBannerUrl(croppedImage);
        }
        setShowCropper(false);
        setImageToCrop(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const onCropComplete = (_activeArea: Area, activeAreaPixels: Area) => {
    setCroppedAreaPixels(activeAreaPixels);
  };

  const handleGoogleLogin = async () => {
    playSound(clickAudio);
    setAuthStatus('linking');
    setAuthError(null);
    
    const provider = new GoogleAuthProvider();
    
    // Check if we are in standalone mode (iOS PWA)
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    try {
      await setPersistence(auth, browserLocalPersistence);
      
      if (isStandalone) {
        // Popups are blocked in standalone mode, use redirect
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
        setAuthStatus('idle');
      }
    } catch (e: any) {
      console.error(e);
      setAuthStatus('idle');
      if (e.code === 'auth/operation-not-supported-in-this-environment' || e.message?.includes('storage is inaccessible')) {
        setAuthError(isRTL 
          ? 'بێزەحمەت ئەپەکە لە وێبگەڕێکی ئاسایی بکەرەوە (وەک Chrome یان Safari). وێبگەڕی ناو فەیسبووک و سناپچات ڕێگری دەکەن لە چوونە ژوورەوە.' 
          : 'Ji kerema xwe sepanê di gerokek asayî de veke (mîna Chrome an Safari). Gerokên nav Facebook an Snapchat rê li ber têketinê digirin.'
        );
      } else if (e.code === 'auth/popup-blocked') {
        setAuthError(isRTL ? 'پۆپ-ئەپ بلۆک کراوە، بێزەحمەت ڕێگەی پێ بدە یان لە سەفاری بەکاری بهێنە.' : 'Popup hate astengkirin, ji kerema xwe destûr bide an di Safari de bi kar bîne.');
      } else if (e.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setAuthError(isRTL 
          ? `ئەم دۆمەینە (${currentDomain}) ڕێگەپێدراو نییە لە فایەربەیس! تکایە لینکی دۆمەینەکە زیاد بکە بۆ Authorized Domains لە ناو Firebase Console.` 
          : `Ev domîn (${currentDomain}) di Firebase de nehatîye destûrdayîn! Ji kerema xwe lînkê Vercel li Authorized Domains di Firebase Console de zêde bike.`
        );
      } else {
        setAuthError(isRTL ? 'هەڵەیەک ڕوویدا لە کاتی چوونە ژوورەوە.' : 'Şaşiyek di dema têketinê de derket.');
      }
    }
  };

  const toggleWord = (index: number) => {
    if (feedback) return;
    playSound(clickAudio);
    setUsedOptionIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleMatchSelect = (val: string, side: 'left' | 'right') => {
    if (feedback || completedPairs.includes(val)) return;
    playSound(clickAudio);
    const newPairs = { ...matchPairs, [side]: val };
    setMatchPairs(newPairs);

    if (newPairs.left && newPairs.right) {
      const currentEx = activeLesson!.exercises[exerciseIndex];
      const match = currentEx.pairs?.find(p => p.left === newPairs.left && p.right === newPairs.right);
      if (match) {
        setCompletedPairs(prev => [...prev, newPairs.left!, newPairs.right!]);
        setMatchPairs({ left: null, right: null });
        
        // Auto-check if all matched
        if (completedPairs.length + 2 === (currentEx.pairs?.length || 0) * 2) {
          // All matched!
        }
      } else {
        // Wrong simple feedback - reset after short delay if needed, or just allow retry
        setTimeout(() => setMatchPairs({ left: null, right: null }), 500);
      }
    }
  };

  if (authLoading || !isConfigLoaded) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen theme-bg-page flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] opacity-10">
            <KurdistanMap />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative w-32 h-32"
          >
            <div className="absolute inset-0 bg-yellow-400 blur-[60px] opacity-20" />
            <KhaniPoetMascot className="relative w-full h-full object-contain" />
          </motion.div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen theme-bg-page theme-text flex items-center justify-center p-6 font-sans relative overflow-hidden">
          <ThemeInjected dialect={targetDialect} mode={themeMode} />
          <div className="absolute inset-0 z-0">
             <KurdistanMap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.03]" />
          </div>
          
          <div className="max-w-md w-full text-center p-12 theme-card rounded-[3.5rem] relative z-10">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-20 h-20 mx-auto mb-10 relative"
             >
               <div className="absolute inset-0 bg-yellow-400/10 blur-[40px] opacity-20 rounded-full" />
               <div className="relative w-full h-full p-2 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                  <KhaniPoetMascot className="w-full h-full object-contain opacity-90" />
               </div>
             </motion.div>

             <h1 className="text-3xl md:text-5xl font-black mb-1 tracking-tighter theme-text leading-tight font-afarin1">
               {labels.title}
             </h1>
           <div className="flex items-center justify-center gap-4 mb-10 opacity-40">
              <div className="h-px bg-white/10 flex-1" />
              <p className="text-[9px] font-bold theme-primary tracking-[0.4em] uppercase">Language Academy</p>
              <div className="h-px bg-white/10 flex-1" />
           </div>
           
           <div className="flex gap-2 mb-10 justify-center p-1 bg-white/5 rounded-2xl border border-white/5">
             <button 
               onClick={() => handleInterfaceChange('Sorani')}
               className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${interfaceLang === 'Sorani' ? 'theme-bg-primary shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
             >
               سۆرانی
             </button>
             <button 
               onClick={() => handleInterfaceChange('Kurmanji')}
               className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${interfaceLang === 'Kurmanji' ? 'theme-bg-primary shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
             >
               Kurmancî
             </button>
           </div>

           <p className="text-white/30 mb-12 text-base font-medium">
             {labels.loginTitle}
           </p>

           <button 
             onClick={async () => {
               setIsLoggingIn(true);
               try {
                 await handleGoogleLogin();
               } finally {
                 setIsLoggingIn(false);
               }
             }}
             disabled={authStatus === 'linking' || isLoggingIn}
             className="w-full group relative py-5 rounded-3xl bg-slate-100 text-slate-900 font-bold text-lg hover:bg-white transition-all active:scale-95 shadow-xl flex items-center justify-center gap-4 border border-white/20"
           >
             {isLoggingIn ? (
               <Loader2 className="w-6 h-6 animate-spin" />
             ) : (
               <svg className="w-6 h-6" viewBox="0 0 24 24">
                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
               </svg>
             )}
             {isLoggingIn ? (interfaceLang === 'Sorani' ? 'چاوەڕێ بە...' : 'Li bendê be...') : (authStatus === 'linking' ? labels.checking : labels.googleLogin)}
           </button>

           {authError && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium leading-relaxed"
             >
               {authError}
             </motion.div>
           )}
           
           <p className="mt-8 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">{interfaceLang === 'Sorani' ? 'فێرگەی خانی: زمانە کوردییەکان' : 'Fêrga Xanî: Zimanên Kurdî'}</p>
        </div>
      </div>
      </ErrorBoundary>
    );
  }

  if (onboardingStage !== 'complete') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen theme-bg-page theme-text flex items-center justify-center p-6 font-sans">
        <ThemeInjected dialect={targetDialect} mode={themeMode} />
        <div className="max-w-md w-full">
           <AnimatePresence mode="wait">
             <motion.div 
               key="target-select"
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-center p-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl"
             >
               <GraduationCap className="w-16 h-16 mx-auto mb-6 theme-primary animate-pulse" />
               <h2 className="text-3xl font-black mb-4">{labels.target}</h2>
               <p className="text-white/40 mb-8 text-sm">{isRTL ? 'ئەو شێوەزارە هەڵبژێرە کە دەتەوێت فێری بیت' : 'Zimanê ku tu dixwazî hîn bibî hilbijêre'}</p>
               <div className="grid grid-cols-1 gap-3">
                 {(['Sorani', 'Kurmanji', 'Hawrami', 'Luri', 'Zazaki'] as TargetDialect[]).map(d => (
                   <motion.button
                     key={d}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handleDialectChange(d)}
                     className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 font-black hover:theme-bg-primary hover:border-white/20 transition-all text-lg active:scale-95 shadow-lg"
                   >
                      {d}
                   </motion.button>
                 ))}
               </div>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
      </ErrorBoundary>
    );
  }
  if (activeLesson) {
    const currentEx = activeLesson.exercises[exerciseIndex];
    return (
      <ErrorBoundary>
        <div className="min-h-screen theme-bg-page theme-text overflow-hidden relative font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
        <ThemeInjected dialect={targetDialect} mode={themeMode} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 flex flex-col h-screen overflow-y-auto custom-scrollbar">
          {/* Header Progress */}
          <div className="flex items-center gap-4 mb-10 shrink-0">
            <button onClick={() => setActiveLessonId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
              <ArrowLeft size={24} className="text-white" />
            </button>
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(exerciseIndex / activeLesson.exercises.length) * 100}%` }}
                className="h-full theme-bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Heart size={14} className="text-rose-500 fill-rose-500" />
              <span className="text-xs font-black">{lives}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isLessonComplete ? (
              <motion.div
                key={exerciseIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                {currentEx.type !== 'intro' && (
                  <div className="flex items-start gap-4 mb-10">
                    <div className="w-16 h-16 shrink-0 rounded-2xl border-2 border-white/20 bg-white/5 p-1 relative shadow-2xl">
                      <KhaniPoetMascot className="w-full h-full object-cover rounded-xl" mood={feedback === 'wrong' ? 'thinking' : feedback === 'correct' ? 'wink' : 'happy'} />
                      <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white rounded-lg px-2 py-0.5 text-[8px] font-black uppercase">خانی</div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-5 rounded-3xl rounded-tr-none relative mt-2 shadow-2xl">
                        <p className="text-lg md:text-xl font-black text-white leading-tight font-afarin1">
                            {currentEx.question}
                        </p>
                        <div className={`absolute top-0 ${isRTL ? '-right-2' : '-left-2'} w-3 h-3 bg-white/10 rotate-45 border-t border-l border-white/20`} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  {currentEx.type === 'intro' && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="theme-bg-card border theme-border-soft rounded-[3rem] p-8 md:p-12 text-center"
                    >
                      <div className="w-40 h-40 mx-auto mb-8 relative">
                         <div className="absolute inset-0 bg-purple-500 blur-[80px] opacity-20" />
                         <KhaniPoetMascot className="relative w-full h-full object-contain" mood="happy" />
                      </div>
                      <h2 className="text-3xl font-black mb-4 theme-text font-afarin1">{currentEx.question}</h2>
                      <p className="theme-text-soft text-lg leading-relaxed mb-8 font-afarin2">
                        {currentEx.hint}
                      </p>
                    </motion.div>
                  )}

                  {(currentEx.type === 'select-correct' || currentEx.type === 'fill-blank') && (
                    <div className="grid grid-cols-1 gap-4">
                      {currentEx.options?.map((opt, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => !feedback && setSelectedOption(opt)}
                          className={`p-5 rounded-2xl text-lg font-bold transition-all border text-center relative overflow-hidden group font-afarin1 ${
                            selectedOption === opt 
                              ? 'theme-bg-secondary border-white/20 shadow-lg theme-shadow-primary' 
                              : 'theme-bg-card theme-border-soft theme-text-soft hover:theme-bg-soft'
                          } ${feedback && opt === currentEx.answer ? 'border-green-500 bg-green-500/10' : ''}
                          ${feedback === 'wrong' && opt === selectedOption ? 'border-red-500 bg-red-500/10' : ''}`}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {(currentEx.type === 'translation' || currentEx.type === 'construct') && (
                    <div className="flex flex-col gap-12">
                      <div className="min-h-[100px] p-5 theme-bg-card border theme-border-soft border-dashed rounded-2xl flex flex-wrap gap-2 items-start">
                        {usedOptionIndices.map((idx, i) => (
                          <motion.button
                            layoutId={`word-${idx}`}
                            key={`used-${idx}-${i}`}
                            onClick={() => toggleWord(idx)}
                            className="px-4 py-2 theme-bg-primary rounded-lg font-bold shadow-md"
                          >
                            {currentEx.options?.[idx]}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {currentEx.options?.map((opt, i) => (
                          <motion.button
                            layoutId={`word-${i}`}
                            key={`opt-${i}`}
                            disabled={usedOptionIndices.includes(i) || !!feedback}
                            onClick={() => toggleWord(i)}
                            className={`px-4 py-2 rounded-xl font-bold text-base transition-all border ${
                              usedOptionIndices.includes(i) 
                                ? 'bg-transparent border-transparent text-transparent pointer-events-none' 
                                : 'theme-bg-card theme-border-soft theme-text hover:theme-bg-soft'
                            }`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="completion"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-20"
              >
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div 
                            key={i}
                            initial={{ y: -20, x: Math.random() * 600 - 300, opacity: 1 }}
                            animate={{ y: 1000, rotate: 360, opacity: 0 }}
                            transition={{ duration: 3, delay: Math.random() * 2, repeat: Infinity, ease: 'linear' }}
                            className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                        />
                    ))}
                </div>
                <div className="w-56 h-56 mb-10 relative z-10">
                   <div className="relative w-full h-full rounded-full border-[12px] border-white/10 p-3 bg-black/80 backdrop-blur-3xl shadow-2xl">
                     <KhaniPoetMascot className="w-full h-full object-contain" mood="wink" />
                   </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter font-afarin1">{labels.completeTitle}</h2>
                <div className="flex gap-4 mt-8 relative z-10">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-w-[120px]">
                     <p className="text-xs font-black theme-primary uppercase tracking-widest mb-1">{labels.xp}</p>
                     <p className="text-3xl font-black text-white">20</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-w-[120px]">
                     <p className="text-xs font-black theme-primary uppercase tracking-widest mb-1">{labels.accuracy}</p>
                     <p className="text-3xl font-black text-white">100%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Section */}
          <div className="mt-auto pt-8 shrink-0">
             {!feedback && !isLessonComplete ? (
               <motion.button 
                 whileTap={{ scale: 0.95 }}
                 disabled={
                   (currentEx.type === 'select-correct' || currentEx.type === 'fill-blank') ? !selectedOption :
                   (currentEx.type === 'translation' || currentEx.type === 'construct') ? usedOptionIndices.length === 0 :
                   currentEx.type === 'intro' ? false :
                   false
                 }
                 onClick={currentEx.type === 'intro' ? nextExercise : checkAnswer}
                 className={`w-full py-5 rounded-3xl font-black text-xl transition-all shadow-2xl ${
                   (currentEx.type === 'intro' || selectedOption || usedOptionIndices.length > 0)
                     ? 'theme-bg-primary text-white border-b-[8px] theme-border-primary' 
                     : 'bg-white/10 text-white/20 border-b-[8px] border-white/5 cursor-not-allowed grayscale'
                 }`}
               >
                 {currentEx.type === 'intro' ? (interfaceLang === 'Sorani' ? 'دەستپێبکە' : 'Dest pê bike') : labels.check}
               </motion.button>
             ) : (
               <motion.div 
                 initial={{ y: 100 }}
                 animate={{ y: 0 }}
                 className={`p-6 rounded-3xl border-t-[8px] flex items-center justify-between shadow-2xl ${
                   isLessonComplete 
                    ? 'theme-bg-primary theme-border-primary text-white' 
                    : feedback === 'correct' 
                      ? 'bg-green-600/90 border-green-800 backdrop-blur-xl' 
                      : 'bg-red-600/90 border-red-800 backdrop-blur-xl'
                 }`}
               >
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       {feedback === 'correct' ? <Trophy size={24} /> : feedback === 'wrong' ? <X size={24} /> : <CheckCircle size={24} />}
                       <p className="text-2xl font-black uppercase tracking-tight">
                         {isLessonComplete ? labels.learned : feedback === 'correct' ? labels.correct : labels.wrong}
                       </p>
                    </div>
                    {feedback === 'wrong' && (
                      <p className="text-sm font-bold opacity-80">{currentEx.answer}</p>
                    )}
                 </div>
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={isLessonComplete ? () => setActiveLessonId(null) : nextExercise}
                   className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black"
                 >
                   {labels.continue}
                 </motion.button>
               </motion.div>
             )}
          </div>
        </div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen theme-bg-page theme-text font-sans selection:bg-theme-primary/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <ThemeInjected dialect={targetDialect} mode={themeMode} />
      {/* Immersive background decoration */}
      <div className="fixed top-0 left-0 h-full w-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[70%] h-[70%] bg-indigo-500/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[70%] h-[70%] bg-blue-500/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[160px]" />
        
        {/* Artistic Kurdistan Map */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] opacity-[0.03]">
          <KurdistanMap />
        </div>
      </div>

      {/* Desktop Sidebar - Premium Style */}
      <aside className={`hidden lg:flex fixed top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-72 bg-slate-950/40 backdrop-blur-3xl border-x border-white/5 flex-col p-8 z-50`}>
        <div className="flex items-center gap-3 mb-12 px-1">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center p-1 shadow-2xl">
            <img src={KHANI_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black theme-text leading-none font-afarin1 tracking-tighter">{interfaceLang === 'Sorani' ? 'فێرگەی خانی' : 'Fêrga Xanî'}</h1>
            <span className="text-[9px] font-black theme-primary tracking-[0.2em] opacity-60">ACADEMY</span>
          </div>
        </div>

        <nav className="space-y-1.5 mb-auto">
          {activeTabsList.map(tab => (
            <NavBtn 
              key={tab.id}
              active={activeTab === tab.id} 
              onClick={() => { playSound(clickAudio); setActiveTab(tab.id); }} 
              icon={typeof tab.icon === 'string' ? <Sparkles size={18} /> : React.createElement(tab.icon as any, { size: 18 })} 
              label={tab.label} 
            />
          ))}
        </nav>

        {/* Improved Daily Goal Card */}
        <div className="pt-6 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="flex justify-center items-center mb-2">
                    <p className="text-[10px] font-black text-white/40 tracking-[0.2em]">{lessonsToday} / {dailyGoal}</p>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((lessonsToday / dailyGoal) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                    />
                </div>
            </div>
        </div>
      </aside>
      <main className="lg:ms-80 lg:me-16 min-h-screen pb-32 md:pb-16 relative z-10 transition-all">
        {activeTab !== 'translator' && (
          <>
            <header className="sticky top-0 z-40 theme-glass px-4 py-3 flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 shrink-0">
                   <h1 className="text-xl font-bold text-white tracking-tight">{labels.title}</h1>
               </div>
               <div className="flex items-center gap-4">
                  <div className={`hidden sm:flex p-1.5 rounded-lg border items-center gap-1.5 transition-all duration-500 scale-90 sm:scale-100 ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    {isOnline ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame size={16} fill="currentColor" />
                    <span className="text-xs font-black theme-text">{streak}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <span className="text-xs font-black theme-text">{xp}</span>
                  </div>
               </div>
            </header>

            <div className="hidden lg:flex justify-end gap-12 mb-16 px-4">
               <HeaderIcon icon={<Flame className={`${streak > 0 ? 'text-orange-400 fill-orange-400' : 'theme-text opacity-20'}`} />} val={streak} label={labels.streak} />
               <HeaderIcon icon={<Star className="text-yellow-400 fill-yellow-400" />} val={xp} label={labels.xp} />
               <HeaderIcon icon={<CheckCircle className="theme-primary fill-current" />} val={learnedLessons.size} label={labels.lesson} />
            </div>
          </>
        )}

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">

          <AnimatePresence mode="wait">
            {activeTab === 'home' ? (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="space-y-12"
              >
                 {/* Compact Combined Hero & Progress Section */}
                 <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-6 border border-white/10 shadow-2xl mb-8 group">
                    <div className="absolute top-0 right-0 w-80 h-80 theme-bg-primary opacity-[0.03] blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="px-2 py-0.5 bg-theme-primary/20 rounded-md text-[7px] theme-primary font-black uppercase tracking-[0.2em]">
                                {isSorani ? 'ئەکادیمیای خانی' : 'Akademiya Xanî'}
                              </span>
                            </div>
                            <h1 className="text-xs md:text-sm font-black text-white tracking-tight leading-none font-afarin1">
                              {isSorani ? 'زاراوە شیرینەکانی' : 'Zaravên Xweş ên'} <span className="theme-primary italic">{isSorani ? 'کوردستان' : 'Kurdistanê'}</span>
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { id: 'Sorani', label: isSorani ? 'سۆرانی' : 'Soranî', color: 'bg-rose-500' },
                            { id: 'Kurmanji', label: isSorani ? 'کورمانجی' : 'Kurmancî', color: 'bg-amber-500' },
                            { id: 'Hawrami', label: isSorani ? 'هەورامی' : 'Hewramî', color: 'bg-emerald-500' },
                            { id: 'Zazaki', label: isSorani ? 'زازاکی' : 'Zazakî', color: 'bg-yellow-500' },
                            { id: 'Luri', label: isSorani ? 'لوڕی' : 'Lurî', color: 'bg-orange-500' }
                          ].map((dialect) => (
                            <button
                              key={dialect.id}
                              onClick={() => { setTargetDialect(dialect.id as any); playSound(clickAudio); }}
                              className={`px-3 py-1.5 rounded-lg border text-[9px] font-black transition-all ${
                                targetDialect === dialect.id 
                                ? 'theme-bg-primary border-transparent text-white shadow-lg' 
                                : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                              }`}
                            >
                              {dialect.label}
                            </button>
                          ))}
                        </div>
                    </div>

                    {/* Compact Daily Goal - Thin line, numbers only */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-1.5 opacity-60">
                              <span className="text-[10px] font-black theme-text">{lessonsToday}</span>
                              <span className="text-[8px] opacity-20">/</span>
                              <span className="text-[10px] font-black theme-text">{dailyGoal}</span>
                           </div>
                           {lessonsToday >= dailyGoal && (
                             <Trophy size={12} className="text-amber-400 animate-bounce" />
                           )}
                        </div>
                        <div className="relative h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((lessonsToday / dailyGoal) * 100, 100)}%` }}
                                transition={{ type: "spring", bounce: 0, duration: 1.5 }}
                                className="h-full theme-bg-primary rounded-full relative shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                            </motion.div>
                        </div>
                    </div>
                 </div>


                 {/* Clean Learning Path */}
                 <div className="flex flex-col items-center gap-10 pb-40">
                    {units.map((unit, unitIdx) => {
                        const themesArr = [
                            { bg: 'bg-emerald-500', border: 'border-emerald-600', activeBorder: 'border-emerald-500', text: 'text-emerald-500', shadow: 'shadow-emerald-500/30' },
                            { bg: 'bg-amber-500', border: 'border-amber-600', activeBorder: 'border-amber-500', text: 'text-amber-500', shadow: 'shadow-amber-500/30' },
                            { bg: 'bg-violet-500', border: 'border-violet-600', activeBorder: 'border-violet-500', text: 'text-violet-500', shadow: 'shadow-violet-500/30' },
                            { bg: 'bg-pink-500', border: 'border-pink-600', activeBorder: 'border-pink-500', text: 'text-pink-500', shadow: 'shadow-pink-500/30' },
                            { bg: 'bg-sky-500', border: 'border-sky-600', activeBorder: 'border-sky-500', text: 'text-sky-500', shadow: 'shadow-sky-500/30' }
                        ];
                         const unitTheme = themesArr[unitIdx % themesArr.length];
                         const motif = (unit as any).motif;
                         const unitLearnedCount = unit.lessons.filter(l => learnedLessons.has(`${targetDialect}-${l.id}`)).length;

                        return (
                            <div key={unit.id} className="w-full flex flex-col items-center gap-8">
                                {/* Refined Unit Header - Premium Style */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="w-full relative group"
                                >
                                    <div className={`overflow-hidden rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/5 transition-all duration-500`}>
                                        <div className="flex flex-col md:flex-row items-stretch min-h-[60px] relative z-10">
                                            <div className={`w-1.5 ${unitTheme.bg} transition-all`} />
                                            <div className="flex-1 p-4 md:px-6 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-1.5 py-0.5 rounded-md ${unitTheme.bg} text-white font-black text-[7px] uppercase tracking-widest`}>
                                                        {labels.unit} {unitIdx + 1}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-[7px] text-white/30 font-black uppercase tracking-widest">
                                                        {unit.categories[0]}
                                                    </span>
                                                </div>
                                                <h2 className="text-base font-black text-white tracking-tight font-afarin1">
                                                    {unit.title}
                                                </h2>
                                            </div>
                                            <div className="p-4 md:px-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-s border-white/5 bg-black/20">
                                                <div className="text-base font-black text-white mb-0.5">{unitLearnedCount}<span className="text-[9px] text-white/20 ml-1">/ {unit.lessons.length}</span></div>
                                                <div className="w-16 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${unitTheme.bg}`} style={{ width: `${(unitLearnedCount / unit.lessons.length) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                            {/* Lessons in this unit */}
                            <div className="flex flex-col items-center gap-8 py-6">
                                {unit.lessons.map((lesson, lessonIdx) => {
                                    const learned = learnedLessons.has(`${targetDialect}-${lesson.id}`);
                                    const theme = unitTheme; // Use the same theme for all lessons in this unit
                                    
                                    // Determine unlock status based on previous lesson (even across units)
                                    let lessonUnlocked = false;
                                    if (unitIdx === 0 && lessonIdx === 0) {
                                        lessonUnlocked = true;
                                    } else {
                                        const prevLessonInUnit = lessonIdx > 0 ? unit.lessons[lessonIdx - 1] : null;
                                        if (prevLessonInUnit) {
                                            lessonUnlocked = learnedLessons.has(`${targetDialect}-${prevLessonInUnit.id}`);
                                        } else if (unitIdx > 0) {
                                            const prevUnit = units[unitIdx - 1];
                                            const lastLessonOfPrevUnit = prevUnit.lessons[prevUnit.lessons.length - 1];
                                            lessonUnlocked = learnedLessons.has(`${targetDialect}-${lastLessonOfPrevUnit.id}`);
                                        }
                                    }

                                    // Adaptive Zig-zag offset for professional mobile look
                                    const curveStrength = (typeof window !== 'undefined' && window.innerWidth < 768) ? 25 : 45;
                                    const pathPattern = [0, 0.6, 1, 0.6, 0, -0.6, -1, -0.6]; 
                                    const offsetIdx = (unitIdx * 5 + lessonIdx) % pathPattern.length;
                                    const offset = pathPattern[offsetIdx] * curveStrength;

                                    return (
                                        <div key={lesson.id} className="relative">
                                            <motion.div 
                                                style={{ transform: `translateX(${offset}px)` }}
                                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-50px" }}
                                                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                            >
                                                <motion.button
                                                    whileHover={lessonUnlocked ? { 
                                                        scale: 1.08, 
                                                        y: -8,
                                                        transition: { type: "spring", damping: 12 }
                                                    } : {}}
                                                    whileTap={lessonUnlocked ? { scale: 0.92 } : {}}
                                                    disabled={!lessonUnlocked}
                                                    onClick={() => {
                                                        playSound(clickAudio);
                                                        startLesson(lesson.id);

                                                    }}
                                                    animate={lessonUnlocked && !learned ? {
                                                        y: [0, -4, 0],
                                                        transition: { 
                                                            repeat: Infinity, 
                                                            duration: 3, 
                                                            ease: "easeInOut" 
                                                        }
                                                    } : { y: 0 }}
                                                    className={`relative w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all group ${
                                                        learned 
                                                            ? `${theme.bg} ${theme.border} border-b-6 ${theme.shadow} shadow-lg` 
                                                            : !lessonUnlocked
                                                                ? 'bg-white/5 border-transparent opacity-20 cursor-not-allowed shadow-none'
                                                                : `bg-white/5 border-[3px] md:border-[4px] ${theme.activeBorder} ${theme.shadow} shadow-md`
                                                    }`}
                                                >
                                                    <div className={`relative z-10 ${learned ? 'text-white' : lessonUnlocked ? theme.text : 'text-white/40'}`}>
                                                        {!lessonUnlocked ? <Moon size={20} className="opacity-40" /> : 
                                                         learned ? <Check size={30} strokeWidth={3} className="drop-shadow-sm" /> : 
                                                         (unitIdx + lessonIdx) % 2 === 0 ? <Sun size={24} /> : <BookOpen size={24} />}
                                                    </div>
                                                    
                                                    {lessonUnlocked && !learned && (
                                                        <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white px-4 py-1.5 rounded-xl font-bold text-[10px] tracking-wide border border-white/10 shadow-2xl">
                                                            {lesson.title}
                                                        </div>
                                                    )}
                                                </motion.button>

                                                {/* Completion Glow for learned lessons */}
                                                {learned && (
                                                    <motion.div 
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 0.2 }}
                                                        className={`absolute inset-0 -z-10 ${theme.bg} blur-3xl rounded-full`}
                                                    />
                                                )}
                                            </motion.div>

                                            {/* Connector line to next lesson (don't show on last lesson of last unit) */}
                                            {!(unitIdx === units.length - 1 && lessonIdx === unit.lessons.length - 1) && (
                                                <div className="absolute top-[110%] left-1/2 -translate-x-1/2 h-8 w-1.5 bg-white/10 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                      );
                    })}
                 </div>
              </motion.div>
            ) : activeTab === 'grammar' ? (
              <motion.div 
                key="grammar"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 theme-bg-primary rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                         <Library size={32} className="text-white" />
                      </div>
                      <div>
                         <h2 className="text-3xl font-black text-white font-afarin1">{labels.grammar}</h2>
                         <p className="theme-primary font-bold uppercase tracking-widest text-[10px]">
                            {interfaceLang === 'Sorani' ? 'فێربوونی شێوەزارە جیاوازەکان' : 'Fêrbûna devokên cihêreng'}
                         </p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                     {[
                       { id: 'dialect', icon: Globe, label: interfaceLang === 'Sorani' ? 'شێوەزار' : 'Şêwezar' },
                       { id: 'book', icon: Book, label: interfaceLang === 'Sorani' ? 'کتێب' : 'Pirtûk' },
                       { id: 'author', icon: UserIcon, label: interfaceLang === 'Sorani' ? 'نووسەر' : 'Nivîskar' }
                     ].map(group => (
                       <button
                         key={group.id}
                         onClick={() => {
                           playSound(clickAudio);
                           setSchoolGrouping(group.id as any);
                           setSchoolDialect(null);
                           setSelectedSchoolCategory(null);
                           setSelectedSchoolTopic(null);
                         }}
                         className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${schoolGrouping === group.id ? 'theme-bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                       >
                         <group.icon size={14} />
                         <span>{group.label}</span>
                       </button>
                     ))}
                   </div>

                   {(schoolDialect || selectedSchoolCategory) && !selectedSchoolTopic && (
                     <button 
                       onClick={() => {
                        playSound(clickAudio);
                        setSelectedSchoolTopic(null);
                        setSelectedSchoolCategory(null);
                        setSchoolDialect(null);
                       }}
                       className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white/60 transition-all flex items-center gap-2"
                     >
                       <X size={16} /> {interfaceLang === 'Sorani' ? 'گەڕانەوە' : 'Vegere'}
                     </button>
                   )}
                </div>

                {!schoolDialect && !selectedSchoolCategory && !selectedSchoolTopic ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {schoolGrouping === 'dialect' ? (
                      Object.keys(appConfig?.dialectSchoolContent || {}).map(langKey => {
                        const topics = (appConfig?.dialectSchoolContent?.[langKey] || []) as any[];
                        const topicCount = topics.length;
                        return (
                          <motion.button
                            key={langKey}
                            whileHover={{ scale: 1.03, y: -8 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              playSound(clickAudio);
                              setSchoolDialect(langKey);
                              setSelectedSchoolCategory(null);
                            }}
                            className="group relative h-40 md:h-64 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 flex flex-col justify-between overflow-hidden hover:border-theme-primary/40 transition-all shadow-2xl"
                          >
                            <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-theme-primary/5 blur-[80px] group-hover:bg-theme-primary/20 transition-all duration-500" />
                            <div className="relative z-10 flex justify-between items-start">
                              <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:theme-bg-primary group-hover:border-transparent transition-all duration-500">
                                <Library size={24} className="text-white/40 group-hover:text-white" />
                              </div>
                              {topicCount > 0 && (
                                <div className="bg-theme-primary/20 text-theme-primary px-3 py-1 rounded-full text-[10px] md:text-xs font-black">
                                  {topicCount}
                                </div>
                              )}
                            </div>
                            <div className="relative z-10 text-left">
                              <h3 className="text-3xl md:text-5xl font-black text-white/5 group-hover:text-white/10 transition-all absolute -top-8 md:-top-16 -right-4 italic select-none pointer-events-none uppercase font-afarin1">
                                {langKey}
                              </h3>
                              <h3 className="text-sm md:text-2xl font-black text-white mb-1 tracking-tight uppercase font-afarin1">
                                {langKey === 'kurdishnotes' ? (interfaceLang === 'Sorani' ? 'تێبینی' : 'Têbinî') : langKey}
                              </h3>
                              <div className="flex items-center gap-1">
                                 <p className="text-[7px] md:text-[10px] uppercase font-black tracking-widest theme-primary opacity-60">
                                   {interfaceLang === 'Sorani' ? 'بچۆ ناو بابەتەکان' : 'Bikeve mijaran'}
                                 </p>
                                 <ChevronRight size={10} className="theme-primary opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </div>
                          </motion.button>
                        );
                      })
                    ) : (
                      (() => {
                        const uncategorizedLabel = interfaceLang === 'Sorani' ? 'دەستنیشان نەکراو' : 'Bêkategorî';
                        
                        const filteredAll = schoolSearchQuery 
                          ? allSchoolTopics.filter(t => 
                              t.title.toLowerCase().includes(schoolSearchQuery.toLowerCase()) || 
                              (t.content || '').toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
                              (t.book || '').toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
                              (t.author || '').toLowerCase().includes(schoolSearchQuery.toLowerCase())
                            )
                          : allSchoolTopics;

                        const items = schoolGrouping === 'book' 
                          ? Array.from(new Set(filteredAll.map(t => t.book || uncategorizedLabel)))
                          : Array.from(new Set(filteredAll.map(t => t.author || uncategorizedLabel)));
                        
                        return items.map((item: any, i) => {
                          const count = filteredAll.filter(t => (schoolGrouping === 'book' ? (t.book || uncategorizedLabel) : (t.author || uncategorizedLabel)) === item).length;
                          return (
                            <motion.button
                              key={item}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              whileHover={{ scale: 1.03, y: -8 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                playSound(clickAudio);
                                setSelectedSchoolCategory(item);
                              }}
                              className="group relative h-40 md:h-64 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 flex flex-col justify-between overflow-hidden hover:border-theme-primary/40 transition-all shadow-2xl"
                            >
                              <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-theme-primary/5 blur-[80px] group-hover:bg-theme-primary/20 transition-all duration-500" />
                              <div className="relative z-10 flex justify-between items-start">
                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:theme-bg-primary group-hover:border-transparent transition-all duration-500">
                                  {schoolGrouping === 'book' ? <Book size={24} className="text-white/40 group-hover:text-white" /> : <UserIcon size={24} className="text-white/40 group-hover:text-white" />}
                                </div>
                                <div className="bg-theme-primary/20 text-theme-primary px-3 py-1 rounded-full text-[10px] md:text-xs font-black">
                                  {count}
                                </div>
                              </div>
                              <div className="relative z-10 text-left">
                                <h3 className="text-sm md:text-2xl font-black text-white mb-1 tracking-tight uppercase font-afarin1 truncate w-full">
                                  {item}
                                </h3>
                                <div className="flex items-center gap-1">
                                   <p className="text-[7px] md:text-[10px] uppercase font-black tracking-widest theme-primary opacity-60">
                                     {interfaceLang === 'Sorani' ? 'بینینی بابەتەکان' : 'Binêre mijaran'}
                                   </p>
                                   <ChevronRight size={10} className="theme-primary opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                              </div>
                            </motion.button>
                          );
                        });
                      })()
                    )}
                    
                    {isAdminUser && schoolGrouping === 'dialect' && (
                        <motion.button
                            whileHover={{ scale: 1.03, y: -8 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={async () => {
                                const newKey = prompt(interfaceLang === 'Sorani' ? 'ناوی کۆکراوەی نوێ (بۆ نمونە Hawrami):' : 'Navê koma nû (mînak Hawrami):');
                                if (newKey && newKey.trim()) {
                                  const sanitizedKey = newKey.trim();
                                  try {
                                    const docRef = doc(db, 'app', 'global');
                                    await updateDoc(docRef, new FieldPath('dialectSchoolContent', sanitizedKey), []);
                                    playSound(clickAudio);
                                    // Local state will update via onSnapshot
                                  } catch (err) {
                                    // If update fails because document/field doesn't exist, fallback to saveGlobalConfig
                                    const current = appConfig?.dialectSchoolContent || {};
                                    saveGlobalConfig({ dialectSchoolContent: { ...current, [sanitizedKey]: [] } });
                                  }
                                }
                            }}
                            className="group relative h-40 md:h-64 border-2 border-dashed border-white/20 rounded-[2rem] md:rounded-[3rem] p-4 flex flex-col items-center justify-center gap-2 hover:border-theme-primary/30 transition-all"
                        >
                            <Plus className="text-white/20 group-hover:theme-primary transition-colors" size={32} />
                            <span className="text-[10px] font-black uppercase text-white/20 group-hover:text-white">
                              {interfaceLang === 'Sorani' ? 'زیادکردنی شێوەزار' : 'Şêwezarê Zêde Bike'}
                            </span>
                        </motion.button>
                    )}
                  </div>
                ) : !selectedSchoolTopic ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 theme-bg-primary rounded-full" />
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight font-afarin1">
                          {schoolGrouping === 'dialect' 
                            ? (interfaceLang === 'Sorani' ? `بابەتەکانی ${schoolDialect === 'kurdishnotes' ? 'تێبینیەکان' : schoolDialect}` : `Mijarên ${schoolDialect === 'kurdishnotes' ? 'Têbîniyan' : schoolDialect}`)
                            : selectedSchoolCategory
                          }
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${schoolSearchQuery ? 'theme-primary' : 'text-white/20'}`} size={14} />
                          <input 
                            type="text"
                            value={schoolSearchQuery}
                            onChange={(e) => setSchoolSearchQuery(e.target.value)}
                            placeholder={interfaceLang === 'Sorani' ? 'گەڕان لە بابەتەکان...' : 'Li mijaran bigere...'}
                            className="bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:border-theme-primary/40 focus:bg-white/10 outline-none w-full md:w-64 transition-all"
                          />
                        </div>
                        {isAdminUser && (
                          <button 
                            onClick={() => {
                              const newTopic = { title: interfaceLang === 'Sorani' ? 'بابەتێکی نوێ' : 'Mijarek nû', content: '', author: '', book: '', category: '' };
                              const topics = appConfig?.dialectSchoolContent?.[schoolDialect] || [];
                              const newContent = { 
                                ...appConfig?.dialectSchoolContent, 
                                [schoolDialect]: [...topics, newTopic] 
                              };
                              saveGlobalConfig({ dialectSchoolContent: newContent });
                              playSound(clickAudio);
                              // Open control panel to edit
                              setActiveTab('settings');
                              setEditingTopic({ lang: schoolDialect, index: topics.length });
                            }}
                            className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 hover:bg-emerald-500/10 transition-all sm:hidden"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        {isAdminUser && (
                          <button 
                            onClick={() => {
                              const newTopic = { title: interfaceLang === 'Sorani' ? 'بابەتێکی نوێ' : 'Mijarek nû', content: '', author: '', book: '', category: '' };
                              const topics = appConfig?.dialectSchoolContent?.[schoolDialect] || [];
                              const newContent = { 
                                ...appConfig?.dialectSchoolContent, 
                                [schoolDialect]: [...topics, newTopic] 
                              };
                              saveGlobalConfig({ dialectSchoolContent: newContent });
                              playSound(clickAudio);
                              setActiveTab('settings');
                              setEditingTopic({ lang: schoolDialect, index: topics.length });
                            }}
                            className="hidden sm:flex px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all items-center gap-2"
                          >
                            <Plus size={14} /> {interfaceLang === 'Sorani' ? 'زیادکردنی بابەت' : 'Zêdekirina mijarê'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {(schoolGrouping === 'dialect' && !selectedSchoolCategory) ? (
                        <motion.div 
                          key="categories"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                          {(() => {
                            const topics = (appConfig?.dialectSchoolContent?.[schoolDialect] || []) as any[];
                            const filteredTopics = schoolSearchQuery 
                               ? topics.filter(t => 
                                  t.title.toLowerCase().includes(schoolSearchQuery.toLowerCase()) || 
                                  t.content.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
                                  (t.category || '').toLowerCase().includes(schoolSearchQuery.toLowerCase())
                                )
                               : topics;
                             
                             const categorySet = new Set(filteredTopics.map(t => t.category || (interfaceLang === 'Sorani' ? 'گشتی' : 'Giştî')).filter(Boolean));
                             const categories = Array.from(categorySet);
                             
                             if (schoolSearchQuery && categories.length === 0) {
                               return null;
                             }

                             return categories.map((cat, i) => {
                               const count = filteredTopics.filter(t => (t.category || (interfaceLang === 'Sorani' ? 'گشتی' : 'Giştî')) === cat).length;
                              return (
                                <motion.button
                                  key={cat}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                  onClick={() => {
                                    playSound(clickAudio);
                                    setSelectedSchoolCategory(cat);
                                  }}
                                  className="bg-white/5 border border-white/10 hover:border-theme-primary/40 p-8 rounded-[2.5rem] flex flex-col items-start gap-4 group transition-all relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Layers size={80} />
                                  </div>
                                  <div className="w-12 h-12 rounded-2xl theme-bg-primary/10 flex items-center justify-center theme-primary group-hover:scale-110 transition-transform">
                                    <Layers size={24} />
                                  </div>
                                  <div className="text-left">
                                    <h3 className="text-xl font-black text-white group-hover:theme-primary transition-colors font-afarin1">{cat}</h3>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
                                      {count} {interfaceLang === 'Sorani' ? 'بابەت' : 'Mijar'}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            });
                          })()}
                          {((appConfig?.dialectSchoolContent?.[schoolDialect] || []) as any[]).length === 0 && (
                            <div className="col-span-full bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <BookOpen size={40} className="text-white/10" />
                              </div>
                              <p className="text-white/30 font-bold max-w-xs">
                                {interfaceLang === 'Sorani' 
                                  ? 'هێشتا هیچ بابەتێک بۆ ئەم شێوەزارە نییە. دەتوانیت لە پانێڵی ئەدمینەوە زیادی بکەیت.' 
                                  : 'Hîna mijarek ji bo vê devokê nîn e. Tu dikarî ji panela admin zêde bikî.'}
                              </p>
                            </div>
                          )}
                          {schoolSearchQuery && (appConfig?.dialectSchoolContent?.[schoolDialect] || []).filter((t: any) => 
                            t.title.toLowerCase().includes(schoolSearchQuery.toLowerCase()) || 
                            t.content.toLowerCase().includes(schoolSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="col-span-full border border-dashed border-white/10 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                               <p className="text-white/20 font-bold italic">
                                 {interfaceLang === 'Sorani' ? 'هیچ ئەنجامێک نەدۆزرایەوە بۆ: ' : 'Encam nehat dîtin ji bo: '} "{schoolSearchQuery}"
                               </p>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="topics-list"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between mb-8">
                             <button 
                               onClick={() => setSelectedSchoolCategory(null)}
                               className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all group"
                             >
                               <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                               {interfaceLang === 'Sorani' ? 'گەڕانەوە' : 'Vegere'}
                             </button>
                             <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-black theme-primary uppercase tracking-[0.2em] max-w-[200px] truncate">
                               {selectedSchoolCategory}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {(schoolGrouping === 'dialect' 
                              ? ((appConfig?.dialectSchoolContent?.[schoolDialect] || []) as any[]).filter(t => (t.category || (interfaceLang === 'Sorani' ? 'گشتی' : 'Giştî')) === selectedSchoolCategory)
                              : allSchoolTopics.filter(t => {
                                  const uncategorizedLabel = interfaceLang === 'Sorani' ? 'دەستنیشان نەکراو' : 'Bêkategorî';
                                  return (schoolGrouping === 'book' ? (t.book || uncategorizedLabel) : (t.author || uncategorizedLabel)) === selectedSchoolCategory;
                                })
                            )
                              .filter(topic => !schoolSearchQuery || (
                                topic.title.toLowerCase().includes(schoolSearchQuery.toLowerCase()) || 
                                topic.content.toLowerCase().includes(schoolSearchQuery.toLowerCase())
                              ))
                              .map((topic, i) => (
                                <motion.button
                                  key={i}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  onClick={() => {
                                    playSound(clickAudio);
                                    setSelectedSchoolTopic(topic);
                                  }}
                                  className="bg-white/5 border border-white/10 hover:border-theme-primary/30 p-6 rounded-[2rem] flex items-center justify-between group transition-all"
                                >
                                  <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center overflow-hidden transition-all duration-300 ${schoolTopicReadStatus.has(getTopicUniqueId(topic)) ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-white/20 group-hover:theme-primary group-hover:bg-theme-primary/10'}`}>
                                      {schoolTopicReadStatus.has(getTopicUniqueId(topic)) ? (
                                        <CheckCircle size={24} />
                                      ) : topic.image ? (
                                        <img src={formatImageUrl(topic.image)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <span className="font-black text-lg">{i + 1}</span>
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <span className={`block text-lg font-bold font-afarin1 transition-all ${schoolTopicReadStatus.has(getTopicUniqueId(topic)) ? 'text-emerald-500/90' : 'text-white/80 group-hover:text-white'}`}>
                                        {topic.title}
                                        {schoolTopicReadStatus.has(getTopicUniqueId(topic)) && (
                                          <motion.span 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ms-2 text-[8px] uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                                          >
                                            <Check size={8} />
                                            {interfaceLang === 'Sorani' ? 'تەواو' : 'Bitemî'}
                                          </motion.span>
                                        )}
                                      </span>
                                      {(topic.author || topic.dialect) && (
                                        <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">
                                          {topic.author} {topic.dialect ? `• ${topic.dialect}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="text-white/20 group-hover:theme-primary transition-all" />
                                </motion.button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {isAdminUser && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => {
                                const title = prompt('Topic Title:');
                                if (title) {
                                  const content = prompt('Content (HTML supported):');
                                  if (content) {
                                    const dialect = (schoolDialect || '').trim();
                                    if (!dialect) return;
                                    const current = appConfig?.dialectSchoolContent?.[dialect] || [];
                                    saveGlobalConfig({ 
                                      dialectSchoolContent: { 
                                        ...appConfig?.dialectSchoolContent,
                                        [dialect]: [...current, { title, content, author: 'Admin' }]
                                      } 
                                    });
                                  }
                                }
                            }}
                            className="w-full py-6 border-2 border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center gap-4 text-white/40 hover:border-theme-primary/40 hover:text-white transition-all group mt-6"
                        >
                            <Plus size={24} className="theme-primary" />
                            <span className="font-black uppercase tracking-widest text-xs">Add New Topic</span>
                        </motion.button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative"
                  >
                    {/* Back Button Floating */}
                    <motion.button 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 0.6, x: 0 }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                      onClick={() => setSelectedSchoolTopic(null)}
                      className="absolute -top-16 left-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] theme-primary transition-all group z-20"
                    >
                      <div className="w-8 h-8 rounded-full border border-theme-primary/20 flex items-center justify-center group-hover:bg-theme-primary/10 transition-all">
                        <ChevronLeft size={14} />
                      </div>
                      {interfaceLang === 'Sorani' ? 'گەڕانەوە' : 'Vegere'}
                    </motion.button>

                    <div className="bg-black border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                      {/* Decorative elements */}
                      <div className="absolute top-0 left-0 w-full h-1.5 theme-bg-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)]" />
                      <div className="absolute -top-48 -right-48 w-96 h-96 bg-theme-primary/10 blur-[150px] rounded-full pointer-events-none" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />

                      <div className="p-8 md:p-20 relative z-10">
                        {/* Meta Badge & Controls */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="px-5 py-2 bg-theme-primary/10 border border-theme-primary/20 rounded-full text-[9px] font-black uppercase tracking-[0.3em] theme-primary">
                              {schoolDialect === 'KurdishNotes' ? (interfaceLang === 'Sorani' ? 'تێبینی زمانەوانی' : 'Têbiniya Zimanî') : schoolDialect}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">
                               {interfaceLang === 'Sorani' ? 'وانەی فێرگە' : 'Dersa Fêrgehê'}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end md:self-auto flex-wrap justify-end">
                            <button
                               onClick={() => toggleSchoolTopicRead(getTopicUniqueId(selectedSchoolTopic))}
                               className={`h-10 px-4 rounded-2xl border flex items-center gap-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest ${
                                 schoolTopicReadStatus.has(getTopicUniqueId(selectedSchoolTopic))
                                   ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'
                                   : 'bg-white/5 border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-500/30'
                               }`}
                               title={interfaceLang === 'Sorani' ? 'وەک خوێنراو دیاری بکە' : 'Wek xwendî nîşan bike'}
                             >
                                <CheckCircle size={16} className={schoolTopicReadStatus.has(getTopicUniqueId(selectedSchoolTopic)) ? 'animate-bounce' : ''} />
                                <span className="hidden sm:inline">
                                  {schoolTopicReadStatus.has(getTopicUniqueId(selectedSchoolTopic)) 
                                    ? (interfaceLang === 'Sorani' ? 'خوێنراوەتەوە' : 'Xwendî ye')
                                    : (interfaceLang === 'Sorani' ? 'وەک خوێنراو دیاری بکە' : 'Wek xwendî nîşan bike')
                                  }
                                </span>
                             </button>
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-inner">
                              <button 
                                onClick={() => setReadingFontSize(prev => Math.max(12, prev - 2))}
                                className="p-3 text-white/40 hover:text-white hover:bg-white/5 transition-all outline-none"
                                title={interfaceLang === 'Sorani' ? 'بچوککردنەوەی فۆنت' : 'Bûçûkkirina fontê'}
                              >
                                <Minus size={14} />
                              </button>
                              <div className="px-3 border-x border-white/10 flex flex-col items-center justify-center min-w-[50px]">
                                <span className="text-[10px] font-black text-white">{readingFontSize}</span>
                                <span className="text-[7px] font-black uppercase tracking-tighter opacity-20 -mt-1">px</span>
                              </div>
                              <button 
                                onClick={() => setReadingFontSize(prev => Math.min(32, prev + 2))}
                                className="p-3 text-white/40 hover:text-white hover:bg-white/10 transition-all outline-none"
                                title={interfaceLang === 'Sorani' ? 'گەورەکردنی فۆنت' : 'Gewrekirina fontê'}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Background Color Picker */}
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                              {[
                                { color: 'transparent', label: 'Default' },
                                { color: '#000000', label: 'Black' },
                                { color: '#1a1a1a', label: 'Dark' },
                                { color: '#2d261e', label: 'Sepia' },
                                { color: '#0a0e1a', label: 'Midnight' }
                              ].map((bg) => (
                                <button
                                  key={bg.color}
                                  onClick={() => { setSchoolReadingBg(bg.color); playSound(clickAudio); }}
                                  className={`w-6 h-6 rounded-lg border transition-all ${schoolReadingBg === bg.color ? 'border-theme-primary scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                  style={{ backgroundColor: bg.color === 'transparent' ? 'black' : bg.color, position: 'relative' }}
                                  title={bg.label}
                                >
                                  {bg.color === 'transparent' && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                      <Palette size={10} />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* Text Color Picker */}
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                              {[
                                { color: 'rgba(255,255,255,0.8)', label: 'White' },
                                { color: 'rgba(255,255,255,0.5)', label: 'Dim' },
                                { color: '#fbbf24', label: 'Golden' },
                                { color: '#22d3ee', label: 'Sky' }
                              ].map((tc) => (
                                <button
                                  key={tc.color}
                                  onClick={() => { setSchoolReadingColor(tc.color); playSound(clickAudio); }}
                                  className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${schoolReadingColor === tc.color ? 'border-theme-primary scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                  title={tc.label}
                                >
                                  <Type size={12} style={{ color: tc.color }} />
                                </button>
                              ))}
                            </div>

                            <button 
                              onClick={() => {
                                const text = `${selectedSchoolTopic.title}\n\n${selectedSchoolTopic.content.replace(/<[^>]*>/g, '')}`;
                                navigator.clipboard.writeText(text);
                                playSound(clickAudio);
                                window.dispatchEvent(new CustomEvent('toast', { detail: { message: interfaceLang === 'Sorani' ? 'ناوەرۆک کۆپی کرا!' : 'Naverok hat kopîkirin!', type: 'success' } }));
                              }}
                              className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:border-theme-primary/40 transition-all"
                              title={interfaceLang === 'Sorani' ? 'کۆپی نوسین' : 'Nivîsê kopî bike'}
                            >
                              <Copy size={16} />
                            </button>

                            <button 
                              onClick={() => {
                                const text = `${selectedSchoolTopic.title}\n\n${selectedSchoolTopic.content.replace(/<[^>]*>/g, '')}`;
                                const blob = new Blob([text], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${selectedSchoolTopic.title}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                                playSound(clickAudio);
                                window.dispatchEvent(new CustomEvent('toast', { detail: { message: interfaceLang === 'Sorani' ? 'داگرتن دەستی پێکرد' : 'Daxistin dest pê kir', type: 'success' } }));
                              }}
                              className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:border-theme-primary/40 transition-all font-bold"
                              title={interfaceLang === 'Sorani' ? 'داگرتن (وەک تێکست)' : 'Daxistin (wek nivîs)'}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </motion.div>

                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center text-center"
                                  >
                                    <motion.h2 
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.2 }}
                                      className="text-xl md:text-2xl font-black theme-text tracking-tighter leading-[1.1] mb-4 font-afarin1"
                                    >
                                     {selectedSchoolTopic.title}
                                    </motion.h2>

                                    <div className="h-px w-full max-w-[200px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

                                    {selectedSchoolTopic.author && (
                                      <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.4 }}
                                        className="text-[9px] font-black uppercase tracking-[0.2em] mb-8"
                                      >
                                        {interfaceLang === 'Sorani' ? 'نووسەر: ' : 'Nivîskar: '} {selectedSchoolTopic.author}
                                      </motion.p>
                                    )}

                                    {selectedSchoolTopic.image && !selectedSchoolTopic.video && (
                                       <motion.div 
                                         initial={{ opacity: 0, scale: 0.95 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         className="mb-10 w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 flex justify-center items-center max-h-[300px]"
                                       >
                                         <img 
                                           src={formatImageUrl(selectedSchoolTopic.image)} 
                                           alt={selectedSchoolTopic.title} 
                                           className="max-w-full max-h-[300px] object-contain" 
                                           referrerPolicy="no-referrer" 
                                         />
                                       </motion.div>
                                    )}

                                    {selectedSchoolTopic.video && (
                                       <motion.div 
                                         initial={{ opacity: 0, scale: 0.95 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         className="mb-10 w-full"
                                         dangerouslySetInnerHTML={{ __html: formatVideoEmbed(selectedSchoolTopic.video) }}
                                       />
                                    )}

                                    {selectedSchoolTopic.audio && (
                                       <motion.div 
                                         initial={{ opacity: 0, scale: 0.95 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         className="mb-10 w-full"
                                         dangerouslySetInnerHTML={{ __html: formatAudioEmbed(selectedSchoolTopic.audio) }}
                                       />
                                    )}
                                  </motion.div>

                                  {/* Content Area */}
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="relative"
                                  >
                                    <div 
                                      className="prose prose-invert max-w-none font-medium leading-[2.1] text-justify space-y-6 font-afarin2 p-6 md:p-10 rounded-[2.5rem] transition-colors duration-300"
                                      style={{ 
                                        fontSize: `${readingFontSize}px`,
                                        backgroundColor: schoolReadingBg,
                                        color: schoolReadingColor
                                      }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: (selectedSchoolTopic.content || '')
                                          .replace(/\n/g, '<br/>')
                                          .replace(/\[img\](.*?)\[\/img\]/gi, (match, url) => {
                                            const finalUrl = formatImageUrl(url);
                                            return `<div class="my-6 rounded-xl overflow-hidden border border-white/5 shadow-lg bg-black/20 max-w-[70%] mx-auto"><img src="${finalUrl}" class="w-full h-auto object-contain max-h-[320px]" referrerPolicy="no-referrer" /></div>`;
                                          })
                                          .replace(/\[video\](.*?)\[\/video\]/gi, (match, url) => {
                                            return `<div class="my-6 mx-auto max-w-[80%]">${formatVideoEmbed(url)}</div>`;
                                          })
                                          .replace(/\[audio\](.*?)\[\/audio\]/gi, (match, url) => {
                                            return `<div class="my-6 mx-auto max-w-[80%]">${formatAudioEmbed(url)}</div>`;
                                          })
                                          .replace(/\[b\](.*?)\[\/b\]/gi, '<span class="font-black" style="color: inherit; opacity: 1; filter: brightness(1.3)">$1</span>')
                                          .replace(/\[i\](.*?)\[\/i\]/gi, '<span class="italic" style="color: inherit; opacity: 0.8">$1</span>')
                                          .replace(/\[center\](.*?)\[\/center\]/gi, '<div class="text-center">$1</div>')
                                          .replace(/\[c:(#[0-9a-fA-F]{3,6})\](.*?)\[\/c\]/gi, '<span style="color: $1">$2</span>')
                                          .replace(/\[u\](.*?)\[\/u\]/gi, '<span style="text-decoration: underline">$1</span>')
                                      }} 
                                    />
                                    
                                  </motion.div>
                                  
                        {/* Footer Decoration */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="mt-16 pt-12 border-t border-white/5 space-y-12"
                        >
                           {/* Topic Navigation */}
                           <div className="flex items-center justify-between gap-4">
                             {(() => {
                               const dialectTopics = schoolGrouping === 'dialect'
                                 ? (appConfig?.dialectSchoolContent?.[schoolDialect] || []).filter((t: any) => (t.category || (interfaceLang === 'Sorani' ? 'گشتی' : 'Giştî')) === selectedSchoolCategory)
                                 : allSchoolTopics.filter((t: any) => (schoolGrouping === 'book' ? t.book : t.author) === selectedSchoolCategory);
                               const currentIndex = dialectTopics.findIndex((t: any) => t.title === selectedSchoolTopic.title);
                               const prevTopic = currentIndex > 0 ? dialectTopics[currentIndex - 1] : null;
                               const nextTopic = currentIndex < dialectTopics.length - 1 ? dialectTopics[currentIndex + 1] : null;

                               return (
                                 <>
                                   <button 
                                     disabled={!prevTopic}
                                     onClick={() => { playSound(clickAudio); setSelectedSchoolTopic(prevTopic); }}
                                     className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${prevTopic ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'opacity-20 pointer-events-none border-transparent'}`}
                                   >
                                     <ChevronLeft size={20} className="theme-primary" />
                                     <div className="flex flex-col">
                                       <span className="text-[8px] font-black uppercase opacity-40">{interfaceLang === 'Sorani' ? 'بەرەو دواوە' : 'Yê Berê'}</span>
                                       <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{prevTopic?.title}</span>
                                     </div>
                                   </button>

                                   <button 
                                     disabled={!nextTopic}
                                     onClick={() => { playSound(clickAudio); setSelectedSchoolTopic(nextTopic); }}
                                     className={`flex-1 flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-right ${nextTopic ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'opacity-20 pointer-events-none border-transparent'}`}
                                   >
                                     <div className="flex flex-col">
                                       <span className="text-[8px] font-black uppercase opacity-40">{interfaceLang === 'Sorani' ? 'بەرەو پێشەوە' : 'Yê Piştî'}</span>
                                       <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{nextTopic?.title}</span>
                                     </div>
                                     <ChevronRight size={20} className="theme-primary" />
                                   </button>
                                 </>
                               );
                             })()}
                           </div>

                           <div className="flex flex-col items-center gap-6">
                             <div className="w-20 h-1.5 theme-bg-primary/20 rounded-full" />
                           </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : activeTab === 'profile' ? (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="space-y-10"
              >
                <div className="overflow-hidden theme-bg-card backdrop-blur-xl border theme-border-soft rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative">
                  {user ? (
                    <div className="flex flex-col">
                       {/* Profile Banner */}
                       <div className="relative h-40 md:h-64 w-full bg-slate-900 group/banner overflow-hidden">
                           {editBannerUrl ? (
                               <img src={editBannerUrl} alt="Banner" className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center opacity-30">
                                   <Sparkles size={48} className="text-white/20" />
                               </div>
                           )}
                           <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/40 transition-colors" />
                           
                           <button 
                               onClick={() => {
                                   setCroppingType('banner');
                                   fileInputRef.current?.click();
                               }}
                               className="absolute bottom-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-xl text-white opacity-0 group-hover/banner:opacity-100 transition-all hover:scale-110 active:scale-95 border border-white/10"
                           >
                               <Upload size={18} />
                           </button>
                       </div>

                       <div className="px-6 md:px-10 pb-10 flex flex-col items-center text-center -mt-14 md:-mt-20 relative z-10">
                           <div className="relative group">
                               <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                               <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-8 border-[#0f172a] overflow-hidden mb-4 shadow-2xl p-1 bg-white/5">
                                   {editPhotoURL ? (
                                       <img src={editPhotoURL} alt="Profile" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                   ) : (
                                       <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl md:text-4xl rounded-full">
                                           {editDisplayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                       </div>
                                   )}

                                   {isReadingFile && (
                                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                                           <Loader2 className="animate-spin text-white" size={32} />
                                       </div>
                                   )}

                                   <button 
                                       onClick={() => {
                                           setCroppingType('avatar');
                                           fileInputRef.current?.click();
                                       }}
                                       className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 backdrop-blur-sm"
                                   >
                                       <Upload size={24} className="text-white" />
                                       <span className="text-[8px] font-black uppercase text-white tracking-widest">{labels.edit}</span>
                                   </button>
                               </div>
                           </div>
                           
                           <h2 className="text-2xl md:text-3xl font-black theme-text mt-4 mb-1 font-afarin1 tracking-tight">
                               {user.displayName || user.email?.split('@')[0]}
                           </h2>
                           <p className="theme-text-muted text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-40 mb-6">{user.email}</p>

                        <div className="w-full max-w-lg space-y-6 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-left space-y-1.5">
                                    <label className="text-[10px] font-black theme-primary uppercase tracking-widest ml-4 block font-afarin1">{labels.displayName}</label>
                                    <input 
                                        type="text" 
                                        value={editDisplayName}
                                        onChange={(e) => setEditDisplayName(e.target.value)}
                                        className="w-full px-6 py-3 theme-bg-soft border theme-border-soft rounded-2xl theme-text font-bold focus:outline-none theme-border-primary transition-all text-center"
                                        placeholder={labels.displayName}
                                    />
                                </div>
                                <div className="text-left space-y-1.5">
                                    <label className="text-[10px] font-black theme-primary uppercase tracking-widest ml-4 block font-afarin1">{labels.bio}</label>
                                    <textarea 
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className="w-full px-6 py-3 bg-white/5 border theme-border-soft rounded-2xl theme-text font-bold focus:outline-none theme-border-primary transition-all text-sm min-h-[50px] resize-none"
                                        placeholder="..."
                                        rows={1}
                                    />
                                </div>
                            </div>
                            
                            <button 
                                onClick={updateProfile}
                                disabled={isUpdatingProfile}
                                className={`w-full py-4 rounded-2xl font-black text-white theme-bg-primary hover:opacity-90 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isUpdatingProfile ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                {isUpdatingProfile ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>{labels.checking}</span>
                                    </>
                                ) : labels.save}
                            </button>
                        </div>

                        <button onClick={() => signOut(auth)} className="mt-8 flex items-center gap-2 px-6 py-2 theme-bg-soft rounded-full text-[10px] font-black uppercase theme-text hover:theme-bg-soft-20 transition-all tracking-widest">
                            <LogOut size={14} /> {labels.logout}
                        </button>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>
                </div>
              ) : (
                    <div className="flex flex-col items-center text-center mb-10">
                        <UserIcon size={64} className="text-purple-400 mb-4" />
                        <h2 className="text-2xl font-black mb-6 theme-text opacity-90">{labels.loginTitle}</h2>
                        <div className="w-full max-w-sm">
                            <button 
                                onClick={async () => {
                                  setIsLoggingIn(true);
                                  try {
                                    await handleGoogleLogin();
                                  } finally {
                                    setIsLoggingIn(false);
                                  }
                                }}
                                disabled={authStatus === 'linking' || isLoggingIn}
                                className={`w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-4 border-2 border-white/20 bg-slate-900 text-white hover:bg-black shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95 ${authStatus === 'linking' || isLoggingIn ? 'opacity-50 grayscale' : ''}`}
                            >
                                {isLoggingIn ? (
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                  </svg>
                                )}
                                {isLoggingIn ? (interfaceLang === 'Sorani' ? 'چاوەڕێ بە...' : 'Li bendê be...') : (authStatus === 'linking' ? labels.checking : labels.googleLogin)}
                            </button>
                        </div>
                    </div>
                  )}

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="theme-bg-card p-6 rounded-[2rem] border theme-border-soft text-center">
                            <p className="text-[10px] font-black theme-primary uppercase tracking-widest mb-2">{labels.xp}</p>
                            <p className="text-3xl font-black theme-text">{xp}</p>
                        </div>
                        <div className="theme-bg-card p-6 rounded-[2rem] border theme-border-soft text-center">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">{labels.streak}</p>
                            <p className="text-3xl font-black theme-text flex items-center justify-center gap-2">
                                {streak} <Flame size={24} className="text-orange-500" fill="currentColor" />
                            </p>
                        </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black theme-primary uppercase tracking-widest mb-4 border-b theme-border-soft pb-2 font-afarin1">{labels.interface}</h3>
                      <div className="flex gap-4">
                        {(['Sorani', 'Kurmanji'] as InterfaceLang[]).map(i => (
                          <motion.button 
                            key={i} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleInterfaceChange(i)}
                            className={`flex-1 py-4 rounded-2xl font-black transition-all border ${interfaceLang === i ? 'theme-bg-primary text-white theme-border-primary shadow-2xl' : 'theme-bg-soft theme-text-muted theme-border-soft-50 hover:theme-bg-soft-20'}`}
                          >
                            {i}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black theme-primary uppercase tracking-widest mb-4 border-b theme-border-soft pb-2 font-afarin1">{labels.dailyGoal}</h3>
                      <div className="flex gap-3 mb-8">
                        {[1, 2, 3, 5, 10].map(goal => (
                          <motion.button
                            key={goal}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                playSound(clickAudio);
                                setDailyGoal(goal);
                                if (user) updateDoc(doc(db, 'users', user.uid), { dailyGoal: goal }).catch(e => handleFirestoreError(e, 'update', `users/${user.uid}`, user));
                                localStorage.setItem('ferga_daily_goal', String(goal));
                            }}
                            className={`flex-1 py-3 rounded-xl font-black transition-all border ${dailyGoal === goal ? 'theme-bg-primary text-white theme-border-primary shadow-lg' : 'theme-bg-soft theme-text-muted theme-border-soft-50'}`}
                          >
                            {goal}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Profile Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    <div className="flex items-center justify-between p-6 theme-bg-soft rounded-[2rem] border theme-border-soft w-full">
                      <div className="flex items-center gap-4">
                        <div className="theme-primary">
                          <Palette size={24} />
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest">{labels.theme}</span>
                      </div>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => {
                             setThemeMode('dark');
                             localStorage.setItem('ferga_theme', 'dark');
                             playSound(clickAudio);
                           }}
                           className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all theme-bg-primary border-transparent"
                         >
                           {labels.normalTheme}
                         </button>
                      </div>
                    </div>
                  </div>

                  {/* Font Size Setting */}
                  <div className="col-span-full flex flex-col gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/10 mt-6">
                        <div className="flex items-center gap-4 mb-2">
                           <Type size={24} className="theme-primary" />
                           <span className="font-black text-sm uppercase tracking-widest">{labels.fontSize}</span>
                        </div>
                        <div className="flex gap-2">
                          {['small', 'medium', 'large'].map((size) => (
                            <motion.button
                              key={size}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setFontSize(size);
                                localStorage.setItem('ferga_font_size', size);
                                playSound(clickAudio);
                              }}
                              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
                                fontSize === size 
                                  ? 'theme-bg-primary text-white border-white/20 shadow-lg scale-105 z-10' 
                                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                              }`}
                            >
                              {size === 'small' ? labels.smallText : size === 'medium' ? labels.mediumText : labels.largeText}
                            </motion.button>
                          ))}
                        </div>
                        <div className="mt-2 p-4 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-center italic opacity-60 font-medium">
                                {interfaceLang === 'Sorani' 
                                    ? "ئەحمەدی خانی دەڵێت: زمان، ناسنامەی ئێمەیە." 
                                    : "Ehmedê Xanî dibêje: Ziman, nasnameya me ye."}
                            </p>
                        </div>
                      </div>

                      {/* About Us Section */}
                      <div className="col-span-full pt-12">
                         <h3 className="text-sm font-black theme-primary uppercase tracking-widest mb-8 border-b theme-border-soft pb-3 flex items-center gap-3 font-afarin1">
                            <Info size={18} />
                            {labels.aboutUs}
                         </h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Mission */}
                            <div className="p-8 theme-bg-card border theme-border-soft rounded-[2.5rem] relative overflow-hidden group hover:theme-bg-soft transition-all duration-500">
                               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                                  <Target size={120} />
                               </div>
                               <div className="w-12 h-12 theme-bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 group-hover:scale-110 transition-transform">
                                  <Sparkles size={24} />
                               </div>
                               <h4 className="text-xl font-black text-white mb-3 tracking-tighter font-afarin1">
                                  {labels.mission}
                               </h4>
                               <p className="theme-text-muted text-sm font-medium leading-relaxed font-afarin2">
                                  {labels.missionDesc}
                                </p>
                            </div>

                            {/* Team */}
                            <div className="p-8 theme-bg-card border theme-border-soft rounded-[2.5rem] relative overflow-hidden group hover:theme-bg-soft transition-all duration-500">
                               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity -rotate-12">
                                  <Users size={120} />
                               </div>
                               <div className="w-12 h-12 theme-bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 group-hover:scale-110 transition-transform">
                                  <Heart size={24} />
                               </div>
                               <h4 className="text-xl font-black text-white mb-3 tracking-tighter font-afarin1">
                                  {labels.team}
                               </h4>
                               <p className="theme-text-muted text-sm font-medium leading-relaxed font-afarin2">
                                  {labels.teamDesc}
                               </p>
                            </div>

                            {/* Culture */}
                            <div className="p-8 theme-bg-card border theme-border-soft rounded-[2.5rem] relative overflow-hidden group hover:theme-bg-soft transition-all duration-500">
                               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-45">
                                  <Languages size={120} />
                               </div>
                               <div className="w-12 h-12 theme-bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 group-hover:scale-110 transition-transform">
                                  <Library size={24} />
                               </div>
                               <h4 className="text-xl font-black text-white mb-3 tracking-tighter font-afarin1">
                                  {labels.culture}
                               </h4>
                               <p className="theme-text-muted text-sm font-medium leading-relaxed font-afarin2">
                                  {labels.cultureDesc}
                               </p>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10">
                        <div className="flex items-center gap-4 text-red-100/40">
                          <Trash2 size={24} />
                          <span className="font-black text-sm uppercase tracking-widest opacity-20">{labels.deleteAccount}</span>
                        </div>
                        <button 
                           onClick={() => alert('Account deletion is disabled for safety in this version.')}
                           className="px-6 py-2 bg-white/5 text-white/10 rounded-full text-xs font-black transition-all border border-white/5"
                        >
                           {labels.deleteAccount}
                        </button>
                      </div>
                    </div>
                </motion.div>
            ) : activeTab === 'admin' ? (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-2 mb-4">
                  <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 font-afarin1">
                    <Crown className="text-amber-400" size={32} />
                    {interfaceLang === 'Sorani' ? 'بەشی بەڕێوبەر' : 'Beşa Rêveber'}
                  </h2>
                  <p className="theme-text-muted text-xs font-bold uppercase tracking-widest">Control Panel & Configuration</p>
                </div>

                {/* Admin Sub-tabs for better mobile performance */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 sticky top-[60px] z-30 theme-glass py-2">
                  {[
                    { id: 'general', label: interfaceLang === 'Sorani' ? 'گشتی' : 'Giştî', icon: Settings },
                    { id: 'labels', label: interfaceLang === 'Sorani' ? 'نیشانەکان' : 'Nîşan', icon: Palette },
                    { id: 'tabs', label: interfaceLang === 'Sorani' ? 'تابەکان' : 'Tab', icon: Layers },
                    { id: 'school', label: interfaceLang === 'Sorani' ? 'وانەکان' : 'Ders', icon: GraduationCap }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { playSound(clickAudio); setAdminSubTab(tab.id as any); }}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${adminSubTab === tab.id ? 'theme-bg-primary text-white border-white/20 shadow-lg' : 'bg-white/5 theme-text-muted border-white/5 hover:bg-white/10'}`}
                    >
                      <tab.icon size={14} /> {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-10">
                  {adminSubTab === 'general' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="theme-bg-card p-8 rounded-[2.5rem] border theme-border-soft space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-black text-white uppercase tracking-widest text-sm mb-1">{interfaceLang === 'Sorani' ? 'باری گەشەپێدەر' : 'Moda Geşepêder'}</h4>
                            <p className="text-[10px] theme-text-muted font-bold">Show admin highlights and debug info</p>
                          </div>
                          <button 
                            onClick={() => { setIsAdminMode(!isAdminMode); playSound(clickAudio); }}
                            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isAdminMode ? 'bg-rose-500 text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
                          >
                            {isAdminMode ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        
                        <div className="pt-6 border-t theme-border-soft">
                          <h4 className="font-black text-red-500 uppercase tracking-widest text-sm mb-4">{interfaceLang === 'Sorani' ? 'کردارە ترسناکەکان' : 'Karên Tirsnak'}</h4>
                          <button 
                             onClick={async () => {
                                if (!resetConfirm) {
                                    setResetConfirm(true);
                                    setTimeout(() => setResetConfirm(false), 5000);
                                    playSound(clickAudio);
                                    return;
                                }
                                setIsResettingAll(true);
                                try {
                                    const usersSnap = await getDocs(collection(db, 'users'));
                                    const batch = writeBatch(db);
                                    usersSnap.docs.forEach((userDoc) => {
                                        batch.update(userDoc.ref, { xp: 0, streak: 0, lessonsToday: 0, learnedLessons: [] });
                                    });
                                    await batch.commit();
                                    alert('Done'); window.location.reload();
                                } catch (e) { setIsResettingAll(false); setResetConfirm(false); }
                             }}
                             className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest border-2 transition-all ${resetConfirm ? 'bg-red-600 text-white border-white animate-pulse' : 'bg-red-600/10 text-red-500 border-red-500/20'}`}
                          >
                            {resetConfirm ? 'Confirm Reset All Data' : 'Reset All Users Data'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminSubTab === 'labels' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="relative mb-6">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input 
                          type="text"
                          value={labelSearch}
                          onChange={(e) => setLabelSearch(e.target.value)}
                          placeholder="Search labels..."
                          className="w-full bg-white/5 border theme-border-soft rounded-2xl pl-12 pr-6 py-4 text-sm text-white font-bold outline-none focus:theme-border-primary transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(labels)
                          .filter(([key, value]) => key.toLowerCase().includes(labelSearch.toLowerCase()) || (value as string).toLowerCase().includes(labelSearch.toLowerCase()))
                          .map(([key, value]) => (
                          <div key={key} className="bg-white/5 p-4 rounded-2xl border theme-border-soft group hover:border-white/20 transition-all">
                            <label className="block text-[8px] font-black theme-primary uppercase tracking-widest mb-1 opacity-40 font-afarin1">{key}</label>
                            <SyncInput 
                              value={value as string}
                              onSync={(val: string) => updateGlobalLabel(key, val)}
                              className="w-full bg-transparent border-none py-1 text-white text-xs font-bold outline-none font-afarin2"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {adminSubTab === 'tabs' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <button 
                        onClick={() => {
                          const newTab = { id: `tab_${Date.now()}`, label: 'New Tab', icon: 'Sparkles', path: 'external' };
                          saveGlobalConfig({ extraTabs: [...(appConfig?.extraTabs || []), newTab] });
                          playSound(clickAudio);
                        }}
                        className="flex items-center gap-3 px-8 py-4 theme-bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                        <Plus size={18} /> {interfaceLang === 'Sorani' ? 'زیادکردنی تاب' : 'Zêdekirina Tabê'}
                      </button>
                      <div className="space-y-4">
                        {(appConfig?.extraTabs || []).map((t: any, idx: number) => (
                          <div key={t.id} className="bg-white/5 rounded-3xl border theme-border-soft p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-xs text-white/40">{idx + 1}</span>
                                <SyncInput 
                                  value={t.label} 
                                  onSync={(val: string) => {
                                    const newList = [...appConfig.extraTabs];
                                    newList[idx].label = val;
                                    saveGlobalConfig({ extraTabs: newList });
                                  }}
                                  className="bg-transparent text-white font-black uppercase tracking-widest text-sm outline-none border-b border-transparent focus:border-white/20 font-afarin1"
                                />
                              </div>
                              <div className="flex gap-2 items-center">
                                {deletingTabId === t.id ? (
                                  <div className="flex items-center gap-2 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
                                    <button 
                                      onClick={() => setDeletingTabId(null)}
                                      className="px-3 py-1 text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const newList = appConfig.extraTabs.filter((_: any, i: number) => i !== idx);
                                        saveGlobalConfig({ extraTabs: newList });
                                        setDeletingTabId(null);
                                        playSound(clickAudio);
                                      }}
                                      className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button disabled={idx === 0} onClick={() => {
                                      const newList = [...appConfig.extraTabs];
                                      [newList[idx], newList[idx-1]] = [newList[idx-1], newList[idx]];
                                      saveGlobalConfig({ extraTabs: newList });
                                    }} className="p-2 bg-white/5 rounded-xl text-white/40 disabled:opacity-0"><ArrowUp size={16}/></button>
                                    <button disabled={idx === appConfig.extraTabs.length - 1} onClick={() => {
                                      const newList = [...appConfig.extraTabs];
                                      [newList[idx], newList[idx+1]] = [newList[idx+1], newList[idx]];
                                      saveGlobalConfig({ extraTabs: newList });
                                    }} className="p-2 bg-white/5 rounded-xl text-white/40 disabled:opacity-0"><ArrowDown size={16}/></button>
                                    <button onClick={() => setDeletingTabId(t.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"><Trash2 size={16}/></button>
                                  </>
                                )}
                              </div>
                            </div>
                            <SyncTextarea 
                               value={t.content || ''}
                               placeholder="Tab Content (HTML/Markdown)"
                               onSync={(val: string) => {
                                 const newList = [...appConfig.extraTabs];
                                 newList[idx].content = val;
                                 saveGlobalConfig({ extraTabs: newList });
                               }}
                               className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white/70 min-h-[120px] outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {adminSubTab === 'school' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                       <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                         {Object.keys(appConfig?.dialectSchoolContent || {}).map(langKey => (
                           <button
                             key={langKey}
                             onClick={() => { playSound(clickAudio); setActiveAdminDialect(langKey); }}
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeAdminDialect === langKey ? 'theme-bg-primary text-white border-white/20' : 'bg-white/5 theme-text-muted border-white/5'}`}
                           >
                             {langKey}
                           </button>
                         ))}
                         <button 
                           onClick={() => { playSound(clickAudio); setShowSectionAdder(true); }}
                           className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0"
                         >
                           + {interfaceLang === 'Sorani' ? 'بەش' : 'Beş'}
                         </button>
                         {showSectionAdder && (
                           <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                             <input 
                               autoFocus
                               value={newSectionName}
                               onChange={(e) => setNewSectionName(e.target.value)}
                               onKeyDown={async (e) => {
                                 if (e.key === 'Enter') {
                                   const name = newSectionName.trim();
                                   if (!name) return;
                                   try {
                                     const current = (appConfig?.dialectSchoolContent || {}) as Record<string, any[]>;
                                     if (current[name]) {
                                       alert(interfaceLang === 'Sorani' ? 'ئەم بەشە پێشتر هەیە!' : 'Ev beş jixwe heye!');
                                       setActiveAdminDialect(name);
                                       setShowSectionAdder(false);
                                       return;
                                     }
                                     await saveGlobalConfig({ 
                                       dialectSchoolContent: { ...current, [name]: [] } 
                                     });
                                     setActiveAdminDialect(name);
                                     setNewSectionName('');
                                     setShowSectionAdder(false);
                                     playSound(clickAudio);
                                   } catch (err) {
                                     console.error("Add section error:", err);
                                     alert("Error: " + (err instanceof Error ? err.message : String(err)));
                                   }
                                 } else if (e.key === 'Escape') {
                                   setShowSectionAdder(false);
                                   setNewSectionName('');
                                 }
                               }}
                               placeholder={interfaceLang === 'Sorani' ? 'ناوی بەش...' : 'Navê beş...'}
                               className="bg-transparent text-white text-[10px] font-black focus:outline-none px-2 w-24 font-afarin1"
                             />
                             <button 
                               onClick={() => { setShowSectionAdder(false); setNewSectionName(''); }}
                               className="p-1 text-white/40 hover:text-white"
                             >
                               <X size={12}/>
                             </button>
                           </div>
                         )}
                       </div>

                       {activeAdminDialect && (
                         <div className="space-y-6">
                           <div className="flex items-center justify-between pb-4 border-b theme-border-soft">
                             <div className="flex items-center gap-4">
                               <h3 className="font-black text-white uppercase tracking-widest text-lg font-afarin1">{activeAdminDialect} - {interfaceLang === 'Sorani' ? 'ناوەرۆکی بەش' : 'Naveroka Beşê'}</h3>
                               <button 
                                 onClick={async () => {
                                   const newName = prompt(interfaceLang === 'Sorani' ? 'ناوی نوێی بەش بنووسە:' : 'Navê nû yê beşê binivîse:', activeAdminDialect);
                                   if (newName && newName.trim() && newName !== activeAdminDialect) {
                                     const trimmed = newName.trim();
                                     const current = (appConfig?.dialectSchoolContent || {}) as Record<string, any[]>;
                                     if (current[trimmed]) {
                                       alert(interfaceLang === 'Sorani' ? 'ئەم ناوە پێشتر هەیە!' : 'Ev nav jixwe heye!');
                                       return;
                                     }
                                     try {
                                       if (!activeAdminDialect) return;
                                       await updateDoc(doc(db, 'app', 'global'), 
                                         new FieldPath('dialectSchoolContent', trimmed), current[activeAdminDialect],
                                         new FieldPath('dialectSchoolContent', activeAdminDialect), deleteField()
                                       );
                                       setActiveAdminDialect(trimmed);
                                       playSound(clickAudio);
                                     } catch (err) {
                                       console.error("Rename error:", err);
                                     }
                                   }
                                 }}
                                 className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white"
                                 title={interfaceLang === 'Sorani' ? 'گۆڕینی ناو' : 'Navê biguherîne'}
                               >
                                 <Edit3 size={14} />
                               </button>
                               <button 
                                 onClick={async () => {
                                   if (!activeAdminDialect) return;
                                   if (confirm(interfaceLang === 'Sorani' ? `ئایە دڵنیای لە سڕینەوەی بەشی "${activeAdminDialect}"؟` : `Ma tu bawer î ku tu dizanî beşa "${activeAdminDialect}" jê bibî?`)) {
                                     try {
                                       await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), deleteField());
                                       setActiveAdminDialect(null);
                                       playSound(clickAudio);
                                     } catch (err) {
                                       console.error("Delete section error:", err);
                                     }
                                   }
                                 }}
                                 className="p-2 bg-rose-500/10 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                 title={interfaceLang === 'Sorani' ? 'سڕینەوەی بەش' : 'Beşê jê bibe'}
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                             <button 
                               onClick={async () => {
                                 const newTopic = { title: 'New Topic', content: '' };
                                 const current = appConfig?.dialectSchoolContent?.[activeAdminDialect] || [];
                                 try {
                                   if (!activeAdminDialect) return;
                                   await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), [...current, newTopic]);
                                   playSound(clickAudio);
                                 } catch (err) {
                                   console.error("Add topic error:", err);
                                 }
                               }}
                               className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase"
                             >
                               <Plus size={14} /> {interfaceLang === 'Sorani' ? 'زیادکردنی بابەت' : 'Mijarek nû zêde bike'}
                             </button>
                           </div>

                           <div className="space-y-4">
                             {(appConfig?.dialectSchoolContent?.[activeAdminDialect] || []).map((topic: any, idx: number) => (
                               <div key={idx} className="bg-white/5 rounded-3xl border theme-border-soft p-5">
                                 <div className="flex items-center justify-between mb-4">
                                   <SyncInput 
                                     value={topic.title}
                                     onSync={async (val: string) => {
                                       if (!activeAdminDialect) return;
                                       const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect] || [];
                                       const list = [...currentList];
                                       if (list[idx]) {
                                         list[idx].title = val;
                                         try {
                                           await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                         } catch (err) {
                                           console.error("Sync title error:", err);
                                         }
                                       }
                                     }}
                                     className="bg-transparent text-white font-black text-sm outline-none w-2/3"
                                   />
                                   <div className="flex gap-1">
                                      <button disabled={idx === 0} onClick={() => {
                                        const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                        const list = [...currentList];
                                        if (idx > 0) {
                                          [list[idx], list[idx-1]] = [list[idx-1], list[idx]];
                                          saveGlobalConfig({ dialectSchoolContent: { ...appConfig?.dialectSchoolContent, [activeAdminDialect || '']: list } });
                                        }
                                      }} className="p-2 text-white/20"><ArrowUp size={14}/></button>
                                      <button disabled={idx === (appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || []).length - 1} onClick={() => {
                                        const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                        const list = [...currentList];
                                        if (idx < list.length - 1) {
                                          [list[idx], list[idx+1]] = [list[idx+1], list[idx]];
                                          saveGlobalConfig({ dialectSchoolContent: { ...appConfig?.dialectSchoolContent, [activeAdminDialect || '']: list } });
                                        }
                                      }} className="p-2 text-white/20"><ArrowDown size={14}/></button>
                                      <button onClick={async () => {
                                        if (!activeAdminDialect) return;
                                        if (confirm(interfaceLang === 'Sorani' ? 'ئایە دڵنیای لە سڕینەوە؟' : 'Ma tu bawer î ku tu dixwazî jê bibî?')) {
                                          const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect] || [];
                                          const list = currentList.filter((_: any, i: number) => i !== idx);
                                          try {
                                            await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                            playSound(clickAudio);
                                          } catch (err) {
                                            console.error("Delete topic error:", err);
                                          }
                                        }
                                      }} className="p-2 text-rose-500"><Trash2 size={16}/></button>
                                   </div>
                                 </div>
                                 <SyncTextarea 
                                   value={topic.content}
                                   onSync={async (val: string) => {
                                     if (!activeAdminDialect) return;
                                     const list = [...(appConfig?.dialectSchoolContent?.[activeAdminDialect] || [])];
                                     if (list[idx]) {
                                       list[idx].content = val;
                                       try {
                                         await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                       } catch (err) {
                                         console.error("Sync content error:", err);
                                       }
                                     }
                                   }}
                                   className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white/60 min-h-[100px] outline-none"
                                 />
                                 {/* Custom Metadata Fields */}
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                                   <div className="space-y-1">
                                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 ml-2">{interfaceLang === 'Sorani' ? 'پۆلێن' : 'Kategorî'}</span>
                                     <SyncInput 
                                       value={topic.category || ''}
                                       onSync={async (val: string) => {
                                         if (!activeAdminDialect) return;
                                         const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect] || [];
                                         const list = [...currentList];
                                         if (list[idx]) {
                                           list[idx].category = val;
                                           try {
                                             await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                           } catch (err) {
                                             console.error("Sync category error:", err);
                                           }
                                         }
                                       }}
                                       className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-rose-500"
                                       placeholder={interfaceLang === 'Sorani' ? 'مێژوو' : 'Dîrok'}
                                     />
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 ml-2">{interfaceLang === 'Sorani' ? 'نووسەر' : 'Nivîskar'}</span>
                                     <SyncInput 
                                       value={topic.author || ''}
                                       onSync={async (val: string) => {
                                         const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                         const list = [...currentList];
                                         list[idx].author = val;
                                         try {
                                           if (!activeAdminDialect) return;
                                           await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                         } catch (err) {
                                           console.error("Sync author error:", err);
                                         }
                                       }}
                                       className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-rose-500"
                                       placeholder="Zana"
                                     />
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 ml-2">{interfaceLang === 'Sorani' ? 'کتێب' : 'Pirtûk'}</span>
                                     <SyncInput 
                                       value={topic.book || ''}
                                       onSync={async (val: string) => {
                                         const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                         const list = [...currentList];
                                         list[idx].book = val;
                                         try {
                                           if (!activeAdminDialect) return;
                                           await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                         } catch (err) {
                                           console.error("Sync book error:", err);
                                         }
                                       }}
                                       className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-rose-500"
                                       placeholder="Rênas"
                                     />
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 ml-2">{interfaceLang === 'Sorani' ? 'وێنە' : 'Wêne'}</span>
                                     <div className="flex gap-2">
                                       <SyncInput 
                                         value={topic.image || ''}
                                         onSync={async (val: string) => {
                                           const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                           const list = [...currentList];
                                           list[idx].image = val;
                                           try {
                                             if (!activeAdminDialect) return;
                                             await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                           } catch (err) {
                                             console.error("Sync image error:", err);
                                           }
                                         }}
                                         className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-rose-500"
                                         placeholder="URL"
                                       />
                                       {topic.image && (
                                         <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                            <img src={formatImageUrl(topic.image)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 ml-2">{interfaceLang === 'Sorani' ? 'ڤیدیۆ (YouTube)' : 'Vîdyo (YouTube)'}</span>
                                     <SyncInput 
                                       value={topic.video || ''}
                                       onSync={async (val: string) => {
                                         const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                         const list = [...currentList];
                                         list[idx].video = val;
                                         try {
                                           if (!activeAdminDialect) return;
                                           await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                         } catch (err) {
                                           console.error("Sync video error:", err);
                                         }
                                       }}
                                       className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-rose-500"
                                       placeholder="YouTube URL"
                                     />
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 ml-2">{interfaceLang === 'Sorani' ? 'دەنگ (MP3)' : 'Deng (MP3)'}</span>
                                     <SyncInput 
                                       value={topic.audio || ''}
                                       onSync={async (val: string) => {
                                         const currentList = appConfig?.dialectSchoolContent?.[activeAdminDialect || ''] || [];
                                         const list = [...currentList];
                                         list[idx].audio = val;
                                         try {
                                           if (!activeAdminDialect) return;
                                           await updateDoc(doc(db, 'app', 'global'), new FieldPath('dialectSchoolContent', activeAdminDialect), list);
                                         } catch (err) {
                                           console.error("Sync audio error:", err);
                                         }
                                       }}
                                       className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-rose-500"
                                       placeholder="Audio URL (Direct)"
                                     />
                                   </div>
                                 </div>
                                 <div className="mt-4 flex flex-wrap gap-2 px-2">
                                   {['[img]URL[/img]', '[video]URL[/video]', '[b]Bold[/b]', '[i]Italic[/i]', '[center]Center[/center]'].map(tag => (
                                     <span key={tag} className="text-[7px] font-black bg-white/5 px-2 py-0.5 rounded-full text-white/30 uppercase tracking-tighter transition-colors hover:text-rose-400 cursor-default">{tag}</span>
                                   ))}
                                 </div>
                                 <p className="mt-2 text-[8px] opacity-40 text-white px-2 font-medium leading-relaxed">
                                   ✨ بۆ وێنە: (imgbb.com) یان (postimages.org) و تەنها **Direct Link**.<br/>
                                   ✨ بۆ ڤیدیۆ: تەنها لینکى **YouTube** یان لینکى ڕاستەوخۆی **MP4** دابنێ.
                                 </p>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'translator' ? (

              <motion.div 
                key="translator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 lg:left-80 lg:right-0 z-20 bg-black pb-[80px] lg:pb-0"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-white/20 font-black text-[10px] uppercase tracking-widest">{labels.checking}</p>
                  </div>
                </div>
                <iframe 
                  src="https://testkdt.streamlit.app?embed=true" 
                  className="relative z-10 w-full h-full border-none shadow-2xl bg-black"
                  title="Translator"
                  allow="geolocation; microphone; camera; clipboard-read; clipboard-write;"
                  sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
                />
              </motion.div>
            ) : activeTab === 'flashcards' ? (
              <motion.div 
                key="flashcards"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="min-h-[600px] flex flex-col items-center py-8"
              >
                 <div className="flex items-center gap-6 mb-12 w-full max-w-xl">
                   <div className="w-16 h-16 theme-bg-soft rounded-[1.5rem] flex items-center justify-center shadow-2xl border theme-border-soft">
                      <Layers size={32} className="theme-primary" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white">{labels.flashcards}</h2>
                      <p className="theme-primary font-bold uppercase tracking-widest text-[10px]">{interfaceLang === 'Sorani' ? 'وشەکانی خۆت بسپێرە بە بیرەوەری' : 'Peyvên xwe bispêre bîrgehê'}</p>
                   </div>
                  </div>
                {!flashcardSessionActive ? (
                  <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center backdrop-blur-2xl shadow-2xl">
                      <h2 className="text-3xl font-black text-white mb-4 font-afarin1">{interfaceLang === 'Sorani' ? 'ئامادەیت بۆ پێداچوونەوە؟' : 'Ji bo dubarekirinê amade yî?'}</h2>
                    <motion.button onClick={() => setFlashcardSessionActive(true)} className="w-full theme-bg-primary py-4 rounded-2xl font-black text-white shadow-xl">
                       {interfaceLang === 'Sorani' ? 'دەستپێبکە' : 'Dest pê bike'}
                    </motion.button>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl px-4 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-10 px-2">
                       <span className="text-[10px] font-black theme-primary uppercase tracking-[0.3em] font-sans">
                         {currentFlashcardIdx + 1} / {flashcards.length}
                       </span>
                       <div className="flex-1 mx-8 h-2 theme-bg-soft rounded-full overflow-hidden border theme-border-soft">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentFlashcardIdx + 1) / flashcards.length) * 100}%` }}
                            className="h-full theme-bg-primary shadow-lg"
                          />
                       </div>
                    </div>

                    <div className="w-full h-[450px] relative mb-12" style={{ perspective: '2000px' }}>
                       <AnimatePresence mode="wait">
                          <motion.div 
                             key={currentFlashcardIdx}
                             initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
                             animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                             exit={{ opacity: 0, scale: 0.9, rotateX: -15 }}
                             transition={{ duration: 0.4 }}
                             className="w-full h-full cursor-pointer"
                             onClick={() => { playSound(clickAudio); setIsFlipped(!isFlipped); }}
                          >
                             <motion.div 
                               className="relative w-full h-full"
                               animate={{ rotateY: isFlipped ? 180 : 0 }}
                               transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                               style={{ transformStyle: 'preserve-3d' }}
                             >
                                {/* Front */}
                                <div className="absolute inset-0 w-full h-full theme-bg-card theme-border-soft border-2 rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center p-12 backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                                   <div className="mb-8 theme-bg-soft w-16 h-16 rounded-2xl flex items-center justify-center border theme-border-soft">
                                      <Languages size={28} className="theme-primary opacity-50" />
                                   </div>
                                   <h3 className="text-4xl md:text-6xl font-black theme-text tracking-tighter mb-4 text-center leading-tight font-afarin1">
                                      {flashcards[currentFlashcardIdx]?.front}
                                   </h3>
                                   <div className="absolute bottom-12 opacity-20 font-black text-[9px] uppercase tracking-[0.4em] flex items-center gap-2">
                                      <Zap size={12} className="animate-pulse" />
                                      {interfaceLang === 'Sorani' ? 'دایبگرە بۆ وەرگێڕان' : 'Ji bo wateyê bitikîne'}
                                   </div>
                                </div>
                                {/* Back */}
                                <div className="absolute inset-0 w-full h-full theme-bg-soft border-2 theme-border-soft rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center p-12 backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                   <p className="text-[10px] font-black uppercase theme-primary tracking-[0.3em] mb-6">
                                      {interfaceLang === 'Sorani' ? 'واتاکەی' : 'Wateya wî'}
                                   </p>
                                   <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-8 text-center leading-tight font-afarin1">
                                      {flashcards[currentFlashcardIdx]?.back}
                                   </h3>
                                   <div className="w-16 h-1.5 theme-bg-primary rounded-full mb-8 mx-auto" />
                                   <p className="text-sm md:text-lg font-medium theme-text-muted italic leading-relaxed max-w-sm text-center px-4 font-afarin2">
                                      "{flashcards[currentFlashcardIdx]?.example}"
                                   </p>
                                </div>
                             </motion.div>
                          </motion.div>
                       </AnimatePresence>
                    </div>

                    <div className="flex gap-4 md:gap-6 w-full max-w-lg mb-12">
                       <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                             e.stopPropagation();
                             playSound(clickAudio);
                             const next = currentFlashcardIdx + 1;
                             if (next >= flashcards.length) setFlashcardSessionActive(false);
                             else { setCurrentFlashcardIdx(next); setIsFlipped(false); }
                          }}
                          className="flex-1 bg-white/5 border border-white/10 text-white/50 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl"
                       >
                          {interfaceLang === 'Sorani' ? 'دووبارە' : 'Dûbare'}
                       </motion.button>
                       <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                             e.stopPropagation();
                             playSound(correctAudio);
                             const next = currentFlashcardIdx + 1;
                             setXp(px => px + 10);
                             if (next >= flashcards.length) setFlashcardSessionActive(false);
                             else { setCurrentFlashcardIdx(next); setIsFlipped(false); }
                          }}
                          className="flex-[2] theme-bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl theme-shadow-glow"
                       >
                          {interfaceLang === 'Sorani' ? 'دەیزانم' : 'Ez dizanim'}
                       </motion.button>
                    </div>
                    
                    <button onClick={() => setFlashcardSessionActive(false)} className="text-white/20 hover:text-white/40 font-black uppercase text-[10px] tracking-[0.3em] transition-colors flex items-center gap-3 group">
                       <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                       {labels.back}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'leaderboard' ? (
              <motion.div 
                 key="leaderboard"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="space-y-12 pb-24"
              >
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 theme-bg-primary rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                       <Trophy size={32} className="text-white" />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-white tracking-tighter font-afarin1">{labels.leaderboard}</h2>
                       <p className="theme-primary font-bold uppercase tracking-widest text-[9px] font-sans opacity-70">
                          {interfaceLang === 'Sorani' ? 'ڕیزبەندی و دەستکەوتەکان' : 'Rêzbendî û destkeftî'}
                       </p>
                    </div>
                  </div>

                  <div className="flex theme-bg-card p-1 rounded-2xl border theme-border-soft w-full max-w-sm mx-auto mb-10 overflow-hidden backdrop-blur-3xl shadow-xl">
                     {(['ranking', 'achievements'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => { playSound(clickAudio); setLeaderboardSubTab(tab); }}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            leaderboardSubTab === tab 
                              ? 'theme-bg-primary text-white shadow-xl' 
                              : 'theme-text opacity-40 hover:opacity-100 hover:theme-bg-soft'
                          }`}
                        >
                          {tab === 'ranking' ? labels.rankingTab : labels.achievementsTab}
                        </button>
                     ))}
                  </div>

                  <AnimatePresence mode="wait">
                     {leaderboardSubTab === 'ranking' ? (
                        <motion.div key="ranking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                           {leaderboard.length > 0 ? (
                             leaderboard.slice(0, 30).map((u, i) => (
                               <div 
                                 key={u.id} 
                                 onClick={() => { playSound(clickAudio); setSelectedUserForDetail(u); }}
                                 className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${u.id === user?.uid ? 'theme-bg-soft border-yellow-400/30 shadow-2xl' : 'theme-bg-card theme-border-soft'}`}
                               >
                                  {u.id === user?.uid && <div className="absolute left-0 top-0 bottom-0 w-1 theme-bg-primary" />}
                                  <div className="flex items-center gap-5">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm italic ${
                                       i === 0 ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_20px_rgba(250,204,21,0.4)]' :
                                       i === 1 ? 'bg-gray-300 text-gray-800' :
                                       i === 2 ? 'bg-amber-600 text-amber-50' :
                                       'bg-white/10 text-white/40'
                                     }`}>
                                        {i + 1}
                                     </div>
                                     <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 theme-border-soft shadow-inner">
                                        <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName}`} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                     </div>
                                     <div>
                                        <p className={`text-base font-black font-afarin1 ${u.id === user?.uid ? 'text-white' : 'theme-text'}`}>{u.displayName || 'Bikarhêner'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                           <Flame size={12} className="theme-primary" />
                                           <p className="text-[10px] theme-text opacity-40 font-bold uppercase tracking-widest">{u.xp} XP</p>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                     <div className="w-12 h-12 rounded-2xl theme-bg-soft border theme-border-soft flex items-center justify-center group-hover:theme-bg-primary transition-colors">
                                        <Star size={18} className="theme-primary group-hover:text-white transition-colors" />
                                     </div>
                                  </div>
                               </div>
                             ))
                           ) : (
                             <div className="py-24 text-center">
                                <div className="w-20 h-20 theme-bg-soft rounded-full flex items-center justify-center mx-auto mb-6 border theme-border-soft">
                                   <Loader2 size={32} className="theme-primary animate-spin" />
                                </div>
                                <p className="opacity-20 font-black uppercase text-xs tracking-widest font-afarin1">{labels.checking}...</p>
                             </div>
                           )}
                        </motion.div>
                     ) : (
                        <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                           {ACHIEVEMENTS.map(ach => {
                             const isEarned = achievements.includes(ach.id);
                             return (
                               <div key={ach.id} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col items-center text-center group ${isEarned ? 'theme-bg-soft theme-border-soft-50 shadow-xl' : 'theme-bg-card opacity-20 saturate-0 grayscale'}`}>
                                  <div className={`w-16 h-16 rounded-[1.5rem] mb-6 flex items-center justify-center text-white shadow-lg ${isEarned ? ach.color : 'bg-gray-700/50'}`}>
                                     <Star size={28} className={isEarned ? 'animate-pulse' : ''} />
                                  </div>
                                  <h4 className="text-sm font-black theme-text mb-2 uppercase tracking-tighter font-afarin1">{isRTL ? ach.title.Sorani : ach.title.Kurmanji}</h4>
                                  <p className="text-[10px] theme-text opacity-50 font-medium leading-relaxed font-afarin2">{isRTL ? ach.description.Sorani : ach.description.Kurmanji}</p>
                               </div>
                             );
                           })}
                        </motion.div>
                     )}
                  </AnimatePresence>
              </motion.div>
            ) : (appConfig?.extraTabs || []).some((t: any) => t.id === activeTab) ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 theme-bg-card border theme-border-soft rounded-[3rem] min-h-[60vh] backdrop-blur-3xl"
              >
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
                   <div className="w-12 h-12 theme-bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="text-white" />
                   </div>
                   <h2 className="text-3xl font-black text-white tracking-tighter font-afarin1">
                      {activeTabsList.find(t => t.id === activeTab)?.label}
                   </h2>
                </div>
                <div 
                  className="prose prose-invert max-w-none text-white/80 font-medium leading-[2]"
                  dangerouslySetInnerHTML={{ 
                    __html: (appConfig.extraTabs.find((t: any) => t.id === activeTab)?.content || '')
                      .replace(/\n/g, '<br/>') 
                  }} 
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUserForDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedUserForDetail(null)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg theme-bg-card rounded-[3rem] border theme-border-soft overflow-hidden shadow-2xl"
            >
              {/* Banner */}
              <div className="h-40 relative group overflow-hidden bg-slate-900">
                {selectedUserForDetail.bannerUrl ? (
                  <img src={selectedUserForDetail.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 opacity-20" />
                )}
                <button 
                  onClick={() => setSelectedUserForDetail(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Info */}
              <div className="px-8 pb-10 flex flex-col items-center text-center -mt-16 relative z-10">
                <div className="w-32 h-32 rounded-full border-8 border-[#0f172a] overflow-hidden mb-4 shadow-2xl p-1 bg-white/5 relative">
                  <img 
                    src={selectedUserForDetail.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserForDetail.displayName || 'u'}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-full" 
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-white mt-4 mb-1 font-afarin1 tracking-tight">
                  {selectedUserForDetail.displayName || 'Bikarhêner'}
                </h3>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 theme-bg-primary rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {labels.level} {Math.floor((selectedUserForDetail.xp || 0) / 1000) + 1}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="text-[10px] theme-text opacity-40 font-black uppercase tracking-widest">
                    Ranked #{leaderboard.findIndex(u => u.id === selectedUserForDetail.id) + 1}
                  </span>
                </div>

                {selectedUserForDetail.bio && (
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-8 w-full">
                    <p className="text-sm theme-text font-bold italic opacity-70 leading-relaxed font-afarin1">
                      "{selectedUserForDetail.bio}"
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="p-6 theme-bg-soft rounded-3xl border theme-border-soft flex flex-col items-center justify-center">
                    <Flame size={24} className="theme-primary mb-2" />
                    <span className="text-2xl font-black theme-text leading-none mb-1">{selectedUserForDetail.xp || 0}</span>
                    <span className="text-[9px] font-black uppercase theme-primary tracking-widest opacity-60">Total XP</span>
                  </div>
                  <div className="p-6 theme-bg-soft rounded-3xl border theme-border-soft flex flex-col items-center justify-center">
                    <GraduationCap size={24} className="theme-primary mb-2" />
                    <span className="text-2xl font-black theme-text leading-none mb-1">
                      {Array.isArray(selectedUserForDetail.learnedLessons) ? selectedUserForDetail.learnedLessons.length : 0}
                    </span>
                    <span className="text-[9px] font-black uppercase theme-primary tracking-widest opacity-60">{labels.lessonsCompleted}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refined Fixed Bottom Nav for Mobile */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-14 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-around px-2 z-50 shadow-2xl">
        {activeTabsList.map(tab => (
          <MobileNavBtn 
            key={tab.id}
            active={activeTab === tab.id} 
            label={tab.label}
            onClick={() => { playSound(clickAudio); setActiveTab(tab.id); }} 
            icon={typeof tab.icon === 'string' ? <Sparkles size={18} /> : React.createElement(tab.icon as any, { size: 18 })} 
          />
        ))}
      </nav>

      {/* Stats Overlay (Desktop Floating Glass Card) */}
      <div className="hidden xl:block fixed top-16 right-16 w-80 space-y-8 z-50">
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-10 theme-glass rounded-[3rem] shadow-2xl relative overflow-hidden"
        >
           {/* Cultural Decorative Sun in Background */}
           <div className="absolute -top-10 -right-10 w-40 h-40 opacity-5 pointer-events-none">
              <div className="w-full h-full bg-yellow-400 rounded-full shadow-[0_0_100px_rgba(245,231,0,0.5)] flex items-center justify-center">
                 {[...Array(21)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-1/2 left-1/2 w-full h-[2px] bg-yellow-400 origin-left"
                      style={{ transform: `translate(-50%, -50%) rotate(${i * (360 / 21)}deg) translateX(50%)` }}
                    />
                 ))}
              </div>
           </div>

           <div className="flex items-center gap-5 mb-8 relative z-10">
              <div className="w-16 h-16 rounded-full border-2 theme-border-primary p-1 overflow-hidden shadow-2xl relative">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full theme-bg-primary flex items-center justify-center text-white text-xl font-black rounded-full">
                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || <UserIcon size={24} />}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase theme-primary tracking-widest">{user?.displayName || 'خانی'}</p>
                <p className="text-2xl font-black theme-text tracking-tighter leading-none">{interfaceLang === 'Sorani' ? 'پێشکەوتن' : 'Pêşketin'}</p>
              </div>
           </div>
           
           <div className="space-y-3">
              <div className="w-full theme-bg-soft h-4 rounded-full overflow-hidden border theme-border-soft p-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(learnedLessons.size / units.flatMap(u => u.lessons).length) * 100}%` }}
                   className="h-full theme-bg-primary rounded-full theme-shadow-primary shadow-lg" 
                 />
              </div>
              <div className="flex justify-between items-center px-1">
                 <p className="text-[10px] font-black theme-text opacity-40 uppercase">کۆتایی وانەکان</p>
                 <p className="text-xs font-black theme-text opacity-80">{learnedLessons.size} / {units.flatMap(u => u.lessons).length}</p>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Flame size={20} className="text-orange-500" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{labels.streak}</p>
                      <p className="text-xl font-black theme-text">{streak}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl theme-bg-primary/20 flex items-center justify-center">
                      <Trophy size={20} className="theme-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black theme-primary uppercase tracking-widest">{labels.xp}</p>
                      <p className="text-xl font-black theme-text">{xp}</p>
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </motion.div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.2); }
      `}</style>
      
      <AnimatePresence>
        {showCropper && imageToCrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10"
          >
            <div className="relative w-full max-w-2xl h-[60vh] md:h-[70vh] bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="w-full max-w-2xl mt-8 space-y-6">
              <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-6">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowCropper(false);
                    setImageToCrop(null);
                  }}
                  className="py-5 rounded-3xl font-black text-white/50 border-2 border-white/10 hover:theme-bg-soft transition-all"
                >
                  {interfaceLang === 'Sorani' ? 'پاشگەزبوونەوە' : 'Betal Bike'}
                </button>
                <button
                  onClick={onCropSave}
                  className="py-5 rounded-3xl font-black text-white theme-bg-primary shadow-2xl shadow-purple-500/20 active:scale-95 transition-all"
                >
                  {interfaceLang === 'Sorani' ? 'پاشەکەوتکردن' : 'Tomar Bike'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/10"
            style={{ 
              backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'
            }}
          >
            {toast.type === 'success' && <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Check size={14} className="text-white" /></div>}
            {toast.type === 'error' && <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Info size={14} className="text-white" /></div>}
            <span className="text-sm font-black text-white font-afarin1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Quota Exceeded Banner */}
      {sessionStorage.getItem('ferga_quota_exceeded') && (
        <div className="fixed top-0 left-0 w-full z-[1000] bg-yellow-500 text-black px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-2 shadow-lg">
          <Zap size={14} />
          {isSorani 
            ? 'تێبینی: ژمارەی هەوڵە ڕێگەپێدراوەکانی داتابەیس تەواو بووە. بەرەوپێشچوونەکانت تەنها لەم ئامێرەدا پاشکەوت دەکرێن پاش ئەوەی بەیانی سەردانمان دەکەیت.' 
            : 'Nîşe: Kotaya danegehê qediya ye. Pêşkeftina we dê tenê li ser vê amûrê were tomarkirin heta sibe.'}
          <button 
            onClick={() => { sessionStorage.removeItem('ferga_quota_exceeded'); window.location.reload(); }}
            className="underline ml-4"
          >
            {isSorani ? 'دووبارە هەوڵبدەرەوە' : 'Dîsa biceribîne'}
          </button>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}


const CulturalQuote = ({ interfaceLang }: { interfaceLang: InterfaceLang }) => {
  const quotes = [
    { sorani: "بەردەوام بە، سەرکەوتن نزیکە", kurmanji: "Berdewam be, serkeftin nêzîk e" },
    { sorani: "زمان ناسنامەی نەتەوەیە", kurmanji: "Ziman nasnameya neteweyê ye" },
    { sorani: "کورد فێرە، چونکە لێهاتووە", kurmanji: "Kurd fêr e, çunkî jêhatî ye" }
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center relative overflow-hidden my-8"
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <KurdistanMap />
      </div>
      <Quote size={24} className="theme-primary mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium text-white/70 italic mb-2 leading-relaxed font-afarin1">
        "{interfaceLang === 'Sorani' ? quote.sorani : quote.kurmanji}"
      </p>
      <div className="flex items-center justify-center gap-2">
        <div className="w-4 h-[1px] bg-white/10" />
        <span className="text-[10px] font-black uppercase theme-primary tracking-widest font-afarin1">{interfaceLang === 'Sorani' ? 'فێرگەی خانی' : 'Fêrga Xanî'}</span>
        <div className="w-4 h-[1px] bg-white/10" />
      </div>
    </motion.div>
  );
};

function NavBtn({ active, icon, label, onClick }: any) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02, x: 6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all ${
        active 
          ? 'theme-bg-primary text-white shadow-lg theme-shadow-primary' 
          : 'theme-text opacity-40 hover:bg-white/5 hover:opacity-100'
      }`}
    >
      <span className={active ? 'text-white' : 'theme-text opacity-30 transition-colors'}>{icon}</span>
      <span className="truncate font-afarin1">{label}</span>
      {active && (
        <motion.div 
            layoutId="active-indicator"
            className="ms-auto w-1.5 h-1.5 theme-bg-soft rounded-full opacity-60"
        />
      )}
    </motion.button>
  );
}

function MobileNavBtn({ active, icon, label, onClick }: any) {
  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${active ? 'theme-primary' : 'text-white/20'}`}
    >
      <div className={`transition-all duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
        {icon}
      </div>
      {active && (
        <motion.div 
            layoutId="activeTabIndicator"
            className="absolute -top-1 w-1 h-1 rounded-full theme-bg-primary"
        />
      )}
      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 font-afarin1 transition-opacity ${active ? 'opacity-100' : 'opacity-0 h-0 hidden'}`}>
        {label}
      </span>
    </motion.button>
  );
}

function HeaderIcon({ icon, val, label }: { icon: any, val: number, label?: string }) {
  return (
    <motion.div 
      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors group cursor-default"
    >
      <div className="text-white/40 transition-transform group-hover:scale-110 group-hover:text-white">
        {React.cloneElement(icon as React.ReactElement, { size: 14 })}
      </div>
      <div className="flex flex-col items-start">
        <span className="font-black text-sm leading-none text-white/90 font-afarin1">{val}</span>
        {label && <span className="text-[9px] font-bold uppercase theme-primary tracking-wider mt-0.5 opacity-60">{label}</span>}
      </div>
    </motion.div>
  );
}
