import React, { useState } from 'react';
import { Dumbbell, Lock, User, ChevronRight, Loader2, Eye, EyeOff, AlertCircle, Globe } from 'lucide-react';
import { authenticateUser, registerUser } from '../services/sheetService';
import { UserProfile, WorkoutPlan, ExerciseLog, Language, t } from '../types';

const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbyABJNe8WpaxTkcUfq18H5Z_JIELjdtsWZBhNQTO_uN-H2TGNuUShCDXbV7o4pr5ngopQ/exec";

interface AuthScreenProps {
  onLoginSuccess: (username: string, url: string, data?: { profile: UserProfile, plan: WorkoutPlan, logs: ExerciseLog[] }) => void;
  onRegisterSuccess: (username: string, url: string) => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onRegisterSuccess, currentLanguage, onLanguageChange }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dbUrl] = useState(HARDCODED_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAction = async () => {
    setErrorMessage(null);
    
    if (!username || !password) {
      setErrorMessage(t('fill_fields', currentLanguage));
      return;
    }

    setIsLoading(true);
    
    localStorage.setItem('fitia_db_url', dbUrl);

    try {
      if (mode === 'login') {
        const response = await authenticateUser(dbUrl, username, password);
        if (response.success) {
            onLoginSuccess(username, dbUrl, response.data);
        } else {
            setErrorMessage(response.message || t('login_fail', currentLanguage));
        }
      } else {
        const response = await registerUser(dbUrl, username, password);
        if (response.success) {
            onRegisterSuccess(username, dbUrl);
        } else {
            setErrorMessage(response.message || "Falha ao criar conta.");
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900 py-10">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 relative">
        
        {/* Language Toggle */}
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-700/50 p-1 rounded-lg">
            <button 
                onClick={() => onLanguageChange('pt')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${currentLanguage === 'pt' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
                PT
            </button>
            <button 
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${currentLanguage === 'en' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
                EN
            </button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8 mt-4">
          <div className="p-4 bg-emerald-500 rounded-full mb-4 shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white">Galera IA Fit</h1>
          <p className="text-slate-400 mt-2">{t('welcome_subtitle', currentLanguage)}</p>
        </div>

        {/* Error Message Area */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 animate-fadeIn">
             <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
             <p className="text-sm text-red-200 whitespace-pre-line">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{t('user', currentLanguage)}</label>
            <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder={currentLanguage === 'pt' ? "Seu nome de usuário" : "Your username"}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{t('pass', currentLanguage)}</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-10 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="*******"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
          </div>

          <button
            onClick={handleAction}
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    {mode === 'login' ? t('login', currentLanguage) : t('create_account', currentLanguage)}
                    <ChevronRight className="w-5 h-5" />
                </>
            )}
          </button>

          <div className="flex justify-center mt-6">
             <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMessage(null); }}
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors underline decoration-slate-700 hover:decoration-emerald-400 underline-offset-4"
             >
                {mode === 'login' 
                    ? t('no_account', currentLanguage) 
                    : t('has_account', currentLanguage)}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};