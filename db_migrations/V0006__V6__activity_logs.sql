CREATE TABLE IF NOT EXISTS "t_p64017493_messenger_creation_p".activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "t_p64017493_messenger_creation_p".users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);