/**
 * ========================================
 * RESPONSIVE SHOWCASE - NEURIAX
 * Demo de componentes responsive
 * PASO 8: Responsive Design Perfecto
 * ========================================
 */

import React, { useState } from 'react';
import {
  ResponsiveLayout,
  ResponsiveSidebar,
  ResponsiveContent,
  ResponsiveGrid,
  ResponsiveStack,
  HamburgerButton,
  MobileDrawer,
  MobileNav,
  BottomNav,
  FloatingActionButton,
  ResponsiveTable,
  StatusBadge,
  AvatarCell,
  CurrencyCell,
  DateCell,
  TableAction,
  useBreakpoint
} from './index';

// ========== RESPONSIVE SHOWCASE ==========
export const ResponsiveShowcase = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  
  // Sample data
  const tableData = [
    { id: 1, name: 'María García', email: 'maria@email.com', role: 'Admin', status: 'active', amount: 1250.00, date: '2026-01-26' },
    { id: 2, name: 'Juan López', email: 'juan@email.com', role: 'User', status: 'pending', amount: 850.50, date: '2026-01-25' },
    { id: 3, name: 'Ana Martínez', email: 'ana@email.com', role: 'Manager', status: 'active', amount: 2100.00, date: '2026-01-24' },
    { id: 4, name: 'Carlos Ruiz', email: 'carlos@email.com', role: 'User', status: 'inactive', amount: 450.00, date: '2026-01-23' },
  ];
  
  const tableColumns = [
    { 
      key: 'name', 
      header: 'Cliente',
      render: (value, row) => <AvatarCell name={value} subtitle={row.email} />
    },
    { key: 'role', header: 'Rol', hideOnMobile: true },
    { 
      key: 'status', 
      header: 'Estado',
      render: (value) => <StatusBadge status={value} />
    },
    { 
      key: 'amount', 
      header: 'Monto',
      align: 'right',
      render: (value) => <CurrencyCell value={value} />
    },
    { 
      key: 'date', 
      header: 'Fecha', 
      hideOnMobile: true,
      render: (value) => <DateCell date={value} />
    }
  ];
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clients', label: 'Clientes', icon: '👥', badge: '12' },
    { id: 'sales', label: 'Ventas', icon: '💰' },
    { id: 'divider1', divider: true, label: 'Gestión' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'reports', label: 'Reportes', icon: '📈' },
    { id: 'settings', label: 'Configuración', icon: '⚙️', arrow: true }
  ];
  
  const bottomNavItems = [
    { id: 'dashboard', label: 'Inicio', icon: '🏠' },
    { id: 'clients', label: 'Clientes', icon: '👥' },
    { id: 'sales', label: 'Ventas', icon: '💰', badge: '3' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' }
  ];
  
  return (
    <div className="responsive-showcase">
      <style>{`
        .responsive-showcase {
          min-height: 100vh;
          background: var(--gray-50, #f9fafb);
        }
        .showcase-header {
          padding: 20px;
          background: white;
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .showcase-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        .breakpoint-badge {
          padding: 4px 12px;
          background: var(--primary, #6366f1);
          color: white;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .device-info {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }
        .device-tag {
          padding: 4px 8px;
          background: var(--gray-100, #f3f4f6);
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .device-tag.active {
          background: #10b981;
          color: white;
        }
        .showcase-content {
          padding: 20px;
        }
        .showcase-section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--gray-800, #1f2937);
        }
        .demo-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 16px;
        }
        .grid-demo-item {
          background: linear-gradient(135deg, var(--primary, #6366f1) 0%, var(--secondary, #8b5cf6) 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          font-weight: 600;
        }
        .stack-demo-item {
          background: var(--gray-100, #f3f4f6);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        @media (min-width: 1024px) {
          .showcase-header .hamburger-btn {
            display: none;
          }
        }
      `}</style>
      
      {/* Header */}
      <header className="showcase-header">
        <HamburgerButton 
          isOpen={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <h1 className="showcase-title">PASO 8: Responsive Design</h1>
        <span className="breakpoint-badge">{breakpoint}</span>
        <div className="device-info">
          <span className={`device-tag ${isMobile ? 'active' : ''}`}>📱 Mobile</span>
          <span className={`device-tag ${isTablet ? 'active' : ''}`}>📱 Tablet</span>
          <span className={`device-tag ${isDesktop ? 'active' : ''}`}>💻 Desktop</span>
        </div>
      </header>
      
      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <MobileNav
          items={navItems}
          activeItem={activeNav}
          onItemClick={(item) => setActiveNav(item.id)}
          onClose={() => setMobileMenuOpen(false)}
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>💈</span>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>NEURIAX</span>
            </div>
          }
          footer={
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Versión 1.0.0 • PASO 8
            </div>
          }
        />
      </MobileDrawer>
      
      {/* Content */}
      <main className="showcase-content">
        {/* Grid Responsive */}
        <section className="showcase-section">
          <h2 className="section-title">📐 Grid Responsive</h2>
          <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="16px">
            <div className="grid-demo-item">Item 1</div>
            <div className="grid-demo-item">Item 2</div>
            <div className="grid-demo-item">Item 3</div>
            <div className="grid-demo-item">Item 4</div>
          </ResponsiveGrid>
        </section>
        
        {/* Stack Responsive */}
        <section className="showcase-section">
          <h2 className="section-title">📚 Stack Responsive</h2>
          <div className="demo-card">
            <ResponsiveStack 
              direction="row" 
              gap="12px"
              reverseOnMobile={true}
            >
              <div className="stack-demo-item" style={{ flex: 1 }}>Primero en desktop → Último en mobile</div>
              <div className="stack-demo-item" style={{ flex: 1 }}>Segundo</div>
              <div className="stack-demo-item" style={{ flex: 1 }}>Tercero</div>
            </ResponsiveStack>
          </div>
        </section>
        
        {/* Table Responsive */}
        <section className="showcase-section">
          <h2 className="section-title">📊 Tabla Responsive (Cards en móvil)</h2>
          <div className="demo-card" style={{ padding: 0, overflow: 'hidden' }}>
            <ResponsiveTable
              columns={tableColumns}
              data={tableData}
              striped
              hoverable
              sortable
              actions={(row) => (
                <>
                  <TableAction icon="✏️" label="Editar" variant="default" onClick={() => {}} />
                  <TableAction icon="🗑️" label="Eliminar" variant="danger" onClick={() => {}} />
                </>
              )}
            />
          </div>
        </section>
        
        {/* Info Cards */}
        <section className="showcase-section">
          <h2 className="section-title">ℹ️ Información del Sistema</h2>
          <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="16px">
            <div className="demo-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Breakpoints</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                <li>xs: &lt; 640px</li>
                <li>sm: ≥ 640px</li>
                <li>md: ≥ 768px</li>
                <li>lg: ≥ 1024px</li>
                <li>xl: ≥ 1280px</li>
                <li>2xl: ≥ 1536px</li>
              </ul>
            </div>
            <div className="demo-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Touch Targets</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Todos los elementos interactivos tienen un tamaño mínimo de 44x44px para 
                facilitar la interacción táctil.
              </p>
            </div>
            <div className="demo-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>Safe Areas</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Soporte completo para notch y áreas seguras en dispositivos iOS con 
                env(safe-area-inset-*).
              </p>
            </div>
          </ResponsiveGrid>
        </section>
      </main>
      
      {/* Bottom Nav (Mobile) */}
      <BottomNav
        items={bottomNavItems}
        activeItem={activeNav}
        onItemClick={(item) => setActiveNav(item.id)}
      />
      
      {/* FAB */}
      <FloatingActionButton
        icon="➕"
        label="Nuevo"
        position="bottom-right"
        color="primary"
        onClick={() => alert('FAB clicked!')}
      />
    </div>
  );
};

export default ResponsiveShowcase;
