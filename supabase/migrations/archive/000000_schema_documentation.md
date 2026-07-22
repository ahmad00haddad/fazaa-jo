# Fazaa Jordan Database Schema Documentation

This document serves as the single source of truth for the database schema after consolidating all legacy migration and patch scripts.

## Core Tables

### `profiles`
Stores user profile information.
- `id` (uuid, references auth.users)
- `name` (text)
- `gender` (text: 'male' | 'female')
- `city` (text)
- `phone` (text)
- `verified` (boolean)
- `points` (integer)
- `avatar_url` (text)

### `user_private_data`
Stores sensitive user data that should not be exposed to the public.
- `user_id` (uuid, primary key, references auth.users)
- `phone` (text)
- `phone_verified` (boolean)

### `fazaa_requests`
Stores help requests created by users.
- `id` (uuid)
- `user_id` (uuid, references auth.users)
- `requester_name` (text)
- `requester_gender` (text)
- `need` (text)
- `category` (text)
- `urgency` (text)
- `location` (text)
- `latitude` (numeric)
- `longitude` (numeric)
- `city` (text)
- `status` (text: 'active' | 'in_progress' | 'completed' | 'cancelled')
- `female_only` (boolean)
- `gender_visibility` (text)
- `price_jod` (numeric)

### `fazaa_responses`
Stores offers/responses to `fazaa_requests`.
- `id` (uuid)
- `request_id` (uuid, references fazaa_requests)
- `responder_id` (uuid, references auth.users)
- `responder_name` (text)
- `message` (text)
- `offered_price_jod` (numeric)
- `accepted` (boolean)

### `notifications`
Stores in-app notifications for users.
- `id` (uuid)
- `user_id` (uuid, references auth.users)
- `title` (text)
- `body` (text)
- `link` (text)
- `read` (boolean)

### `api_rate_limits`
Tracks edge function API usage to prevent abuse (AI / Chat).
- `id` (uuid)
- `user_id` (uuid, references auth.users)
- `endpoint` (text)
- `created_at` (timestamptz)

## Key RPC Functions

- `offer_help_rpc`: Safely handles a user offering help, includes checking if the request is female_only and verifying responder gender. It creates the response and sends a notification securely.
- `accept_response_rpc`: Handles accepting an offer, marking the request as completed, and notifying the responder.
- `check_rate_limit`: Checks if a user has exceeded the allowed number of edge function invocations within a given time window.

## Row Level Security (RLS)
The database heavily relies on RLS to ensure users can only access their own private data and can only modify their own requests/responses. Legacy files like `supabase_security_fixes.sql` established these policies.
