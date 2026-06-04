INSERT INTO users (id, email, username, full_name, phone_number, password_hash, role, locale) VALUES
  -- Admins (3)
  ('00000000-0000-4000-8000-000000000001', 'admin@moa.gov.et', 'admin', 'Administrator', '+251911000001', '$2a$10$qmp6KdqZIAph4kznGEJdLeBSWMwi8WmI1T7m8BPqlgIRn77iQO2TK', 'admin', 'en'),
  ('00000000-0000-4000-8000-000000000004', 'admin2@moa.gov.et', 'admin2', 'Admin Two', '+251911000002', '$2a$10$qmp6KdqZIAph4kznGEJdLeBSWMwi8WmI1T7m8BPqlgIRn77iQO2TK', 'admin', 'en'),
  ('00000000-0000-4000-8000-000000000005', 'admin3@moa.gov.et', 'admin3', 'Admin Three', '+251911000003', '$2a$10$qmp6KdqZIAph4kznGEJdLeBSWMwi8WmI1T7m8BPqlgIRn77iQO2TK', 'admin', 'en'),

  -- Users (3)
  ('00000000-0000-4000-8000-000000000002', 'user@moa.gov.et', 'portal.user', 'Demo User', '+251911000010', '$2a$10$1zTNvZDgqYiMIa1ITBcwD.BZM.kAg1tzH6PJFEEqmUOwMiKoE.wW6', 'user', 'en'),
  ('00000000-0000-4000-8000-000000000006', 'user2@moa.gov.et', 'portal.user2', 'Demo User Two', '+251911000011', '$2a$10$1zTNvZDgqYiMIa1ITBcwD.BZM.kAg1tzH6PJFEEqmUOwMiKoE.wW6', 'user', 'en'),
  ('00000000-0000-4000-8000-000000000007', 'user3@moa.gov.et', 'portal.user3', 'Demo User Three', '+251911000012', '$2a$10$1zTNvZDgqYiMIa1ITBcwD.BZM.kAg1tzH6PJFEEqmUOwMiKoE.wW6', 'user', 'en'),

  -- Supervisors (3)
  ('00000000-0000-4000-8000-000000000003', 'supervisor@moa.gov.et', 'supervisor', 'Field Supervisor', '+251911000020', '$2a$10$9uYvTcZinaqdGLCU4zoFKufW06LyCK6Jmy3ZQ.kWe8/2gUVwStUsO', 'supervisor', 'en'),
  ('00000000-0000-4000-8000-000000000008', 'supervisor2@moa.gov.et', 'supervisor2', 'Supervisor Two', '+251911000021', '$2a$10$9uYvTcZinaqdGLCU4zoFKufW06LyCK6Jmy3ZQ.kWe8/2gUVwStUsO', 'supervisor', 'en'),
  ('00000000-0000-4000-8000-000000000009', 'supervisor3@moa.gov.et', 'supervisor3', 'Supervisor Three', '+251911000022', '$2a$10$9uYvTcZinaqdGLCU4zoFKufW06LyCK6Jmy3ZQ.kWe8/2gUVwStUsO', 'supervisor', 'en')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  locale = EXCLUDED.locale;

INSERT INTO applications (id, slug, name_en, name_am, description_en, description_am, route_path, is_active, search_enabled, sidebar_order) VALUES
  ('00000000-0000-4000-8000-000000000010', 'dms', 'Document Management', 'የሰነድ አስተዳደር', 'Ministry document workspace', 'የሚኒስቴሩ የሰነድ ስራ ቦታ', '/apps/dms', true, true, 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO user_applications (user_id, application_id) VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000010'),
  ('00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000010')
ON CONFLICT DO NOTHING;

INSERT INTO portal_announcements (title_en, title_am, body_en, body_am) VALUES
  ('Rainy season advisory', 'የዝናብ ወቅት ማስጠንቀቂያ', 'Extension agents should coordinate soil moisture monitoring across highland regions.', 'የማስረጃ ወኪሎች በሰፊው ቦታዎች የአፈር እርጥበት ክትትል እንዲያደርጉ ይጠየቃሉ።'),
  ('Fertilizer subsidy extension', 'የማዳበሪያ ድጎማ ተራዘመ', 'The national fertilizer subsidy window has been extended through Q2.', 'የሀገር አቀፍ የማዳበሪያ ድጎማ መስክ ለሁለተኛ ሩብ ዘመን ተራዝሟል.')
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, details) VALUES
  ('00000000-0000-4000-8000-000000000001', 'SEED_COMPLETE', 'system', 'database', '{"message":"Initial portal seed"}');
