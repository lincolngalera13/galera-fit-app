import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, WorkoutPlan, Exercise, TreadmillWorkout } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const workoutSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Um resumo motivacional curto do plano de treino.",
    },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayName: { type: Type.STRING, description: "Nome do dia (ex: Treino A, Segunda)" },
          focus: { type: Type.STRING, description: "Foco muscular do dia (ex: Peito e Tríceps)" },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Um ID único curto para o exercício (ex: supino_reto)" },
                name: { type: Type.STRING, description: "Nome do exercício" },
                youtubeVideoId: { type: Type.STRING, description: "ID do vídeo do YouTube (11 caracteres). Deixe VAZIO." },
                sets: { type: Type.NUMBER, description: "Número de séries" },
                reps: { type: Type.STRING, description: "Número de repetições (ex: '12', '10-12', 'Até a falha')" },
                muscleGroup: { type: Type.STRING, description: "Grupo muscular alvo" },
                description: { type: Type.STRING, description: "Breve instrução de como executar" },
                restSeconds: { type: Type.NUMBER, description: "Tempo de descanso em segundos" },
              },
              required: ["id", "name", "sets", "reps", "muscleGroup", "description", "restSeconds"],
            },
          },
        },
        required: ["dayName", "focus", "exercises"],
      },
    },
  },
  required: ["days", "summary"],
};

const exerciseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "Um ID único curto para o exercício" },
    name: { type: Type.STRING, description: "Nome do exercício" },
    youtubeVideoId: { type: Type.STRING, description: "Deixe vazio" },
    sets: { type: Type.NUMBER, description: "Número de séries" },
    reps: { type: Type.STRING, description: "Número de repetições" },
    muscleGroup: { type: Type.STRING, description: "Grupo muscular alvo" },
    description: { type: Type.STRING, description: "Breve instrução de como executar" },
    restSeconds: { type: Type.NUMBER, description: "Tempo de descanso em segundos" },
  },
  required: ["id", "name", "sets", "reps", "muscleGroup", "description", "restSeconds"],
};

const treadmillSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        totalDuration: { type: Type.NUMBER },
        segments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    duration: { type: Type.NUMBER, description: "Duration in seconds" },
                    speed: { type: Type.NUMBER, description: "Speed in km/h" },
                    incline: { type: Type.NUMBER, description: "Incline percentage" },
                    instruction: { type: Type.STRING, description: "Comando de voz em PORTUGUÊS DO BRASIL. Use gírias de academia, seja energético. Ex: 'Bora acelerar!', 'Segura a onda agora'." },
                    phase: { type: Type.STRING, enum: ["Warmup", "Run", "Sprint", "Recovery", "Cooldown"] }
                },
                required: ["duration", "speed", "incline", "instruction", "phase"]
            }
        }
    },
    required: ["title", "totalDuration", "segments"]
}

export const generateWorkoutPlan = async (profile: UserProfile): Promise<WorkoutPlan> => {
  const focusString = profile.focusAreas && profile.focusAreas.length > 0 
    ? profile.focusAreas.join(", ") 
    : "Nenhum foco específico/No specific focus";

  const langInstruction = profile.language === 'en' ? "OUTPUT EVERYTHING IN ENGLISH." : "SAIDA OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL. NÃO USE INGLÊS.";
  
  const locationInstruction = profile.workoutLocation === 'Home' 
    ? "LOCAL: EM CASA (HOME). Use apenas exercícios com peso do corpo (calistenia) ou itens domésticos (cadeira, garrafa d'agua, mochila). NÃO sugira máquinas de academia."
    : "LOCAL: ACADEMIA (GYM). Use todos os equipamentos disponíveis (máquinas, halteres, barras).";

  const prompt = `
    ${langInstruction}
    Crie uma rotina de treino personalizada completa para a seguinte pessoa:
    Nome: ${profile.name}
    Gênero: ${profile.gender}
    Idade: ${profile.age}
    Altura: ${profile.height}cm
    Peso: ${profile.weight}kg
    Objetivo: ${profile.goal}
    Nível de Experiência: ${profile.experienceLevel}
    Dias disponíveis por semana: ${profile.daysPerWeek}
    Lesões/Limitações: ${profile.injuries || "Nenhuma"}
    
    ${locationInstruction}

    === ÁREAS DE FOCO PRIORITÁRIO ===
    O usuário deseja dar ÊNFASE MÁXIMA a estes grupos musculares: [${focusString}].
    INSTRUÇÃO: Aumente o volume (mais séries/exercícios) ou frequência para estes músculos específicos na divisão do treino.
    =================================

    A rotina deve ser dividida logicamente (ex: ABC, Upper/Lower, Full Body) e adaptar-se aos dias disponíveis.
    
    IMPORTANTE SOBRE VÍDEOS:
    - Deixe o campo 'youtubeVideoId' EM BRANCO.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workoutSchema,
        systemInstruction: "Você é um personal trainer brasileiro expert. Gere treinos tecnicamente perfeitos. Respeite rigorosamente o LOCAL de treino (Casa ou Academia) e o IDIOMA solicitado.",
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");

    return JSON.parse(textResponse) as WorkoutPlan;
  } catch (error) {
    console.error("Error generating workout plan:", error);
    throw error;
  }
};

export const generateReplacementExercise = async (currentExerciseName: string, muscleGroup: string, profile: UserProfile): Promise<Exercise> => {
  const langInstruction = profile.language === 'en' ? "OUTPUT IN ENGLISH." : "SAIDA EM PORTUGUÊS.";
  const locationInstruction = profile.workoutLocation === 'Home' 
    ? "LOCAL: EM CASA (HOME). Sugira apenas exercícios sem máquinas."
    : "LOCAL: ACADEMIA (GYM). Pode usar máquinas e pesos livres.";

  const prompt = `
    ${langInstruction}
    ${locationInstruction}
    
    O usuário deseja SUBSTITUIR o exercício "${currentExerciseName}" (Foco: ${muscleGroup}).
    
    Perfil do usuário:
    Objetivo: ${profile.goal}
    Nível: ${profile.experienceLevel}
    
    Gere UM (1) exercício alternativo que trabalhe o mesmo grupo muscular com intensidade similar, respeitando o local de treino.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: exerciseSchema,
        systemInstruction: "Você é um personal trainer ajudando a adaptar um treino.",
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");

    return JSON.parse(textResponse) as Exercise;
  } catch (error) {
    console.error("Error replacing exercise:", error);
    throw error;
  }
};

export const generateExtraExercises = async (muscleGroup: string, count: number, profile: UserProfile): Promise<Exercise[]> => {
    const langInstruction = profile.language === 'en' ? "OUTPUT IN ENGLISH." : "SAIDA EM PORTUGUÊS.";
    const locationInstruction = profile.workoutLocation === 'Home' 
      ? "LOCAL: EM CASA (HOME). Sugira apenas exercícios sem máquinas."
      : "LOCAL: ACADEMIA (GYM). Pode usar máquinas e pesos livres.";
  
    const prompt = `
      ${langInstruction}
      ${locationInstruction}
      
      Gere ${count} exercícios EXTRAS focados em: ${muscleGroup}.
      Perfil: ${profile.experienceLevel}, Objetivo: ${profile.goal}.
      
      Retorne uma lista JSON com os exercícios.
    `;
    
    // Schema wrapper for array
    const listSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            exercises: {
                type: Type.ARRAY,
                items: exerciseSchema
            }
        }
    };
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: listSchema,
          systemInstruction: "Você é um personal trainer adicionando volume ao treino.",
        },
      });
  
      const textResponse = response.text;
      if (!textResponse) throw new Error("No response from AI");
  
      const result = JSON.parse(textResponse);
      return result.exercises;
    } catch (error) {
      console.error("Error generating extra exercises:", error);
      throw error;
    }
};

export const generateTreadmillWorkout = async (type: string, duration: number, difficulty: string, profile: UserProfile): Promise<TreadmillWorkout> => {
    const langInstruction = profile.language === 'en' 
        ? "OUTPUT IN ENGLISH." 
        : "SAIDA OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL (PT-BR). PROIBIDO ESCREVER EM INGLÊS. Use termos como 'Corra', 'Ande', 'Tiro', 'Ladeira'.";
    
    const prompt = `
      ${langInstruction}
      Atue como um TREINADOR DE CORRIDA.
      Crie um treino guiado de esteira.
      
      Tipo: ${type}
      Duração Total: ${duration} minutos.
      Dificuldade: ${difficulty}.
      
      Retorne um JSON com os segmentos do treino. 
      
      IMPORTANTE SOBRE 'instruction':
      - Essa frase será LIDA pela voz do celular.
      - NÃO use formatação (bold, italic).
      - Use frases CURTAS, DIRETAS e MOTIVADORAS.
      - Fale em primeira pessoa: "Quero que você corra agora!", "Diminua para caminhar".
      - NUNCA use palavras em inglês (Run, Warmup, Cool down) no meio do texto em português.
      
      Estrutura:
      Velocidade (speed) em km/h (compatível com nível ${difficulty}).
      Inclinação (incline) em %.
      Duração (duration) em segundos.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: treadmillSchema,
          systemInstruction: "Você é um treinador de corrida brasileiro carismático e enérgico.",
        },
      });
  
      const textResponse = response.text;
      if (!textResponse) throw new Error("No response from AI");
  
      return JSON.parse(textResponse) as TreadmillWorkout;
    } catch (error) {
      console.error("Error generating treadmill workout:", error);
      throw error;
    }
  };