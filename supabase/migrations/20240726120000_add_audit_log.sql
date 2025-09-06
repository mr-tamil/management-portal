-- Create the audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_id UUID,
  target_email TEXT,
  details JSONB
);

-- Add comments to the table and columns
COMMENT ON TABLE public.audit_logs IS 'Stores audit trail records for important actions in the system.';
COMMENT ON COLUMN public.audit_logs.actor_id IS 'The ID of the user who performed the action.';
COMMENT ON COLUMN public.audit_logs.actor_email IS 'The email of the user who performed the action (denormalized).';
COMMENT ON COLUMN public.audit_logs.action IS 'The type of action performed (e.g., "user.create", "user.ban").';
COMMENT ON COLUMN public.audit_logs.target_id IS 'The ID of the entity that was affected by the action (e.g., the user who was banned).';
COMMENT ON COLUMN public.audit_logs.target_email IS 'The email of the target entity (denormalized).';
COMMENT ON COLUMN public.audit_logs.details IS 'A JSON object containing additional details about the action.';

-- Add indexes for performance
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Note: RLS is handled at the API level by authenticating the request.
-- A previous policy was causing errors due to a missing function.
-- The API endpoint /api/adminium/logs is protected by auth middleware.



-- Enable Row Level Security on the audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Adminium members to read audit logs
CREATE POLICY "Allow Adminium members to read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.service_roles sr
    JOIN public.services s ON sr.service_id = s.id
    WHERE sr.user_id = auth.uid() AND s.name = 'Adminium'
  )
);

-- Policy: Block all client-side write operations on audit_logs
-- Logging should only happen via the backend using the service_role key, which bypasses RLS.
CREATE POLICY "Block all client-side writes to audit logs"
ON public.audit_logs
FOR ALL
TO public
USING (false);
