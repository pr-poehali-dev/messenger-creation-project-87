CREATE TABLE IF NOT EXISTS "t_p64017493_messenger_creation_p".gift_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "t_p64017493_messenger_creation_p".users(id),
  package_name VARCHAR(100) NOT NULL,
  flames_count INTEGER NOT NULL,
  price_rub INTEGER NOT NULL,
  card_last4 VARCHAR(4) DEFAULT '',
  card_holder VARCHAR(100) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);