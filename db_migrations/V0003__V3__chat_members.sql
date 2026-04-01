CREATE TABLE IF NOT EXISTS "t_p64017493_messenger_creation_p".chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES "t_p64017493_messenger_creation_p".chats(id),
  user_id UUID REFERENCES "t_p64017493_messenger_creation_p".users(id),
  UNIQUE(chat_id, user_id)
);