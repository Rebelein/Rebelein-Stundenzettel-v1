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
