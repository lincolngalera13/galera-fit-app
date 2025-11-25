import React, { useState } from 'react';
import { Exercise, Language, t } from '../types';
import { X, Plus, Sparkles, Dumbbell } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
  onGenerate: (muscle: string, count: number) => Promise<Exercise[]>;
  language: Language;
}

const MUSCLE_GROUPS = [
    'Peito/Chest', 'Costas/Back', 'Ombros/Shoulders', 
    'Pernas/Legs', 'Glúteos/Glutes', 'Bíceps', 'Tríceps', 
    'Abdômen/Abs', 'Panturrilha/Calves'
];

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onClose, onAdd, onGenerate, language }) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);

  // Manual Form
  const [manualForm, setManualForm] = useState({
      name: '',
      sets: 3,
      reps: '12',
      muscleGroup: MUSCLE_GROUPS[0],
      description: ''
  });

  // AI Form
  const [aiForm, setAiForm] = useState({
      muscleGroup: MUSCLE_GROUPS[0],
      count: 1
  });

  if (!isOpen) return null;

  const handleManualAdd = () => {
      if (!manualForm.name) return;
      
      const newExercise: Exercise = {
          id: `manual_${Date.now()}`,
          name: manualForm.name,
          sets: manualForm.sets,
          reps: manualForm.reps,
          muscleGroup: manualForm.muscleGroup,
          description: manualForm.description || (language === 'pt' ? 'Adicionado manualmente' : 'Manually added'),
          restSeconds: 60,
          youtubeVideoId: ''
      };
      
      onAdd([newExercise]);
      onClose();
  };

  const handleAiGenerate = async () => {
      setLoading(true);
      try {
          const exercises = await onGenerate(aiForm.muscleGroup, aiForm.count);
          onAdd(exercises);
          onClose();
      } catch (e) {
          console.error(e);
          alert('Erro ao gerar exercícios');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            {t('add_modal_title', language)}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-slate-900/50">
            <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'manual' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Dumbbell className="w-4 h-4" />
                {t('manual', language)}
            </button>
            <button 
                onClick={() => setMode('ai')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Sparkles className="w-4 h-4" />
                {t('ai_suggest', language)}
            </button>
        </div>

        <div className="p-6">
            {mode === 'manual' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{t('exercise_name', language)}</label>
                        <input 
                            value={manualForm.name}
                            onChange={e => setManualForm({...manualForm, name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-1">{t('sets', language)}</label>
                             <input type="number" value={manualForm.sets} onChange={e => setManualForm({...manualForm, sets: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-1">{t('reps', language)}</label>
                             <input type="text" value={manualForm.reps} onChange={e => setManualForm({...manualForm, reps: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{t('muscle', language)}</label>
                        <select 
                            value={manualForm.muscleGroup}
                            onChange={e => setManualForm({...manualForm, muscleGroup: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        >
                            {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{t('desc_optional', language)}</label>
                        <textarea 
                            value={manualForm.description}
                            onChange={e => setManualForm({...manualForm, description: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white h-20"
                        />
                    </div>
                    <button onClick={handleManualAdd} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 rounded-lg">
                        {t('confirm', language)}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">{t('muscle_target', language)}</label>
                        <select 
                            value={aiForm.muscleGroup}
                            onChange={e => setAiForm({...aiForm, muscleGroup: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white"
                        >
                            {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">{t('quantity', language)}: {aiForm.count}</label>
                        <input 
                            type="range" min="1" max="4" 
                            value={aiForm.count} 
                            onChange={e => setAiForm({...aiForm, count: Number(e.target.value)})}
                            className="w-full accent-indigo-500"
                        />
                         <div className="flex justify-between text-xs text-slate-500 px-1">
                            <span>1</span><span>2</span><span>3</span><span>4</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleAiGenerate} 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Gerando...' : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {t('generate_extras', language)}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};