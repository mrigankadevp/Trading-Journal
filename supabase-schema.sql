-- Run this in Supabase → SQL Editor → New Query

-- Create the trades table
CREATE TABLE trades (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  -- Setup
  date              TEXT,
  instrument        TEXT,
  session           TEXT,
  lot_size          TEXT,
  daily_bias        TEXT,
  four_hr_bias      TEXT,
  key_level         TEXT,
  liquidity_target  TEXT,

  -- Trend
  trend_1h   TEXT,
  trend_30m  TEXT,
  trend_15m  TEXT,

  -- Entry
  direction     TEXT,
  entry_trigger TEXT,
  entry_price   TEXT,
  stop_loss     TEXT,
  take_profit   TEXT,

  -- Psychology gate
  emotional_state      TEXT,
  all_aligned          TEXT,
  at_key_level         TEXT,
  signal_not_feelings  TEXT,
  hit_daily_limit      TEXT,
  chasing_loss         TEXT,

  -- Post trade
  exit_price   TEXT,
  result       TEXT,
  pnl          TEXT,
  exit_type    TEXT,

  -- Discipline
  followed_plan     TEXT,
  extended_tp       TEXT,
  moved_sl          TEXT,
  discipline_score  TEXT,

  -- Reflection
  went_well          TEXT,
  went_wrong         TEXT,
  doing_differently  TEXT
);

-- Row Level Security: users can only see their own trades
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trades"
  ON trades FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
