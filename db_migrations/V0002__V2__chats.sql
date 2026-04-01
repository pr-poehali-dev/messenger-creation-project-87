CREATE TABLE IF NOT EXISTS "t_p64017493_messenger_creation_p".chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);