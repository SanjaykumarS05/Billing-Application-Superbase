import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    import('../renderer.js');
  }, []);

  return (
    <main className="app-wrap">
      <section id="loginScreen" className="card login-card hidden">
        <h1>GST Billing Application</h1>

        <form id="loginForm" className="stack">
          <label>
            Username
            <input id="username" type="text" placeholder="Username" required />
          </label>
          <label>
            Password
            <div className="password-input-wrapper">
              <input id="password" type="password" placeholder="Password" required />
              <button id="togglePassword" className="password-toggle" type="button" title="Show password">
                <span className="material-symbols-outlined">visibility_off</span>
              </button>
            </div>
          </label>
          <button className="btn primary" type="submit">Login</button>
        </form>
        <p id="loginMessage" className="message"></p>
      </section>

      <section id="appScreen" className="app-shell hidden">
        <div id="logoutConfirmModal" className="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmTitle">
          <div className="modal-card card">
            <h3 id="logoutConfirmTitle">Logout session?</h3>
            <p className="muted">Are you sure you want to logout this session?</p>
            <div className="modal-actions">
              <button id="confirmLogoutNo" className="btn ghost" type="button">No</button>
              <button id="confirmLogoutYes" className="btn primary" type="button">Yes</button>
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-brand">
            <div>
              <strong>GST Billing</strong>
              <span id="welcomeUser">Workspace</span>
            </div>
            <button id="sidebarToggle" className="sidebar-toggle" type="button" title="Collapse sidebar" aria-label="Collapse sidebar">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          </div>
          <nav className="page-tabs">
            <button type="button" className="tab-btn active" data-page="dashboardPage" title="Dashboard"><span className="material-symbols-outlined">dashboard</span><span className="nav-label">Dashboard</span></button>
            <button type="button" className="tab-btn" data-page="billingPage" title="Billing"><span className="material-symbols-outlined">receipt_long</span><span className="nav-label">Billing</span></button>
            <button type="button" className="tab-btn" data-page="invoicesPage" title="Invoices"><span className="material-symbols-outlined">description</span><span className="nav-label">Invoices</span></button>
            <button type="button" className="tab-btn" data-page="paymentsPage" title="Payments"><span className="material-symbols-outlined">payments</span><span className="nav-label">Payments</span></button>
            <button type="button" className="tab-btn" data-page="customersPage" title="Customers"><span className="material-symbols-outlined">groups</span><span className="nav-label">Customers</span></button>
            <button type="button" className="tab-btn" data-page="productsPage" title="Products"><span className="material-symbols-outlined">inventory_2</span><span className="nav-label">Products</span></button>
            <button type="button" className="tab-btn" data-page="productSalesPage" title="Product Sales"><span className="material-symbols-outlined">monitoring</span><span className="nav-label">Product Sales</span></button>
            <button type="button" className="tab-btn" data-page="settingsPage" title="Settings"><span className="material-symbols-outlined">settings</span><span className="nav-label">Settings</span></button>
          </nav>
          <button id="logoutBtn" className="btn logout-btn" type="button" title="Logout"><span className="material-symbols-outlined">logout</span><span className="nav-label">Logout</span></button>
        </aside>
        <div className="content-shell">
          <div id="pagesHost"></div>
        </div>
      </section>
    </main>
  );
}
