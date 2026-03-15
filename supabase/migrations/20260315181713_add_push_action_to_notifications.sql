/*
  # Add Push Action Fields to Notifications

  1. Modified Tables
    - `notifications`
      - `push_action_type` (text) - Where to route when push is tapped: 'tab', 'deal', 'url'
        - 'tab' = navigate to an in-app tab (deals, location, orders, notifications, profile)
        - 'deal' = open a specific deal detail page
        - 'url' = open an external URL (e.g. webshop product page)
      - `push_action_target` (text) - The target value:
        - For 'tab': the tab name (e.g. 'index', 'notifications', 'orders')
        - For 'deal': the deal UUID
        - For 'url': the full URL string

  2. Notes
    - Both columns default to route to the notifications tab if not set
    - These fields are used by the push notification system to deep-link users
      to the correct screen when they tap on a notification
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'push_action_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN push_action_type text NOT NULL DEFAULT 'tab' CHECK (push_action_type IN ('tab', 'deal', 'url'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'push_action_target'
  ) THEN
    ALTER TABLE notifications ADD COLUMN push_action_target text NOT NULL DEFAULT 'notifications';
  END IF;
END $$;
