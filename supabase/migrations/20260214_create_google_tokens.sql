-- Create table for storing Google OAuth tokens
CREATE TABLE IF NOT EXISTS google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMPTZ NOT NULL,
    scope TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_google_token UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_expiry ON google_tokens(token_expiry);

-- Add RLS policies
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own tokens" ON google_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens" ON google_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens" ON google_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens" ON google_tokens
    FOR DELETE USING (auth.uid() = user_id);
