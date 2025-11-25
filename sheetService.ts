import { UserProfile, WorkoutPlan, ExerciseLog } from "../types";

interface SheetResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Helper function to handle Google Apps Script requests
// GAS requires sending data as stringified text in body to avoid CORS preflight issues on POST
async function postToSheet(url: string, payload: any): Promise<SheetResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      // We use text/plain to prevent browser from sending OPTIONS preflight
      // Google Apps Script will parse the text body manually
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON from server:", text);
      
      // Detect HTML response (Common when permissions are wrong)
      if (text.trim().startsWith('<')) {
          return { 
              success: false, 
              message: "Erro de Permissão: O Google retornou uma página de login/erro em vez de dados. \n\nSOLUÇÃO: No seu Google Script, vá em 'Implantar' > 'Gerenciar Implantações' > 'Editar' e mude 'Quem pode acessar' para 'Qualquer pessoa' (Anyone)." 
          };
      }

      return { success: false, message: "Resposta inválida do servidor." };
    }
  } catch (error) {
    console.error("Connection error:", error);
    return { success: false, message: "Erro de conexão. Verifique se a URL está correta e se a permissão do script é 'Qualquer pessoa'." };
  }
}

export const authenticateUser = async (url: string, username: string, password: string): Promise<SheetResponse> => {
  const response = await postToSheet(url, {
    action: 'login',
    username,
    password
  });

  if(response.success) {
      // Store password in session storage for subsequent syncs during this session
      sessionStorage.setItem('fitia_session_key', password);
  }
  return response;
};

export const registerUser = async (url: string, username: string, password: string): Promise<SheetResponse> => {
  const response = await postToSheet(url, {
    action: 'register',
    username,
    password
  });
  
  if(response.success) {
    sessionStorage.setItem('fitia_session_key', password);
  }
  return response;
};

export const saveUserData = async (url: string, username: string, password: string | null, data: { profile: UserProfile, plan: WorkoutPlan, logs: ExerciseLog[] }): Promise<SheetResponse> => {
  const pass = password || sessionStorage.getItem('fitia_session_key');
  if(!pass) return { success: false, message: "Sessão expirada." };

  // Convert logs to minimal format to save space if needed, or send full
  return postToSheet(url, {
    action: 'save',
    username,
    password: pass,
    data: JSON.stringify(data) // Nested JSON string
  });
};

// Old sync function deprecated, redirected to saveUserData logic if needed or kept for backward compatibility
export const syncWithGoogleSheets = async (url: string, data: any): Promise<{success: boolean, message: string}> => {
    return { success: false, message: "Método antigo desativado. Use a tela de configuração de conta." };
};