/*
  # Seed Sample Data

  1. Sample Services
    - RMS Analysis
    - E-commerce Platform
    - Mobile Game Backend

  2. Sample Service Metrics
    - Uptime, response time, error rate for each service

  3. Sample Activity Logs
    - Various user activities
*/

-- Insert sample services (these will be created by the first admin user)
INSERT INTO services (id, name, description, status, config) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'RMS Analysis', 'Service for analyzing retail management systems data.', 'active', '{"version": "1.0", "environment": "production"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'E-commerce Platform', 'Our primary online marketplace backend.', 'active', '{"version": "2.1", "environment": "production"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mobile Game Backend', 'Backend services for the new mobile game.', 'active', '{"version": "1.5", "environment": "production"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample service metrics for the last 30 days
DO $$
DECLARE
  service_record RECORD;
  day_offset INTEGER;
  base_date TIMESTAMPTZ;
BEGIN
  base_date := now() - INTERVAL '30 days';
  
  FOR service_record IN SELECT id FROM services LOOP
    FOR day_offset IN 0..29 LOOP
      -- Uptime metrics (95-99.9%)
      INSERT INTO service_metrics (service_id, metric_name, metric_value, metric_unit, recorded_at)
      VALUES (
        service_record.id,
        'uptime',
        95 + (random() * 4.9),
        'percentage',
        base_date + (day_offset || ' days')::INTERVAL
      );
      
      -- Response time metrics (50-200ms)
      INSERT INTO service_metrics (service_id, metric_name, metric_value, metric_unit, recorded_at)
      VALUES (
        service_record.id,
        'response_time',
        50 + (random() * 150),
        'milliseconds',
        base_date + (day_offset || ' days')::INTERVAL
      );
      
      -- Error rate metrics (0-2%)
      INSERT INTO service_metrics (service_id, metric_name, metric_value, metric_unit, recorded_at)
      VALUES (
        service_record.id,
        'error_rate',
        random() * 2,
        'percentage',
        base_date + (day_offset || ' days')::INTERVAL
      );
      
      -- Active users metrics (50-500)
      INSERT INTO service_metrics (service_id, metric_name, metric_value, metric_unit, recorded_at)
      VALUES (
        service_record.id,
        'active_users',
        50 + (random() * 450),
        'count',
        base_date + (day_offset || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;