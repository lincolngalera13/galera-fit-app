import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseLog, Language, t } from '../types';
import { CheckCircle, Circle, Info, X, Youtube, RefreshCw, Loader2, AlertTriangle, Pencil, Save } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  log: ExerciseLog | undefined;
  onLogUpdate: (weight: number, completed: boolean) => void;
  onSwap: () => Promise<void>;
  onEdit: (updatedData: Partial<Exercise>) => void;
  language: Language;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, log, onLogUpdate, onSwap, onEdit, language }) => {
  const [weight, setWeight] = useState<string>(log?.weightUsed?.toString() || '');
  const [completed, setCompleted] = useState<boolean>(log?.completed || false);
  const [showInfo, setShowInfo] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds
  });

  // Sync with props
  useEffect(() => {
    setWeight(log?.weightUsed?.toString() || '');
    setCompleted(log?.completed || false);
  }, [log]);

  // Sync edit form when exercise changes externally
  useEffect(() => {
      setEditForm({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds
      });
  }, [exercise]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value);
    if (e.target.value && completed) {
        onLogUpdate(parseFloat(e.target.value), completed);
    }
  };

  const toggleComplete = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    
    // Haptic feedback
    if (newCompleted && navigator.vibrate) {
        navigator.vibrate(50);
    }

    const weightNum = parseFloat(weight) || 0;
    onLogUpdate(weightNum, newCompleted);
  };

  const handleSwapConfirm = async () => {
    setShowSwapConfirm(false);
    setIsSwapping(true);
    await onSwap();
    setIsSwapping(false);
    setShowInfo(false); // Close info after swap
  };

  const handleSaveEdit = () => {
      onEdit({
          name: editForm.name,
          sets: Number(editForm.sets),
          reps: editForm.reps,
          restSeconds: Number(editForm.restSeconds)
      });
      setIsEditing(false);
  };

  const handleCancelEdit = () => {
      setEditForm({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds
    });
    setIsEditing(false);
  };

  // YouTube Search URL
  const searchQuery = `${exercise.name} execution`;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  
  // REMOVED: overflow-hidden from the main div. This often causes click target misalignment when
  // content expands within a relative container that has CSS transitions.
  // The overlay needs a rounded clip, so we add overflow-hidden specifically to the overlay wrapper if needed,
  // or just rely on z-index.
  return (
    <div className={`relative rounded-xl border transition-all duration-300 ${completed ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700'}`}>
      
      {/* Loading Overlay - Fixed positioning relative to card but constrained by border-radius via a wrapper if needed, 
          but usually rounded-xl on this div handles visual clipping. */}
      {isSwapping && (
        <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm animate-fadeIn rounded-xl">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
          <p className="text-sm text-emerald-400 font-medium">{t('creating', language)}</p>
        </div>
      )}

      {/* Confirmation Overlay */}
      {showSwapConfirm && (
        <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center p-4 text-center animate-fadeIn rounded-xl">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-xl w-full max-w-[90%]">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-amber-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <h4 className="text-white font-bold mb-1">{t('confirm_swap', language)}</h4>
            <p className="text-xs text-slate-400 mb-4">
              {t('swap_msg', language)} <strong>{exercise.name}</strong>.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSwapConfirm(false)}
                className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                {t('cancel', language)}
              </button>
              <button 
                onClick={handleSwapConfirm}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {t('confirm', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-4">
            {/* Header: Exercise Name and Stats */}
            <h3 className={`text-lg font-bold ${completed ? 'text-emerald-400' : 'text-white'}`}>
              {exercise.name}
            </h3>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-slate-700 text-xs text-slate-300">{exercise.sets} {t('sets', language)}</span>
              <span className="px-2 py-0.5 rounded bg-slate-700 text-xs text-slate-300">{exercise.reps} {t('reps', language)}</span>
            </div>
          </div>
          <button onClick={toggleComplete} className="focus:outline-none transition-transform active:scale-95 shrink-0">
            {completed ? (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            ) : (
              <Circle className="w-8 h-8 text-slate-600 hover:text-slate-400" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">{t('load', language)}</label>
            <input
              type="number"
              value={weight}
              onChange={handleWeightChange}
              placeholder="0"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm font-mono"
            />
          </div>
          
          <div className="flex gap-2 mt-auto pt-5">
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${showInfo ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
             >
                {showInfo ? (
                   <>
                    <span className="text-xs font-bold">{t('close', language)}</span>
                    <X className="w-5 h-5" />
                   </>
                ) : (
                   <>
                    <span className="text-xs font-bold hidden sm:inline">{t('details', language)}</span>
                    <Info className="w-5 h-5" />
                   </>
                )}
             </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Info Section */}
      {showInfo && (
        <div className="bg-slate-900/50 p-4 border-t border-slate-700 animate-fadeIn space-y-4 rounded-b-xl">
            
            {isEditing ? (
                /* Edit Mode Form */
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 space-y-3">
                    <h4 className="text-sm font-bold text-emerald-400 mb-2">Editar</h4>
                    
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome</label>
                        <input 
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Séries</label>
                            <input 
                                type="number" 
                                value={editForm.sets}
                                onChange={(e) => setEditForm({...editForm, sets: Number(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Reps</label>
                            <input 
                                type="text" 
                                value={editForm.reps}
                                onChange={(e) => setEditForm({...editForm, reps: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                            />
                        </div>
                         <div>
                            <label className="block text-xs text-slate-400 mb-1">Descanso</label>
                            <input 
                                type="number" 
                                value={editForm.restSeconds}
                                onChange={(e) => setEditForm({...editForm, restSeconds: Number(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={handleCancelEdit}
                            className="flex-1 py-1.5 bg-slate-700 text-slate-300 text-xs font-bold rounded hover:bg-slate-600"
                        >
                            {t('cancel', language)}
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="flex-1 py-1.5 bg-emerald-500 text-slate-900 text-xs font-bold rounded hover:bg-emerald-400 flex items-center justify-center gap-1"
                        >
                            <Save className="w-3 h-3" /> Salvar
                        </button>
                    </div>
                </div>
            ) : (
                /* Standard Details View */
                <>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                {t('execution', language)}
                            </h4>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 bg-slate-700 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                                title="Editar manualmente"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{exercise.description}</p>
                        <div className="mt-3 flex gap-3">
                            <div className="inline-block px-2 py-1 bg-slate-900 rounded text-xs text-slate-400 border border-slate-700">
                                {t('rest', language)}: {exercise.restSeconds}s
                            </div>
                            <div className="inline-block px-2 py-1 bg-slate-900 rounded text-xs text-slate-400 border border-slate-700">
                                {t('muscle', language)}: {exercise.muscleGroup}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <a 
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-600/50 rounded-lg transition-all group cursor-pointer"
                        >
                        <Youtube className="w-6 h-6 text-red-500 group-hover:text-red-400" />
                        <span className="text-xs font-bold text-red-200 text-center">{t('see_video', language)}</span>
                        </a>

                        <button 
                        onClick={() => setShowSwapConfirm(true)}
                        className="flex-1 flex flex-col items-center justify-center gap-2 p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-all group"
                        >
                        <RefreshCw className="w-6 h-6 text-amber-500 group-hover:text-amber-400" />
                        <span className="text-xs font-bold text-amber-200 text-center">{t('swap_exercise', language)}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      )}
    </div>
  );
};