/**
 * SUPABASE DATABASE SERVICE
 * NEURIAX Platform - Base de datos PostgreSQL en la nube
 * Proyecto: SOFTWARE neuriax
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qvytccklrpckewuusnkl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ypFE4trWlvUyOKDtUU19iQ_oYKk3cE1';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_LrMgnkrtgAM0GLGX6qzjRA_Lq2aEd14';

// Cliente de Supabase con service_role key (acceso completo)
let supabase = null;

function getClient() {
  if (!supabase) {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    if (key) {
      supabase = createClient(SUPABASE_URL, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Supabase client initialized');
    }
  }
  return supabase;
}

// Verificar si Supabase está configurado
function isConfigured() {
  return !!(SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
}

// ==================== USUARIOS ====================

async function createUser(userData) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getUserByEmail(email) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function getUserByUsername(username) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function getUserById(id) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

async function updateUser(id, updates) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getAllUsers() {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ==================== CITAS ====================

async function createAppointment(appointmentData) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getAppointmentsByUser(userId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

async function getAppointmentsByProfessional(professionalId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('appointments')
    .select('*')
    .eq('professional_id', professionalId)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

async function updateAppointment(id, updates) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== SERVICIOS ====================

async function createService(serviceData) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('services')
    .insert([serviceData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getAllServices() {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('services')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

async function getServicesByProfessional(professionalId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('services')
    .select('*')
    .eq('professional_id', professionalId)
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// ==================== PLANES/SUSCRIPCIONES ====================

async function getUserSubscription(userId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function createSubscription(subscriptionData) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateSubscription(userId, updates) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('subscriptions')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== SESIONES/TOKENS ====================

async function saveRefreshToken(userId, token, expiresAt) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('refresh_tokens')
    .upsert([{
      user_id: userId,
      token: token,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getRefreshToken(token) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { data, error } = await client
    .from('refresh_tokens')
    .select('*')
    .eq('token', token)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function deleteRefreshToken(token) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { error } = await client
    .from('refresh_tokens')
    .delete()
    .eq('token', token);
  
  if (error) throw error;
}

async function deleteRefreshTokensByUser(userId) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  
  const { error } = await client
    .from('refresh_tokens')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
}

// ==================== TEST CONNECTION ====================

async function testConnection() {
  try {
    const client = getClient();
    if (!client) {
      console.log('⚠️ Supabase not configured - using JSON fallback');
      return false;
    }
    
    // Test query
    const { data, error } = await client
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      // Table doesn't exist - need to create tables
      console.log('📋 Tables not found - need to run migrations');
      return { connected: true, tablesExist: false };
    }
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    return { connected: true, tablesExist: true };
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return { connected: false, error: error.message };
  }
}

// ==================== INIT TABLES ====================

async function initializeTables() {
  const client = getClient();
  if (!client) {
    console.log('⚠️ Supabase not configured');
    return false;
  }

  console.log('📋 Creating tables in Supabase...');
  
  // Las tablas se crean desde el SQL Editor de Supabase
  // Este script solo verifica que existen
  const tables = ['users', 'appointments', 'services', 'subscriptions', 'refresh_tokens'];
  
  for (const table of tables) {
    const { error } = await client
      .from(table)
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.log(`❌ Table '${table}' does not exist`);
    } else if (error) {
      console.log(`⚠️ Error checking table '${table}':`, error.message);
    } else {
      console.log(`✅ Table '${table}' exists`);
    }
  }
  
  return true;
}

module.exports = {
  getClient,
  isConfigured,
  testConnection,
  initializeTables,
  // Users
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  updateUser,
  getAllUsers,
  // Appointments
  createAppointment,
  getAppointmentsByUser,
  getAppointmentsByProfessional,
  updateAppointment,
  // Services
  createService,
  getAllServices,
  getServicesByProfessional,
  // Subscriptions
  getUserSubscription,
  createSubscription,
  updateSubscription,
  // Tokens
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensByUser
};
