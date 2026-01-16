
export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface GroundingLink {
  title: string;
  uri: string;
}
