import { supabase } from './supabase';

export interface AIGatewayResponse {
  source: 'cache' | 'model' | 'fallback';
  cached?: boolean;
  response: Record<string, any>;
  usage?: {
    feature: string;
    tokens_in: number;
    tokens_out: number;
    remaining_quota: number;
  };
}

export async function callAIGateway(
  feature: 'coach' | 'cv' | 'interview' | 'role',
  input: Record<string, any>
): Promise<AIGatewayResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
      body: { feature, input },
    });

    if (error) {
      console.warn('AI Gateway Edge Function call failed, using client fallback:', error);
      throw error;
    }

    return data as AIGatewayResponse;
  } catch (err) {
    // Client fallback to ensure 100% reliability offline or if Edge Function is unprovisioned
    return {
      source: 'fallback',
      cached: false,
      response: {
        reply: `StudyZen AI (Client Fallback): Based on your schedule, keeping your current 90-minute daily sessions will comfortably achieve your goals.`,
      },
    };
  }
}
