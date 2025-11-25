import React, { useState } from 'react';
import { UserProfile, Goal, ExperienceLevel, Language, WorkoutLocation, t } from '../types';
import { Dumbbell, ChevronRight, Ruler, Weight, Target, Check, Home, Building2 } from 'lucide-react';

interface OnboardingProps {
  onSubmit: (profile: UserProfile) => void;
  language: Language; // Language passed from App state
}

const MUSCLE_GROUPS = [
  'Peito/Chest', 'Costas/Back', 'Ombros/Shoulders', 
  'Pernas/Legs', 'Glúteos/Glutes', 'Bíceps', 'Tríceps', 
  'Abdômen/Abs', 'Panturrilha/Calves'
];

export const Onboarding: React.FC<OnboardingProps> = ({ onSubmit, language }) => {
  const [step, setStep] = useState(1);
  
  // Initialize full object
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: undefined,
    gender: 'Masculino',
    height: undefined,
    weight: undefined,
    goal: Goal.HYPERTROPHY,
    experienceLevel: ExperienceLevel.BEGINNER,
    daysPerWeek: 3,
    injuries: '',
    focusAreas: [],
    language: language, // Store language
    workoutLocation: 'Gym' // Default
  });

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

  const handleNext = () => {
    if (step === 1) {
       if (!formData.name || !formData.age || !formData.gender) {
         alert(language === 'pt' ? "Preencha nome, idade e gênero." : "Fill name, age and gender.");
         return;
       }
    }
    if (step === 2) {
       if (!formData.height || !formData.weight) {
          alert(language === 'pt' ? "Preencha altura e peso." : "Fill height and weight.");
          return;
       }
    }

    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    if (formData.name && formData.age && formData.height && formData.weight && formData.gender) {
      onSubmit(formData as UserProfile);
    } else {
      alert(language === 'pt' ? "Preencha campos obrigatórios." : "Fill required fields.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900 py-10">
      <div className="w-full max-w-lg bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex items-center justify-center mb-8">
          <div className="p-3 bg-emerald-500 rounded-full mr-3">
            <Dumbbell className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-400">Galera IA Fit</h1>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-2 w-1/3 mx-1 rounded-full transition-all duration-300 ${step >= i ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-white mb-4">{t('basics', language)}</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('name', language)}</label>
              <input
                type="text"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Name"
                value={formData.name || ''}
                onChange={e => handleChange('name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">{t('age', language)}</label>
                <input
                  type="number"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="00"
                  value={formData.age || ''}
                  onChange={e => handleChange('age', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">{t('gender', language)}</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer"
                    value={formData.gender || 'Masculino'}
                    onChange={e => handleChange('gender', e.target.value)}
                  >
                    <option value="Masculino">Masculino/Male</option>
                    <option value="Feminino">Feminino/Female</option>
                    <option value="Outro">Outro/Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
             <h2 className="text-xl font-semibold text-white mb-4">{t('measurements', language)}</h2>
             
             <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-400 mb-1">{t('height', language)}</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="175"
                    value={formData.height || ''}
                    onChange={e => handleChange('height', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-slate-400 mb-1">{t('weight', language)}</label>
                <div className="relative">
                  <Weight className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="70"
                    value={formData.weight || ''}
                    onChange={e => handleChange('weight', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1">{t('injuries', language)}</label>
                 <textarea
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none h-24 resize-none"
                    placeholder={t('injuries_ph', language)}
                    value={formData.injuries || ''}
                    onChange={e => handleChange('injuries', e.target.value)}
                 />
              </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-white mb-4">{t('personalization', language)}</h2>

            <div>
                <label className="block text-sm font-medium text-emerald-400 mb-2">{t('location', language)}</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={() => handleChange('workoutLocation', 'Gym')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            formData.workoutLocation === 'Gym' 
                            ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                            : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        <Building2 className="w-6 h-6" />
                        <span className="text-xs font-bold text-center">{t('gym', language)}</span>
                    </button>
                    <button
                        onClick={() => handleChange('workoutLocation', 'Home')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            formData.workoutLocation === 'Home' 
                            ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                            : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        <Home className="w-6 h-6" />
                        <span className="text-xs font-bold text-center">{t('home', language)}</span>
                    </button>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('goal', language)}</label>
              <select
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                value={formData.goal}
                onChange={e => handleChange('goal', e.target.value as Goal)}
              >
                {Object.values(Goal).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('exp_level', language)}</label>
              <select
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                value={formData.experienceLevel}
                onChange={e => handleChange('experienceLevel', e.target.value as ExperienceLevel)}
              >
                {Object.values(ExperienceLevel).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('days_week', language)}: {formData.daysPerWeek}</label>
              <input
                type="range"
                min="1"
                max="7"
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                value={formData.daysPerWeek}
                onChange={e => handleChange('daysPerWeek', Number(e.target.value))}
              />
            </div>

            <div className="pt-4 border-t border-slate-700 mt-4">
               <label className="block text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('focus_area', language)}
               </label>
               <p className="text-xs text-slate-400 mb-3">
                 {t('focus_desc', language)}
               </p>
               
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
                            : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {muscle}
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
               </div>
            </div>

          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            className="flex items-center bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg shadow-emerald-500/20"
          >
            {step === 3 ? t('generate', language) : t('next', language)}
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};