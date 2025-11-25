import React, { useState } from 'react';
import { UserProfile, Goal, ExperienceLevel, WorkoutLocation, t } from '../types';
import { X, RefreshCw, Target, Dumbbell, Check, Building2, Home } from 'lucide-react';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onConfirm: (updatedProfile: UserProfile) => void;
  isLoading: boolean;
}

const MUSCLE_GROUPS = [
  'Peito/Chest', 'Costas/Back', 'Ombros/Shoulders', 
  'Pernas/Legs', 'Glúteos/Glutes', 'Bíceps', 'Tríceps', 
  'Abdômen/Abs', 'Panturrilha/Calves'
];

export const RegenerateModal: React.FC<RegenerateModalProps> = ({ isOpen, onClose, currentProfile, onConfirm, isLoading }) => {
  const [formData, setFormData] = useState<UserProfile>(currentProfile);

  if (!isOpen) return null;

  const lang = formData.language || 'pt';

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (muscle: string) => {
    setFormData(prev => {
      const current = prev.focusAreas || [];
      if (current.includes(muscle)) {
        return { ...prev, focusAreas: current.filter(m => m !== muscle) };
      } else {
        return { ...prev, focusAreas: [...current, muscle] };
      }
    });
  };

  const handleSubmit = () => {
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-emerald-500" />
                {lang === 'en' ? 'New Workout Cycle' : 'Novo Ciclo de Treinos'}
             </h2>
             <p className="text-sm text-slate-400 mt-1">
               {lang === 'en' ? 'Update your data to generate a new routine.' : 'Atualize seus dados para gerar uma nova rotina.'}
             </p>
          </div>
          {!isLoading && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-6 h-6" />
            </button>
          )}
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <RefreshCw className="w-16 h-16 text-emerald-500 animate-spin" />
                    <h3 className="text-xl font-bold text-white">{lang === 'en' ? 'Creating new routine...' : 'Criando sua nova rotina...'}</h3>
                    <p className="text-slate-400 text-center max-w-md">
                        {lang === 'en' 
                         ? 'AI is analyzing your new parameters while keeping your history. This may take a few seconds.' 
                         : 'A IA está analisando seus novos parâmetros e mantendo seu histórico salvo. Isso pode levar alguns segundos.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Location Selector */}
                    <div>
                        <label className="block text-sm font-medium text-emerald-400 mb-2">{t('location', lang)}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleChange('workoutLocation', 'Gym')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    formData.workoutLocation === 'Gym' 
                                    ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                                    : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                <Building2 className="w-6 h-6" />
                                <span className="text-xs font-bold text-center">{t('gym', lang)}</span>
                            </button>
                            <button
                                onClick={() => handleChange('workoutLocation', 'Home')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    formData.workoutLocation === 'Home' 
                                    ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                                    : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                <Home className="w-6 h-6" />
                                <span className="text-xs font-bold text-center">{t('home', lang)}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Peso Atual */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                {lang === 'en' ? 'Current Weight (kg)' : 'Peso Atual (kg)'}
                            </label>
                            <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                value={formData.weight}
                                onChange={e => handleChange('weight', Number(e.target.value))}
                            />
                        </div>

                        {/* Dias por Semana */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                {lang === 'en' ? 'Days per week' : 'Dias por Semana'}: {formData.daysPerWeek}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="7"
                                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-3"
                                value={formData.daysPerWeek}
                                onChange={e => handleChange('daysPerWeek', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Objetivo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            {lang === 'en' ? 'Main Goal' : 'Objetivo Principal'}
                        </label>
                        <select
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            value={formData.goal}
                            onChange={e => handleChange('goal', e.target.value as Goal)}
                        >
                            {Object.values(Goal).map(g => (
                            <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nível */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            {lang === 'en' ? 'Experience Level' : 'Nível de Experiência'}
                        </label>
                        <select
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            value={formData.experienceLevel}
                            onChange={e => handleChange('experienceLevel', e.target.value as ExperienceLevel)}
                        >
                            {Object.values(ExperienceLevel).map(l => (
                            <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Focus Areas */}
                    <div className="pt-4 border-t border-slate-700">
                        <label className="block text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            {lang === 'en' ? 'Muscle Priority (New Cycle)' : 'Prioridade Muscular (Novo Ciclo)'}
                        </label>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {MUSCLE_GROUPS.map(muscle => {
                                const isSelected = formData.focusAreas?.includes(muscle);
                                return (
                                <button
                                    key={muscle}
                                    onClick={() => toggleFocusArea(muscle)}
                                    className={`text-xs py-2 px-2 rounded-lg border transition-all flex items-center justify-between ${
                                    isSelected 
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    {muscle}
                                    {isSelected && <Check className="w-3 h-3" />}
                                </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                        <Dumbbell className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                        <div className="text-sm text-blue-200">
                            <span className="font-bold block mb-1">
                                {lang === 'en' ? 'History Note' : 'Nota sobre o Histórico'}
                            </span>
                            {lang === 'en' 
                             ? 'Your workout history (active days and completions) will be kept. Only exercises and structure will be renewed.'
                             : 'Seu histórico de dias treinados e conclusões será mantido. Apenas os exercícios e a estrutura do treino serão renovados.'}
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
            <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-slate-700 transition-colors"
                >
                    {lang === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <RefreshCw className="w-5 h-5" />
                    {lang === 'en' ? 'Generate New Plan' : 'Gerar Nova Ficha'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};