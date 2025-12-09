-- Verify all tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'subscriptions', 'usage_logs', 'download_logs', 'login_logs', 'section_templates')
ORDER BY table_name;

