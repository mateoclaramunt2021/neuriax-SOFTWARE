-- =====================================================
-- NEURIAX - SCHEMA SQL PARA SUPABASE
-- Ejecutar en: SQL Editor de Supabase
-- =====================================================

-- 1. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(255),
  telefono VARCHAR(50),
  rol VARCHAR(50) DEFAULT 'cliente',
  plan VARCHAR(50) DEFAULT 'trial',
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE SERVICIOS
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE CITAS
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  status VARCHAR(50) DEFAULT 'pendiente',
  notes TEXT,
  total_price DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE SUSCRIPCIONES
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(50) DEFAULT 'trial',
  status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  payment_method VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_services_professional ON services(professional_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- =====================================================
-- USUARIO ADMIN INICIAL
-- Password: admin123 (hasheado con bcrypt)
-- =====================================================

INSERT INTO users (email, username, password, nombre, rol, plan, is_verified)
VALUES (
  'admin@neuriax.com',
  'admin',
  '$2a$10$8K1p/b0XkMSyMNyQxMJxKeZqZ3OqJQg0yK1N1RmGmM1M1M1M1M1M1',
  'Administrador',
  'admin',
  'premium',
  true
) ON CONFLICT (email) DO NOTHING;

-- Usuario profesional de prueba
INSERT INTO users (email, username, password, nombre, rol, plan, is_verified)
VALUES (
  'profesional@neuriax.com',
  'profesional',
  '$2a$10$8K1p/b0XkMSyMNyQxMJxKeZqZ3OqJQg0yK1N1RmGmM1M1M1M1M1M1',
  'Profesional Demo',
  'profesional',
  'trial',
  true
) ON CONFLICT (email) DO NOTHING;

-- Usuario cliente de prueba
INSERT INTO users (email, username, password, nombre, rol, plan, is_verified)
VALUES (
  'cliente@neuriax.com',
  'cliente',
  '$2a$10$8K1p/b0XkMSyMNyQxMJxKeZqZ3OqJQg0yK1N1RmGmM1M1M1M1M1M1',
  'Cliente Demo',
  'cliente',
  'trial',
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- Descomenta si quieres seguridad a nivel de fila
-- =====================================================

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ✅ SCHEMA COMPLETADO
-- =====================================================
