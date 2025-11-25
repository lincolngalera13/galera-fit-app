import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TreadmillWorkout } from '../types';
import { generateTreadmillWorkout } from '../services/geminiService';
import { Play, Pause, ChevronLeft, Volume2, VolumeX, Gauge, Activity, Sparkles, Loader2, Timer, Flame, Mic } from 'lucide-react';

interface TreadmillCoachProps {
  profile: UserProfile;
  onExit: () => void;
  onComplete: (data: { duration: number, calories: number }) => void;
}

export const TreadmillCoach: React.FC<TreadmillCoachProps> = ({ profile, onExit, onComplete }) => {
  const [setupMode, setSetupMode] = useState(true);
  const [workout, setWorkout] = useState<TreadmillWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Execution State
  const [isActive, setIsActive] = useState(false);
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
  const [timeLeftInSegment, setTimeLeftInSegment] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  // Setup Form
  const [type, setType] = useState('HIIT');
  const [duration, setDuration] = useState(20);
  const [difficulty, setDifficulty] = useState('Intermediário');

  // Voice State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  
  // Carregar vozes com Retry agressivo (Corrige bug de lista vazia no Chrome Android)
  useEffect(() => {
    const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        
        if (available.length > 0) {
            // Filtrar apenas vozes úteis
            const usefulVoices = available.filter(v => 
                v.lang.toLowerCase().includes('pt') || 
                v.lang.toLowerCase().includes('en')
            );
            
            // Ordenação: PT-BR > PT > Resto
            usefulVoices.sort((a, b) => {
                const getScore = (v: SpeechSynthesisVoice) => {
                    const l = v.lang.toLowerCase();
                    const n = v.name.toLowerCase();
                    if (l === 'pt-br' || l === 'pt_br') return 10;
                    if (n.includes('google') && l.includes('pt')) return 5;
                    if (l.includes('pt')) return 4;
                    return 0;
                };
                return getScore(b) - getScore(a);
            });

            setVoices(prev => {
                // Evita loop infinito se a lista for igual
                if (prev.length === usefulVoices.length && prev.length > 0 && prev[0].voiceURI === usefulVoices[0].voiceURI) {
                    return prev;
                }
                return usefulVoices;
            });

            // Auto-selecionar a melhor voz PT-BR
            setSelectedVoiceURI(current => {
                if (current) return current;
                const best = usefulVoices.find(v => v.lang.toLowerCase().includes('pt'));
                return best ? best.voiceURI : (usefulVoices[0]?.voiceURI || '');
            });
        }
    };

    loadVoices();
    
    // Event listener padrão
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Polling agressivo por 5 segundos (Solução para mobile que demora a carregar engine TTS)
    const intervalId = setInterval(loadVoices, 500);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);
    
    return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string, priority = false) => {
    if (isMuted) return;
    
    if (priority) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const chosenVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    
    if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
    } else {
        utterance.lang = 'pt-BR';
    }
    
    utterance.rate = 1.1; 
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleTestVoice = () => {
      speak("Olá! Testando a voz do seu treinador. Vamos treinar?", true);
  };

  const handleGenerate = async () => {
      setLoading(true);
      try {
          const generated = await generateTreadmillWorkout(type, duration, difficulty, profile);
          setWorkout(generated);
          setSetupMode(false);
          if (generated.segments.length > 0) {
              setTimeLeftInSegment(generated.segments[0].duration);
          }
      } catch (e) {
          alert("Erro ao gerar treino. Tente novamente.");
      } finally {
          setLoading(false);
      }
  };

  // Main Loop do Treino
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && workout) {
        interval = setInterval(() => {
            setTotalSecondsElapsed(prev => prev + 1);
            
            // --- Cálculos de Calorias (METs simplificado) ---
            const currentSeg = workout.segments[currentSegmentIdx];
            const weight = profile.weight || 70;
            const speed = currentSeg.speed;
            const incline = currentSeg.incline;
            
            let met = 1.0; 
            if (speed < 5) met = 3.5; 
            else if (speed < 8) met = 6.0; 
            else met = 8.0 + (speed - 8.0); 
            met += (incline * 0.1);

            const kcalPerSec = (met * 3.5 * weight) / 12000; 
            setCaloriesBurned(prev => prev + kcalPerSec);

            setTimeLeftInSegment(prev => {
                const newValue = prev - 1;

                // --- Lógica de Aviso Antecipado (10s exatos) ---
                if (newValue === 10) {
                    const nextSeg = workout.segments[currentSegmentIdx + 1];
                    if (nextSeg) {
                        let action = "Mudar para";
                        if (nextSeg.speed > currentSeg.speed) action = "Acelerar para"; 
                        else if (nextSeg.speed < currentSeg.speed) action = "Reduzir para";
                        else if (nextSeg.incline > currentSeg.incline) action = "Subir para";
                        
                        // Frase prioritária
                        speak(`Atenção. ${action} ${nextSeg.speed}. Em 10 segundos.`, true);
                    } else {
                        speak("Reta final. Últimos 10 segundos!", true);
                    }
                }

                // --- Contagem Regressiva 3, 2, 1 ---
                if (newValue <= 3 && newValue > 0) {
                    speak(`${newValue}`);
                }

                // --- Troca de Segmento ---
                if (newValue <= 0) {
                    const nextIdx = currentSegmentIdx + 1;
                    
                    if (nextIdx < workout.segments.length) {
                        setCurrentSegmentIdx(nextIdx);
                        const nextSeg = workout.segments[nextIdx];
                        
                        // Comando do novo segmento
                        speak(nextSeg.instruction, true);
                        return nextSeg.duration;
                    } else {
                        // Fim do treino
                        setIsActive(false);
                        speak("Treino concluído! Parabéns!", true);
                        
                        onComplete({
                            duration: totalSecondsElapsed + 1,
                            calories: caloriesBurned
                        });
                        return 0;
                    }
                }
                return newValue;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, workout, currentSegmentIdx, selectedVoiceURI, voices, totalSecondsElapsed, caloriesBurned]);

  const togglePlay = () => {
      // Início do treino (primeiro play)
      if (!isActive && currentSegmentIdx === 0 && timeLeftInSegment === workout?.segments[0].duration) {
         const seg = workout!.segments[0];
         speak(`Iniciando treino. ${seg.instruction}.`, true);
      }
      setIsActive(!isActive);
  };

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (setupMode) {
      return (
          <div className="min-h-screen bg-slate-900 p-6 flex flex-col animate-fadeIn">
              <button onClick={onExit} className="self-start text-slate-400 mb-6 flex items-center gap-2">
                  <ChevronLeft /> Voltar
              </button>
              
              <div className="max-w-lg mx-auto w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-orange-500 rounded-full">
                          <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Personal de Esteira</h2>
                        <p className="text-slate-400 text-xs">Crie seu treino intervalado</p>
                      </div>
                  </div>

                  <div className="space-y-6">
                      {/* Seletor de Voz */}
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                          <label className="block text-emerald-400 mb-2 font-bold text-sm flex items-center gap-2">
                             <Mic className="w-4 h-4" /> Voz do Treinador
                          </label>
                          <div className="flex gap-2">
                              <select 
                                value={selectedVoiceURI} 
                                onChange={e => setSelectedVoiceURI(e.target.value)}
                                className="flex-1 bg-slate-800 text-white p-2 rounded-lg border border-slate-600 text-sm"
                              >
                                  {voices.length === 0 && <option>Carregando vozes...</option>}
                                  {voices.map(v => (
                                      <option key={v.voiceURI} value={v.voiceURI}>
                                          {v.name}
                                      </option>
                                  ))}
                              </select>
                              <button 
                                onClick={handleTestVoice}
                                className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30"
                              >
                                  Testar
                              </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2">
                              Dica: No Android, instale "Reconhecimento de Fala e Síntese do Google" para ter vozes PT-BR de alta qualidade.
                          </p>
                      </div>

                      <div>
                          <label className="block text-slate-400 mb-2 font-bold text-sm">Tipo de Treino</label>
                          <div className="grid grid-cols-2 gap-2">
                              {['HIIT', 'Queima de Gordura', 'Resistência', 'Ladeiras'].map(t => (
                                  <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`p-3 rounded-lg border text-xs font-bold transition-all ${type === t ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
                                  >
                                      {t}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                           <label className="block text-slate-400 mb-2 font-bold text-sm">Duração: {duration} min</label>
                           <input 
                              type="range" min="10" max="60" step="5"
                              value={duration} onChange={e => setDuration(Number(e.target.value))}
                              className="w-full accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                           />
                           <div className="flex justify-between text-xs text-slate-500 px-1 mt-1 font-mono">
                               <span>10m</span><span>35m</span><span>60m</span>
                           </div>
                      </div>

                      <div>
                           <label className="block text-slate-400 mb-2 font-bold text-sm">Nível de Dificuldade</label>
                           <select 
                             value={difficulty} onChange={e => setDifficulty(e.target.value)}
                             className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                           >
                               <option value="Iniciante">Iniciante (Caminhada/Trote)</option>
                               <option value="Intermediário">Intermediário (Corridas Leves)</option>
                               <option value="Avançado">Avançado (Tiros Rápidos)</option>
                           </select>
                      </div>

                      <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                          Gerar Treino com IA
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const currentSeg = workout?.segments[currentSegmentIdx];
  const nextSeg = workout?.segments[currentSegmentIdx + 1];
  
  const currentTotal = currentSeg?.duration || 1;
  const progress = ((currentTotal - timeLeftInSegment) / currentTotal) * 100;

  const paceVal = currentSeg && currentSeg.speed > 0 ? 60 / currentSeg.speed : 0;
  const paceMin = Math.floor(paceVal);
  const paceSec = Math.round((paceVal - paceMin) * 60);
  const paceStr = `${paceMin}'${paceSec < 10 ? '0' : ''}${paceSec}"`;

  return (
      <div className="fixed inset-0 bg-black text-white flex flex-col animate-fadeIn relative overflow-hidden z-50">
          <div className={`absolute inset-0 opacity-20 transition-colors duration-1000 ${currentSeg?.phase === 'Sprint' ? 'bg-red-600' : currentSeg?.phase === 'Recovery' ? 'bg-blue-600' : 'bg-orange-600'}`} />
          
          <div className="relative z-10 flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onExit} className="p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 text-xs font-bold flex items-center gap-1 px-3 border border-slate-700">
                    <ChevronLeft className="w-4 h-4" /> Sair
                </button>
                <div className="flex flex-col items-center">
                    <h3 className="font-bold text-slate-300 text-xs uppercase tracking-widest truncate max-w-[150px]">{workout?.title}</h3>
                    <div className="flex gap-0.5 mt-1">
                        {workout?.segments.map((_, idx) => (
                            <div key={idx} className={`h-1 w-2 rounded-full transition-colors ${idx === currentSegmentIdx ? 'bg-orange-500 scale-125' : idx < currentSegmentIdx ? 'bg-slate-500' : 'bg-slate-800'}`} />
                        ))}
                    </div>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border border-slate-700 ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800/80 text-orange-400'}`}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                
                <div className={`px-6 py-2 rounded-full border-2 text-lg font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                    currentSeg?.phase === 'Sprint' ? 'border-red-500 bg-red-900/50 text-red-100' : 
                    currentSeg?.phase === 'Recovery' ? 'border-blue-500 bg-blue-900/50 text-blue-100' : 
                    'border-orange-500 bg-orange-900/50 text-orange-100'
                }`}>
                    {currentSeg?.phase === 'Warmup' ? 'Aquecimento' : 
                     currentSeg?.phase === 'Run' ? 'Corrida' : 
                     currentSeg?.phase === 'Sprint' ? 'Tiro Máximo' : 
                     currentSeg?.phase === 'Recovery' ? 'Recuperação' : 
                     currentSeg?.phase === 'Cooldown' ? 'Resfriamento' : currentSeg?.phase}
                </div>

                <div className="relative flex items-center justify-center my-2">
                     <svg width="260" height="260" viewBox="0 0 260 260" className="rotate-[-90deg]">
                         <circle 
                            cx="130" cy="130" r="115" 
                            stroke="#1e293b" strokeWidth="12" fill="none" 
                         />
                         <circle 
                            cx="130" cy="130" r="115" 
                            stroke={currentSeg?.phase === 'Sprint' ? '#ef4444' : currentSeg?.phase === 'Recovery' ? '#3b82f6' : '#f97316'} 
                            strokeWidth="12" fill="none" 
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 115}
                            strokeDashoffset={2 * Math.PI * 115 * (1 - progress / 100)}
                            className="transition-all duration-1000 ease-linear"
                         />
                     </svg>
                     
                     <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div className={`text-7xl font-black font-mono tracking-tighter tabular-nums ${timeLeftInSegment <= 10 ? 'text-red-500 scale-110 transition-transform' : 'text-white'}`}>
                            {formatTime(timeLeftInSegment)}
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Restante</p>
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                        <Gauge className="w-5 h-5 text-emerald-400 mb-1" />
                        <span className="text-4xl font-bold font-mono">{currentSeg?.speed}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">km/h</span>
                    </div>
                    <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                        <Activity className="w-5 h-5 text-purple-400 mb-1" />
                        <span className="text-4xl font-bold font-mono">{currentSeg?.incline}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Inclinação %</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                     <div className="flex items-center justify-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                         <Timer className="w-4 h-4 text-blue-400" />
                         <p className="text-xs font-mono text-blue-100">Pace: <span className="font-bold">{paceStr}</span> /km</p>
                     </div>
                     <div className="flex items-center justify-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                         <Flame className="w-4 h-4 text-orange-400" />
                         <p className="text-xs font-mono text-orange-100"><span className="font-bold">{Math.round(caloriesBurned)}</span> kcal</p>
                     </div>
                </div>

                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-xl w-full min-h-[80px] flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-orange-500"></div>
                    <p className="text-base font-medium text-slate-200 leading-tight">
                        "{currentSeg?.instruction}"
                    </p>
                </div>
            </div>

            <div className={`mt-3 rounded-xl p-3 flex items-center justify-between border transition-all duration-500 ${timeLeftInSegment <= 10 ? 'bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-slate-800/50 border-slate-700'}`}>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Próx</span>
                        {timeLeftInSegment <= 10 && <span className="text-xs font-bold text-yellow-400 animate-ping">{timeLeftInSegment}</span>}
                    </div>
                    <div className="h-8 w-px bg-slate-600" />
                    <div className="text-left">
                        <p className="font-bold text-sm text-white">{nextSeg ? (nextSeg.phase === 'Run' ? 'Corrida' : nextSeg.phase) : 'Fim do Treino'}</p>
                        {nextSeg && <p className="text-[10px] text-slate-400">Prep: {nextSeg.speed} km/h</p>}
                    </div>
                </div>
                {nextSeg && (
                    <div className="text-right">
                         {nextSeg.speed > (currentSeg?.speed || 0) 
                            ? <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">▲ Acelerar</span>
                            : nextSeg.speed < (currentSeg?.speed || 0)
                                ? <span className="text-blue-400 font-bold text-xs flex items-center gap-1">▼ Reduzir</span>
                                : <span className="text-slate-400 font-bold text-xs">= Manter</span>
                         }
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-center pb-2">
                <button 
                    onClick={togglePlay}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]'} scale-100 active:scale-95 border-4 border-slate-900`}
                >
                    {isActive ? <Pause className="w-8 h-8 text-slate-900 fill-current" /> : <Play className="w-8 h-8 text-slate-900 fill-current ml-1" />}
                </button>
            </div>
          </div>
      </div>
  );
};