CREATE TABLE IF NOT EXISTS "t_p64017493_messenger_creation_p".users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT '',
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  flames_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);