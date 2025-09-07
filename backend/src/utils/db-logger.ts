import { supabaseAdmin } from '../lib/supabase'

interface LogData {
  actor: { id: string; email: string }
  action: string
  target?: { id: string; email?: string | null }
  details?: Record<string, any>
}

class DbLogger {
  async log(data: LogData) {
    try {
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        actor_id: data.actor.id,
        actor_email: data.actor.email,
        action: data.action,
        target_id: data.target?.id,
        target_email: data.target?.email,
        details: data.details,
      })

      if (error) {
        console.error('Failed to write to audit log:', error)
      }
    } catch (e) {
      console.error('Exception while writing to audit log:', e)
    }
  }
}

export const dbLogger = new DbLogger()