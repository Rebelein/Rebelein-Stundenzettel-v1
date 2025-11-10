-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

-- Create the time_entries table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    customer TEXT NOT NULL,
    hours FLOAT8 NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security for both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own user entry
CREATE POLICY "Allow users to view their own data"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert, update, and delete their own time entries
CREATE POLICY "Allow full access to own time entries"
ON time_entries
FOR ALL
USING (auth.uid() = user_id);
