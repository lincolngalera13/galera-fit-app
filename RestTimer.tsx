import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, ChevronDown, Bell } from 'lucide-react';

export const RestTimer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // em segundos
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Audio context ref para manter a instância ativa
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Função para desbloquear o áudio no primeiro clique (necessário para iOS/Chrome)
  const unlockAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
        // Toca um som inaudível para "aquecer" o contexto
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start(0);
        osc.stop(0.001);
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playAlarm = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;

      // Sequência de bips digitais estilo relógio esportivo
      [0, 0.2, 0.4, 0.6, 1.5].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'square'; // Som mais "digital" e perceptível
        // Último bip mais longo e grave
        osc.frequency.value = i === 4 ? 600 : 880; 
        
        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + (i === 4 ? 0.8 : 0.1));

        osc.start(now + offset);
        osc.stop(now + offset + (i === 4 ? 0.8 : 0.15));
      });

    } catch (e) {
      console.error("Erro ao tocar som", e);
    }
  };

  // Lógica do Timer baseada em Date.now() para funcionar em background
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);

        if (diff <= 0) {
          setTimeLeft(0);
          setIsActive(false);
          setEndTime(null);
          
          // Ações de fim de timer
          playAlarm();
          if (navigator.vibrate) {
            // Padrão de vibração muito agressivo para garantir percepção
            navigator.vibrate([500, 100, 500, 100, 500, 100, 1000]);
          }
          
        } else {
          setTimeLeft(diff);
        }
      }, 200); // Checagem mais frequente para precisão visual
    }

    return () => clearInterval(interval);
  }, [isActive, endTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startTimer = (seconds: number) => {
    unlockAudio(); // Garante que o áudio pode tocar
    
    const now = Date.now();
    setInitialTime(seconds);
    setEndTime(now + seconds * 1000);
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => {
    unlockAudio();
    
    if (isActive) {
      // Pausar
      setIsActive(false);
      setEndTime(null);
    } else {
      // Retomar ou Iniciar
      if (timeLeft > 0) {
        const now = Date.now();
        setEndTime(now + timeLeft * 1000);
        setIsActive(true);
      } else if (initialTime > 0) {
        startTimer(initialTime);
      }
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(initialTime);
  };

  const presets = [30, 45, 60, 90, 120];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center animate-fadeIn ${
            isActive && timeLeft === 0 
            ? 'bg-red-500 animate-bounce shadow-red-500/50' // Feedback visual forte quando acaba
            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-900 shadow-emerald-500/30'
        }`}
        title="Timer de Descanso"
      >
        {isActive ? (
           <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
        ) : (
           <Clock className="w-6 h-6" />
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 w-72 bg-slate-800 border rounded-2xl shadow-2xl p-4 animate-fadeIn ${timeLeft === 0 && initialTime > 0 ? 'border-red-500 ring-4 ring-red-500/20' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Descanso</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6 relative">
        <div className={`text-5xl font-mono font-bold transition-colors ${timeLeft === 0 && initialTime > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {formatTime(timeLeft)}
        </div>
        {timeLeft === 0 && initialTime > 0 && (
            <div className="absolute w-full text-center -bottom-4 animate-bounce">
                <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Tempo Esgotado!</p>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleTimer}
          className={`p-3 rounded-full flex items-center justify-center transition-all ${
            isActive 
              ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
          }`}
        >
          {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
        </button>
        
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((seconds) => (
          <button
            key={seconds}
            onClick={() => startTimer(seconds)}
            className={`py-2 px-1 rounded-lg text-xs font-bold border transition-colors ${
              initialTime === seconds 
                ? 'bg-slate-700 border-emerald-500/50 text-emerald-400' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
          </button>
        ))}
        <button 
            onClick={() => startTimer(0)}
            className="py-2 px-1 rounded-lg text-xs font-bold border border-red-900/30 bg-red-900/20 text-red-400 hover:bg-red-900/40"
        >
            Zerar
        </button>
      </div>
    </div>
  );
};