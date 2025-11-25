import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, WorkoutPlan, ExerciseLog, Exercise, t } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { TreadmillCoach } from './TreadmillCoach';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Trophy, Flame, LogOut, Sparkles, Check, PartyPopper, RefreshCw, Loader2, CheckCheck, Plus, Activity, PlayCircle, Download } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { RegenerateModal } from './RegenerateModal';
import { AddExerciseModal } from './AddExerciseModal';
import { RestTimer } from './RestTimer';
import { generateExtraExercises } from '../services/geminiService';

interface DashboardProps {
  profile: UserProfile;
  plan: WorkoutPlan;
  logs: ExerciseLog[];
  onUpdateLog: (log: ExerciseLog) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onSwapExercise: (dayIndex: number, exerciseId: string) => Promise<void>;
  onEditExercise: (dayIndex: number, exerciseId: string, updatedData: Partial<Exercise>) => void;
  onAddExercises: (dayIndex: number, exercises: Exercise[]) => void;
  onRegeneratePlan: (updatedProfile: UserProfile) => Promise<void>;
  onReset: () => void;
  isSyncing: boolean;
  installPrompt: any;
  onInstall: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    profile, plan, logs, 
    onUpdateLog, onUpdateProfile, onSwapExercise, onEditExercise, onAddExercises, 
    onRegeneratePlan, onReset, isSyncing, installPrompt, onInstall
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [suggestedDayIndex, setSuggestedDayIndex] = useState(0);
  const [view, setView] = useState<'workout' | 'cardio' | 'progress'>('workout');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Cardio State
  const [isTreadmillRunning, setIsTreadmillRunning] = useState(false);

  const lang = profile.language || 'pt';
  const currentDay = plan.days[selectedDayIndex];
  const today = new Date().toISOString().split('T')[0];

  // Smart Schedule Logic
  useEffect(() => {
    if (plan && plan.days.length > 0) {
        const sortedLogs = [...logs]
            .filter(l => l.completed && !l.exerciseId.startsWith('treadmill_')) // Ignore cardio logs for schedule
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedLogs.length > 0) {
            const lastLog = sortedLogs[0];
            let lastDayIndex = -1;
            plan.days.forEach((day, idx) => {
                if (day.exercises.some(e => e.id === lastLog.exerciseId)) {
                    lastDayIndex = idx;
                }
            });

            if (lastDayIndex !== -1) {
                if (lastLog.date === today) {
                    setSuggestedDayIndex(lastDayIndex);
                    setSelectedDayIndex(lastDayIndex);
                } else {
                    const nextIndex = (lastDayIndex + 1) % plan.days.length;
                    setSuggestedDayIndex(nextIndex);
                    setSelectedDayIndex(nextIndex);
                }
                return;
            }
        }
        setSuggestedDayIndex(0);
        setSelectedDayIndex(0);
    }
  }, [plan, logs.length, today]);

  const handleLogUpdate = (exerciseId: string, weight: number, completed: boolean) => {
    onUpdateLog({
      exerciseId,
      weightUsed: weight,
      completed,
      date: today
    });
  };

  const handleFinishWorkout = () => {
      let hasUpdates = false;
      currentDay.exercises.forEach(exercise => {
          const existingLog = logs.find(l => l.exerciseId === exercise.id && l.date === today);
          if (!existingLog || !existingLog.completed) {
              const previousLog = logs.find(l => l.exerciseId === exercise.id && l.completed);
              const weightToUse = existingLog?.weightUsed || previousLog?.weightUsed || 0;
              
              onUpdateLog({
                  exerciseId: exercise.id,
                  weightUsed: weightToUse,
                  completed: true,
                  date: today
              });
              hasUpdates = true;
          }
      });

      setShowCelebration(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  const handleTreadmillComplete = (data: { duration: number, calories: number }) => {
      setIsTreadmillRunning(false);
      onUpdateLog({
          exerciseId: `treadmill_${Date.now()}`,
          weightUsed: 0,
          completed: true,
          date: today,
          calories: data.calories,
          duration: data.duration
      });
      setShowCelebration(true);
  };

  const handleSaveSettings = (url: string) => {
    const updatedProfile = { ...profile, googleSheetUrl: url };
    onUpdateProfile(updatedProfile);
  };
  
  const handleRegenerateConfirm = async (updatedProfile: UserProfile) => {
      setIsRegenerating(true);
      try {
          await onRegeneratePlan(updatedProfile);
          setIsRegenerateOpen(false);
          setView('workout');
      } catch (e) {
          console.error(e);
      } finally {
          setIsRegenerating(false);
      }
  };

  const handleAddExtras = (exercises: Exercise[]) => {
      onAddExercises(selectedDayIndex, exercises);
  };

  const handleGenerateExtras = async (muscle: string, count: number) => {
      return await generateExtraExercises(muscle, count, profile);
  };

  // Stats Calculation
  const totalWorkouts = logs.filter(l => l.completed).length;
  const uniqueDaysWorkedOut = new Set(logs.filter(l => l.completed).map(l => l.date)).size;
  
  const cardioLogs = logs.filter(l => l.exerciseId.startsWith('treadmill_') && l.completed);
  const totalCardioCalories = cardioLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  
  const chartData = useMemo(() => {
      const dateMap = new Map<string, number>();
      logs.forEach(log => {
          if(log.completed) {
             dateMap.set(log.date, (dateMap.get(log.date) || 0) + 1);
          }
      });
      return Array.from(dateMap.entries())
        .sort((a,b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [logs]);

  const completedExercisesCount = currentDay.exercises.filter(e => 
      logs.some(l => l.exerciseId === e.id && l.date === today && l.completed)
  ).length;
  const progressPercentage = Math.round((completedExercisesCount / currentDay.exercises.length) * 100);

  // Full Screen Mode for Treadmill
  if (isTreadmillRunning) {
      return (
          <TreadmillCoach 
              profile={profile}
              onExit={() => setIsTreadmillRunning(false)}
              onComplete={handleTreadmillComplete}
          />
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20 md:pb-0">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentUrl={profile.googleSheetUrl}
        onSave={handleSaveSettings}
      />

      <RegenerateModal 
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        currentProfile={profile}
        onConfirm={handleRegenerateConfirm}
        isLoading={isRegenerating}
      />

      <AddExerciseModal 
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onAdd={handleAddExtras}
        onGenerate={handleGenerateExtras}
        language={lang}
      />

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowCelebration(false)}>
            <div className="bg-slate-800 border border-emerald-500/50 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full transform transition-all scale-100">
                <div className="inline-flex p-4 bg-emerald-500/20 rounded-full mb-4">
                    <PartyPopper className="w-12 h-12 text-emerald-400 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('congrats', lang)}</h2>
                <p className="text-slate-400 mb-6">{t('congrats_msg', lang)}</p>
                <button 
                    onClick={() => setShowCelebration(false)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl transition-colors"
                >
                    {t('close', lang)}
                </button>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
             <h1 className="text-xl font-bold text-white">{t('hello', lang)}, <span className="text-emerald-400">{profile.name}</span></h1>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-400">{profile.goal}</p>
                {isSyncing ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> {t('saving', lang)}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 px-2 py-0.5">
                        <Check className="w-3 h-3" /> {t('saved', lang)}
                    </span>
                )}
             </div>
          </div>
          <div className="flex items-center gap-2">
             {installPrompt && (
                <button 
                    onClick={onInstall}
                    className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/30 animate-pulse"
                    title={lang === 'pt' ? "Instalar App" : "Install App"}
                >
                    <Download className="w-5 h-5" />
                </button>
             )}
             <button 
                onClick={() => setIsRegenerateOpen(true)}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Novo Ciclo de Treino"
             >
                <RefreshCw className="w-5 h-5" />
             </button>
             <button onClick={onReset} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title="Sair">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 relative">
        
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg inline-flex w-full md:w-auto">
            <button 
                onClick={() => setView('workout')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'workout' ? 'bg-emerald-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
            >
                {t('workout_day', lang)}
            </button>
            <button 
                onClick={() => setView('cardio')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'cardio' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                {t('cardio_day', lang)}
            </button>
            <button 
                onClick={() => setView('progress')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'progress' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                {t('progress', lang)}
            </button>
        </div>

        {view === 'cardio' && (
            <div className="animate-fadeIn">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="p-4 bg-orange-500 rounded-full shadow-lg shadow-orange-500/20">
                            <Activity className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white mb-2">{t('treadmill_mode', lang)}</h2>
                            <p className="text-slate-400 text-sm mb-4 max-w-md">
                                {lang === 'pt' 
                                 ? 'Um treinador de corrida guiado por voz. Escolha seu objetivo e deixe a IA controlar seus intervalos.' 
                                 : 'A voice-guided running coach. Pick your goal and let AI handle your intervals.'}
                            </p>
                            <div className="flex gap-4 justify-center md:justify-start">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white">{cardioLogs.length}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sessões</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white">{Math.round(totalCardioCalories)}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Kcal Totais</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsTreadmillRunning(true)}
                            className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                        >
                            <PlayCircle className="w-6 h-6" />
                            {lang === 'pt' ? 'Iniciar Sessão' : 'Start Session'}
                        </button>
                    </div>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {cardioLogs.slice(0, 4).map((log, idx) => (
                         <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                             <div>
                                 <p className="text-sm font-bold text-white">Treino de Esteira</p>
                                 <p className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-bold text-orange-400">{log.calories?.toFixed(0)} kcal</p>
                                 <p className="text-xs text-slate-400">{log.duration ? (log.duration / 60).toFixed(0) : 0} min</p>
                             </div>
                         </div>
                     ))}
                </div>
            </div>
        )}

        {view === 'workout' && (
            <div className="animate-fadeIn">
                {/* Info Logic Rolling Schedule */}
                <div className="mb-4 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                    <p className="text-sm text-indigo-200">
                        {selectedDayIndex === suggestedDayIndex ? (
                            <>
                                {t('suggestion', lang)} <strong className="text-indigo-400 ml-1">{plan.days[suggestedDayIndex].dayName}</strong>
                            </>
                        ) : (
                            <>{t('viewing_other', lang)}</>
                        )}
                    </p>
                </div>

                {/* Day Selector */}
                <div className="flex overflow-x-auto pb-4 gap-3 mb-4 no-scrollbar">
                    {plan.days.map((day, idx) => {
                        const isSuggested = idx === suggestedDayIndex;
                        const isSelected = selectedDayIndex === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDayIndex(idx)}
                                className={`relative flex-shrink-0 px-5 py-3 rounded-xl border text-left min-w-[150px] transition-all ${
                                    isSelected 
                                    ? 'bg-emerald-500 border-emerald-400 ring-2 ring-emerald-500/20' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                {isSuggested && (
                                    <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        isSelected ? 'bg-white text-emerald-600 border-emerald-200' : 'bg-indigo-500 text-white border-indigo-400'
                                    }`}>
                                        SUGESTÃO
                                    </span>
                                )}
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-emerald-900' : 'text-slate-500'}`}>
                                    {day.dayName}
                                </p>
                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-slate-900' : 'text-slate-300'}`}>
                                    {day.focus}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Day Header & Progress */}
                <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-emerald-500" />
                                {currentDay.focus}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {currentDay.exercises.length} exercícios • {completedExercisesCount}/{currentDay.exercises.length} feitos
                            </p>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {currentDay.exercises.map((exercise) => {
                        const log = logs.find(l => l.exerciseId === exercise.id && l.date === today);
                        return (
                            <ExerciseCard 
                                key={exercise.id} 
                                exercise={exercise} 
                                log={log} 
                                onLogUpdate={(w, c) => handleLogUpdate(exercise.id, w, c)}
                                onSwap={() => onSwapExercise(selectedDayIndex, exercise.id)}
                                onEdit={(updatedData) => onEditExercise(selectedDayIndex, exercise.id, updatedData)}
                                language={lang}
                            />
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="pb-24 space-y-4">
                    <button 
                        onClick={() => setIsAddExerciseOpen(true)}
                        className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 font-medium hover:border-emerald-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t('add_exercise', lang)}
                    </button>

                    <div className="flex justify-center">
                        <button 
                            onClick={handleFinishWorkout}
                            disabled={completedExercisesCount === currentDay.exercises.length}
                            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
                                completedExercisesCount === currentDay.exercises.length
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:shadow-emerald-500/20'
                            }`}
                        >
                            <CheckCheck className="w-6 h-6" />
                            {completedExercisesCount === currentDay.exercises.length 
                                ? t('finished', lang) 
                                : t('finish_workout', lang)}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {view === 'progress' && (
            <div className="animate-fadeIn space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-lg">
                                <Trophy className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">{t('exercises_done', lang)}</p>
                                <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-lg">
                                <Flame className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">{t('active_days', lang)}</p>
                                <p className="text-2xl font-bold text-white">{uniqueDaysWorkedOut}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Activity className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Cardio Kcal</p>
                                <p className="text-2xl font-bold text-white">{Math.round(totalCardioCalories)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-6">{t('freq_chart', lang)}</h3>
                    <div className="h-64 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#10b981" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                ...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {/* Floating Rest Timer */}
        <RestTimer />
      </main>
    </div>
  );
};