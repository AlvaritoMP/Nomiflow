import { GoogleGenAI } from "@google/genai";
import { Ticket } from "../types";

export const analyzeTicketWithGemini = async (ticket: Ticket): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "Error: API Key no configurada. Por favor configure process.env.API_KEY.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Actúa como un experto senior en gestión de nóminas y recursos humanos.
      Analiza el siguiente ticket/incidencia reportada en el sistema de nóminas.
      
      Título: ${ticket.title}
      Tipo: ${ticket.type}
      Descripción: ${ticket.description}
      Prioridad reportada: ${ticket.priority}
      
      Por favor provee un análisis conciso en formato Markdown que incluya:
      1. **Resumen del Problema**: Una breve síntesis.
      2. **Impacto en Nómina**: ¿Afecta cálculo de impuestos, neto a pagar, o contabilidad?
      3. **Documentación Requerida Sugerida**: ¿Qué archivos usualmente se necesitan para este caso?
      4. **Acción Recomendada**: Pasos inmediatos para el analista de nóminas.
      
      Mantén el tono profesional y directo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error al conectar con el asistente de IA. Por favor intente nuevamente.";
  }
};
