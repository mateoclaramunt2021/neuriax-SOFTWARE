/**
 * Tests - Auth utilities
 * Validación de funciones de autenticación
 */

describe('Authentication Utilities', () => {
  // Test 1: Email validation
  test('debe validar email correcto', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('invalid.email')).toBe(false);
  });

  // Test 2: Password strength
  test('debe validar contraseña fuerte', () => {
    const isStrongPassword = (pwd) => 
      pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
    
    expect(isStrongPassword('Weak')).toBe(false);
    expect(isStrongPassword('Strong123')).toBe(true);
  });

  // Test 3: Token validation
  test('debe validar token JWT básicamente', () => {
    const isValidJWT = (token) => {
      const parts = token.split('.');
      return parts.length === 3;
    };

    expect(isValidJWT('valid.jwt.token')).toBe(true);
    expect(isValidJWT('invalid')).toBe(false);
  });

  // Test 4: Username validation
  test('debe validar username correcto', () => {
    const isValidUsername = (username) => 
      username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
    
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('valid_user123')).toBe(true);
  });
});

describe('Token Management', () => {
  // Test 5: Store token
  test('debe guardar y recuperar token', () => {
    const token = 'test_token_12345';
    localStorage.setItem('token', token);
    expect(localStorage.getItem('token')).toBe(token);
  });

  // Test 6: Clear token
  test('debe limpiar token', () => {
    localStorage.setItem('token', 'test');
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  // Test 7: Token expiry check
  test('debe verificar expiración de token', () => {
    const isTokenExpired = (expiryTime) => new Date() > new Date(expiryTime);
    
    const pastTime = new Date(Date.now() - 1000);
    const futureTime = new Date(Date.now() + 1000000);
    
    expect(isTokenExpired(pastTime)).toBe(true);
    expect(isTokenExpired(futureTime)).toBe(false);
  });
});

describe('User Data Validation', () => {
  // Test 8: User object structure
  test('debe validar estructura de usuario', () => {
    const validUser = {
      id: 1,
      email: 'user@example.com',
      username: 'testuser',
      rol: 'user'
    };

    expect(validUser.id).toBeDefined();
    expect(validUser.email).toBeDefined();
    expect(validUser.username).toBeDefined();
  });

  // Test 9: Phone validation
  test('debe validar formato de teléfono', () => {
    const isValidPhone = (phone) => /^[\d\s\-\+\(\)]+$/.test(phone) && phone.length >= 9;
    
    expect(isValidPhone('+34 912 345 678')).toBe(true);
    expect(isValidPhone('abc')).toBe(false);
  });

  // Test 10: Company name validation
  test('debe validar nombre de empresa', () => {
    const isValidCompanyName = (name) => name.length >= 2 && name.length <= 100;
    
    expect(isValidCompanyName('A')).toBe(false);
    expect(isValidCompanyName('NEURIAX Salon Manager')).toBe(true);
  });
});
