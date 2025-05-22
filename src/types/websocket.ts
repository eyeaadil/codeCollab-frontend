/** Data structure for WebSocket messages */
export type WebSocketData = {
  type: string;
  roomId?: string;
  fileName?: string;
  content?: string;
  clientId?: string;
  email?: string;
  collaborators?: string[];
  invitedEmails?: string[];
};

/** Configuration options for WebSocket connection */
export interface WebSocketConfig {
  url: string;
  onMessage?: (data: WebSocketData) => void;
  onStatusChange?: (status: string) => void;
}

export interface WebSocketMessage {
  type: string;
  roomId?: string;
  fileName?: string;
  content?: string;
  clientId?: string;
  email?: string;
}
