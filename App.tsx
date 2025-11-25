import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutPlan, ExerciseLog, AppState, Exercise, Language } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { generateWorkoutPlan, generateReplacementExercise } from './services/geminiService';
import { saveUserData } from './services/sheetService';
import { Loader2 } from 'lucide-react';

const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbyABJNe8WpaxTkcUfq18H5Z_JIELjdtsWZBhNQTO_uN-H2TGNuUShCDXbV7o4pr5ngopQ/exec";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'auth',
    auth: {
        username: '',
        isAuthenticated: false,
        dbUrl: HARDCODED_URL
    },
    profile: null,
    plan: null,
    logs: [],
    language: 'pt'
  });

  const [isSyncing, setIsSyncing] = useState(false);
  
  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Auto-Login Effect
  useEffect(() => {
      const storedUrl = localStorage.getItem('fitia_db_url');
      const storedUser = localStorage.getItem('fitia_username');
      const storedData = localStorage.getItem('fitia_data');
      
      if (storedUser && storedData) {
          try {
              const parsedData = JSON.parse(storedData);
              setState(prev => ({
                  ...prev,
                  step: parsedData.profile ? 'dashboard' : 'onboarding',
                  auth: {
                      username: storedUser,
                      isAuthenticated: true,
                      dbUrl: storedUrl || HARDCODED_URL
                  },
                  profile: parsedData.profile || null,
                  plan: parsedData.plan || null,
                  logs: parsedData.logs || [],
                  language: parsedData.profile?.language || 'pt'
              }));
          } catch (e) {
              console.error("Error parsing stored data", e);
          }
      }

      // Listen for PWA install event
      window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          setInstallPrompt(e);
      });
  }, []);

  // Persistence Helper
  const persistState = (newState: AppState) => {
      if (newState.auth.isAuthenticated && newState.auth.username) {
          const dataToSave = {
              profile: newState.profile,
              plan: newState.plan,
              logs: newState.logs
          };
          localStorage.setItem('fitia_username', newState.auth.username);
          localStorage.setItem('fitia_data', JSON.stringify(dataToSave));
          if (newState.auth.dbUrl) {
              localStorage.setItem('fitia_db_url', newState.auth.dbUrl);
          }
      }
  };

  const handleLoginSuccess = (username: string, url: string, data?: { profile: UserProfile, plan: WorkoutPlan, logs: ExerciseLog[] }) => {
      const newState: AppState = {
          ...state,
          step: data?.profile ? 'dashboard' : 'onboarding',
          auth: {
              username,
              isAuthenticated: true,
              dbUrl: url
          },
          profile: data?.profile || null,
          plan: data?.plan || null,
          logs: data?.logs || [],
          language: data?.profile?.language || state.language
      };
      setState(newState);
      persistState(newState);
  };

  const handleOnboardingSubmit = async (profile: UserProfile) => {
      setState(prev => ({ ...prev, step: 'loading' }));
      try {
          const plan = await generateWorkoutPlan(profile);
          const newState: AppState = {
              ...state,
              step: 'dashboard',
              profile,
              plan,
              logs: state.logs,
              language: profile.language
          };
          setState(newState);
          persistState(newState);
          
          // Sync to Sheet
          syncData(newState);
      } catch (error) {
          console.error(error);
          alert("Erro ao gerar plano. Tente novamente.");
          setState(prev => ({ ...prev, step: 'onboarding' }));
      }
  };

  const syncData = async (currentState: AppState) => {
      if (!currentState.auth.dbUrl || !currentState.auth.username || !currentState.profile || !currentState.plan) return;
      
      setIsSyncing(true);
      try {
          await saveUserData(
              currentState.auth.dbUrl, 
              currentState.auth.username, 
              null, 
              {
                  profile: currentState.profile,
                  plan: currentState.plan,
                  logs: currentState.logs
              }
          );
      } catch (e) {
          console.error("Sync error", e);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleUpdateLog = (log: ExerciseLog) => {
      setState(prev => {
          // Remove existing log for same exercise and date if exists (update)
          const filteredLogs = prev.logs.filter(l => !(l.exerciseId === log.exerciseId && l.date === log.date));
          const newLogs = [...filteredLogs, log];
          
          const newState = { ...prev, logs: newLogs };
          persistState(newState);
          syncData(newState);
          return newState;
      });
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
      setState(prev => {
          const newState = { ...prev, profile: newProfile, language: newProfile.language };
          persistState(newState);
          syncData(newState);
          return newState;
      });
  };

  const handleRegeneratePlan = async (updatedProfile: UserProfile) => {
       try {
           const newPlan = await generateWorkoutPlan(updatedProfile);
           setState(prev => {
               const newState = { 
                   ...prev, 
                   profile: updatedProfile, 
                   plan: newPlan,
                   language: updatedProfile.language
               };
               persistState(newState);
               syncData(newState);
               return newState;
           });
       } catch (error) {
           console.error("Regeneration failed", error);
           throw error;
       }
  };

  const handleSwapExercise = async (dayIndex: number, exerciseId: string) => {
      if (!state.plan || !state.profile) return;
      
      const day = state.plan.days[dayIndex];
      const exerciseToSwap = day.exercises.find(e => e.id === exerciseId);
      
      if (!exerciseToSwap) return;

      try {
          const newExercise = await generateReplacementExercise(
              exerciseToSwap.name, 
              exerciseToSwap.muscleGroup, 
              state.profile
          );
          
          setState(prev => {
              if (!prev.plan) return prev;
              
              const newDays = [...prev.plan.days];
              // Assign a new ID to ensure unicity if needed, though usually Gemini provides one
              const uniqueId = `swap_${Date.now()}`;
              const newExercises = newDays[dayIndex].exercises.map(e => 
                  e.id === exerciseId ? { ...newExercise, id: uniqueId } : e
              );
              newDays[dayIndex].exercises = newExercises;
              
              const newState = { ...prev, plan: { ...prev.plan, days: newDays } };
              persistState(newState);
              syncData(newState);
              return newState;
          });
      } catch (e) {
          console.error(e);
          alert("Falha ao trocar exercício");
      }
  };

  const handleEditExercise = (dayIndex: number, exerciseId: string, updatedData: Partial<Exercise>) => {
      setState(prev => {
          if (!prev.plan) return prev;
          
          const newDays = [...prev.plan.days];
          const newExercises = newDays[dayIndex].exercises.map(e => 
              e.id === exerciseId ? { ...e, ...updatedData } : e
          );
          newDays[dayIndex].exercises = newExercises;
          
          const newState = { ...prev, plan: { ...prev.plan, days: newDays } };
          persistState(newState);
          syncData(newState);
          return newState;
      });
  };

  const handleAddExercises = (dayIndex: number, exercises: Exercise[]) => {
      setState(prev => {
          if (!prev.plan) return prev;
          
          const newDays = [...prev.plan.days];
          newDays[dayIndex].exercises = [...newDays[dayIndex].exercises, ...exercises];
          
          const newState = { ...prev, plan: { ...prev.plan, days: newDays } };
          persistState(newState);
          syncData(newState);
          return newState;
      });
  };

  const handleReset = () => {
      localStorage.removeItem('fitia_username');
      localStorage.removeItem('fitia_data');
      localStorage.removeItem('fitia_session_key');
      setState({
          step: 'auth',
          auth: { username: '', isAuthenticated: false, dbUrl: state.auth.dbUrl },
          profile: null,
          plan: null,
          logs: [],
          language: 'pt'
      });
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
        setInstallPrompt(null);
    }
  };

  // Render Logic
  if (state.step === 'loading') {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-white font-bold">
                  {state.language === 'pt' ? 'Criando seu plano personalizado...' : 'Creating your custom plan...'}
              </p>
          </div>
      );
  }

  if (state.step === 'auth' || !state.auth.isAuthenticated) {
      return (
          <AuthScreen 
              onLoginSuccess={handleLoginSuccess}
              onRegisterSuccess={(user, url) => handleLoginSuccess(user, url)}
              currentLanguage={state.language}
              onLanguageChange={(l) => setState(prev => ({ ...prev, language: l }))}
          />
      );
  }

  if (state.step === 'onboarding') {
      return <Onboarding onSubmit={handleOnboardingSubmit} language={state.language} />;
  }

  if (state.step === 'dashboard' && state.profile && state.plan) {
      return (
          <Dashboard 
              profile={state.profile}
              plan={state.plan}
              logs={state.logs}
              onUpdateLog={handleUpdateLog}
              onUpdateProfile={handleUpdateProfile}
              onSwapExercise={handleSwapExercise}
              onEditExercise={handleEditExercise}
              onAddExercises={handleAddExercises}
              onRegeneratePlan={handleRegeneratePlan}
              onReset={handleReset}
              isSyncing={isSyncing}
              installPrompt={installPrompt}
              onInstall={handleInstallApp}
          />
      );
  }

  return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Erro de Estado</div>;
};

export default App;