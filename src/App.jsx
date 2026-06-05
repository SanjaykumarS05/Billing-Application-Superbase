import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    import('../renderer.js');
  }, []);

  return (
    <main className="app-wrap">
      <section id="loginScreen" className="card login-card hidden">
        <h1>GST Billing</h1>

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
