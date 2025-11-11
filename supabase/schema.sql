-- Create the time_entries table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    customer TEXT NOT NULL,
    hours FLOAT8 NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security for time_entries
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert, update, and delete their own time entries
CREATE POLICY "Allow full access to own time entries"
ON time_entries
FOR ALL
USING (auth.uid() = user_id);

-- Create the target_hours table
CREATE TABLE target_hours (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    monday FLOAT8 NOT NULL DEFAULT 8,
    tuesday FLOAT8 NOT NULL DEFAULT 8,
    wednesday FLOAT8 NOT NULL DEFAULT 8,
    thursday FLOAT8 NOT NULL DEFAULT 8,
    friday FLOAT8 NOT NULL DEFAULT 8
);

-- Enable Row Level Security for target_hours
ALTER TABLE target_hours ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert, update, and delete their own target hours
CREATE POLICY "Allow full access to own target hours"
ON target_hours
FOR ALL
USING (auth.uid() = user_id);
