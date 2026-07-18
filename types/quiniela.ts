// Quiniela types
export interface Quiniela {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_private: boolean;
  max_players: number;
  invite_code: string | null;
  created_at: string;
  updated_at: string;
}

export type QuinielaInsert = Omit<Quiniela, 'id' | 'created_at' | 'updated_at'>;
export type QuinielaUpdate = Partial<Omit<Quiniela, 'id' | 'created_at'>>;

// Quiniela Player types
export interface QuinielaPlayer {
  id: string;
  quiniela_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'player';
  joined_at: string;
}

export type QuinielaPlayerInsert = Omit<QuinielaPlayer, 'id' | 'joined_at'>;

// Quiniela with players
export interface QuinielaWithPlayers extends Quiniela {
  quiniela_players: QuinielaPlayer[];
  player_count: number;
}
