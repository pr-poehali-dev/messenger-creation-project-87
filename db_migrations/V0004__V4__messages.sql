CREATE TABLE IF NOT EXISTS "t_p64017493_messenger_creation_p".messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES "t_p64017493_messenger_creation_p".chats(id),
  sender_id UUID REFERENCES "t_p64017493_messenger_creation_p".users(id),
  content TEXT DEFAULT '',
  type VARCHAR(20) DEFAULT 'text',
  audio_url TEXT DEFAULT '',
  gift_count INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);