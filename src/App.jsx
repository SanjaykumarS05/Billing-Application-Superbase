import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    import('../renderer.js');
  }, []);

  return (
    <main className="app-wrap">
      <section id="loginScreen" className="card login-card visible">
        <h1>GST Billing</h1>
        <p className="muted">Web invoice software with Supabase storage</p>

        <form id="loginForm" className="stack">
          <label>
            Username
            <input id="username" type="text" placeholder="admin" defaultValue="admin" required />
          </label>
          <label>
            Password
            <div className="password-input-wrapper">
              <input id="password" type="password" placeholder="admin123" defaultValue="admin123" required />
              <button id="togglePassword" className="password-toggle" type="button" title="Show/Hide password">
                <span className="eye-icon">👁️</span>
              </button>
            </div>
          </label>
          <button className="btn primary" type="submit">Login</button>
        </form>

        <p className="hint">Default: <strong>admin / admin123</strong></p>
        <p id="loginMessage" className="message"></p>
      </section>

      <section id="appScreen" className="hidden">
        <nav className="card page-tabs">
          <button type="button" className="tab-btn active" data-page="dashboardPage">Dashboard</button>
          <button type="button" className="tab-btn" data-page="billingPage">Billing</button>
          <button type="button" className="tab-btn" data-page="invoicesPage">Invoices</button>
          <button type="button" className="tab-btn" data-page="customersPage">Customers</button>
          <button type="button" className="tab-btn" data-page="productsPage">Products</button>
          <button type="button" className="tab-btn" data-page="productSalesPage">Product Sales</button>
          <button type="button" className="tab-btn" data-page="settingsPage">Settings</button>
          <button id="logoutBtn" className="btn logout-btn" type="button">Logout</button>
        </nav>
        <div id="pagesHost"></div>
      </section>
    </main>
  );
}
