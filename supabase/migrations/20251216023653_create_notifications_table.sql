/*
  # Create Notifications Table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key) - Unique identifier
      - `type` (text) - Notification type: 'event', 'announcement', 'general'
      - `title` (text) - Notification title
      - `message` (text) - Full notification message content
      - `preview` (text) - Short preview text for list view
      - `published_at` (timestamptz) - When notification becomes visible
      - `expires_at` (timestamptz, nullable) - Optional expiration date
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for authenticated users to read published notifications
    - Add policy for admin users to manage all notifications

  3. Notes
    - Notifications support events, announcements, and general updates
    - Users only see notifications that are published and not expired
    - Admins can create notifications to inform users about drops, events, etc.
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('event', 'announcement', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  preview text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published, non-expired notifications
CREATE POLICY "Anyone can view active notifications"
  ON notifications
  FOR SELECT
  USING (
    published_at <= now() AND 
    (expires_at IS NULL OR expires_at > now())
  );

-- Policy: Admin users can insert notifications
CREATE POLICY "Admin users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admin users can update notifications
CREATE POLICY "Admin users can update notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Admin users can delete notifications
CREATE POLICY "Admin users can delete notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS notifications_published_at_idx ON notifications(published_at);
CREATE INDEX IF NOT EXISTS notifications_expires_at_idx ON notifications(expires_at);