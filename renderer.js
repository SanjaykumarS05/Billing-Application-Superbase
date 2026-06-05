async function loadPageSections() {
  const host = document.getElementById('pagesHost');
  if (!host) {
    return true;
  }

const pageFiles = ['dashboard.html', 'billing.html', 'invoices.html', 'customers.html', 'products.html', 'product_sales.html', 'settings.html'];
  const fragments = [];

  for (const fileName of pageFiles) {
    const result = await window.billingApi.loadPageTemplate(fileName);
    if (!result.success) {
      host.innerHTML = '<section class="page visible"><article class="card panel"><h3>Unable to load page</h3><p class="message error">' + (result.message || 'Unknown error') + '</p></article></section>';
      return false;
    }
    fragments.push(result.content);
  }

  host.innerHTML = fragments.join('\n');
  return true;
}

(async function initApp() {
  const loaded = await loadPageSections();
  if (!loaded) {
    return;
  }
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeUser = document.getElementById('welcomeUser');

const pageButtons = document.querySelectorAll('.tab-btn');
const pages = document.querySelectorAll('.page');

// Hide both main screens until session restore is complete,
// so the login page does not flash briefly on refresh.
loginScreen.classList.remove('visible');
loginScreen.classList.add('hidden');
appScreen.classList.remove('visible');
appScreen.classList.add('hidden');

const billForm = document.getElementById('billForm');
const toggleDetailsBtn = document.getElementById('toggleDetailsBtn');
const invoiceDetailsSection = document.getElementById('invoiceDetailsSection');
const itemsList = document.getElementById('itemsList');
const customerNameEl = document.getElementById('customerName');
const customerGstinEl = document.getElementById('customerGstin');
const customerAddressEl = document.getElementById('customerAddress');
const customerStateEl = document.getElementById('customerState');
const customerPhoneEl = document.getElementById('customerPhone');
const customerEmailEl = document.getElementById('customerEmail');
const eWayBillNoEl = document.getElementById('eWayBillNo');
const deliveryNoteEl = document.getElementById('deliveryNote');
const referenceNoDateEl = document.getElementById('referenceNoDate');
const otherReferencesEl = document.getElementById('otherReferences');
const buyersOrderNoEl = document.getElementById('buyersOrderNo');
const buyersOrderDateEl = document.getElementById('buyersOrderDate');
const dispatchDocNoEl = document.getElementById('dispatchDocNo');
const deliveryNoteDateEl = document.getElementById('deliveryNoteDate');
const dispatchedThroughEl = document.getElementById('dispatchedThrough');
const destinationEl = document.getElementById('destination');
const termsOfDeliveryEl = document.getElementById('termsOfDelivery');
const customerListEl = document.getElementById('customerList');
const billDateEl = document.getElementById('billDate');
const taxModeEl = document.getElementById('taxMode');
const billMessage = document.getElementById('billMessage');
const billsTableBody = document.getElementById('billsTableBody');

const subtotalVal = document.getElementById('subtotalVal');
const cgstVal = document.getElementById('cgstVal');
const sgstVal = document.getElementById('sgstVal');
const igstVal = document.getElementById('igstVal');
const totalVal = document.getElementById('totalVal');
const dashInvoiceCountEl = document.getElementById('dashInvoiceCount');
const dashCustomerCountEl = document.getElementById('dashCustomerCount');
const dashProductCountEl = document.getElementById('dashProductCount');
const dashInvoiceValueEl = document.getElementById('dashInvoiceValue');
const dashMonthValueEl = document.getElementById('dashMonthValue');
const dashRecentInvoicesEl = document.getElementById('dashRecentInvoices');
const dashNextInvoicesEl = document.getElementById('dashNextInvoices');
const dashSearchInputEl = document.getElementById('dashSearchInput');
const dashDateFromEl = document.getElementById('dashDateFrom');
const dashDateToEl = document.getElementById('dashDateTo');
const dashResetFilterBtnEl = document.getElementById('dashResetFilterBtn');
const dashPaginationEl = document.getElementById('dashPagination');

const customerForm = document.getElementById('customerForm');
const custName = document.getElementById('custName');
const custGstin = document.getElementById('custGstin');
const custState = document.getElementById('custState');
const custPhone = document.getElementById('custPhone');
const custEmail = document.getElementById('custEmail');
const custAddress = document.getElementById('custAddress');
const customerMessage = document.getElementById('customerMessage');
const customersTableBody = document.getElementById('customersTableBody');
const customerSearchInputEl = document.getElementById('customerSearchInput');
const customerPaginationEl = document.getElementById('customerPagination');
const customerSubmitBtnEl = document.getElementById('customerSubmitBtn');
const customerCancelEditBtnEl = document.getElementById('customerCancelEditBtn');
if (customerSearchInputEl) {
  customerSearchInputEl.placeholder = 'Search ID, name, GSTIN, state, phone or email';
}

const productForm = document.getElementById('productForm');
const prodName = document.getElementById('prodName');
const prodHsn = document.getElementById('prodHsn');
const prodUnit = document.getElementById('prodUnit');
const prodRate = document.getElementById('prodRate');
const productMessage = document.getElementById('productMessage');
const productsTableBody = document.getElementById('productsTableBody');
const productSearchInputEl = document.getElementById('productSearchInput');
const productPaginationEl = document.getElementById('productPagination');
const productSubmitBtnEl = document.getElementById('productSubmitBtn');
const productCancelEditBtnEl = document.getElementById('productCancelEditBtn');

const productSalesSearchInputEl = document.getElementById('productSalesSearchInput');
const productSalesDateFromEl = document.getElementById('productSalesDateFrom');
const productSalesDateToEl = document.getElementById('productSalesDateTo');
const productSalesResetBtnEl = document.getElementById('productSalesResetBtn');
const productSalesExportBtnEl = document.getElementById('productSalesExportBtn');
const productSalesTableBody = document.getElementById('productSalesTableBody');
const productSalesPaginationEl = document.getElementById('productSalesPagination');
const productSalesMessageEl = document.getElementById('productSalesMessage');

const invoiceSearchInputEl = document.getElementById('invoiceSearchInput');
const invoiceDateFromEl = document.getElementById('invoiceDateFrom');
const invoiceDateToEl = document.getElementById('invoiceDateTo');
const invoiceResetFilterBtnEl = document.getElementById('invoiceResetFilterBtn');
const invoiceExportBtnEl = document.getElementById('invoiceExportBtn');
const invoicePaginationEl = document.getElementById('invoicePagination');

const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileGstin = document.getElementById('profileGstin');
const profilePhone = document.getElementById('profilePhone');
const profileState = document.getElementById('profileState');
const profileStateCode = document.getElementById('profileStateCode');
const profileAddress = document.getElementById('profileAddress');
const profileBankName = document.getElementById('profileBankName');
const profileAccountNo = document.getElementById('profileAccountNo');
const profileBranchName = document.getElementById('profileBranchName');
const profileIfsc = document.getElementById('profileIfsc');
const profileDeclaration = document.getElementById('profileDeclaration');
const profileSignatory = document.getElementById('profileSignatory');
const profileMessage = document.getElementById('profileMessage');

const taxForm = document.getElementById('taxForm');
const defaultTaxRateEl = document.getElementById('defaultTaxRate');
const invoicePrefixEl = document.getElementById('invoicePrefix');
const invoiceStartValueEl = document.getElementById('invoiceStartValue');
const taxMessage = document.getElementById('taxMessage');
let compositionValidDaysEl = document.getElementById('compositionValidDays');

const passwordForm = document.getElementById('passwordForm');
const passwordUsername = document.getElementById('passwordUsername');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const passwordMessage = document.getElementById('passwordMessage');
const usersSettingsTabLabel = document.getElementById('usersSettingsTabLabel');
const settingsUsersPanel = document.getElementById('settingsUsers');
const addUserBtn = document.getElementById('addUserBtn');
const usersTableBody = document.getElementById('usersTableBody');
const usersMessage = document.getElementById('usersMessage');
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');
const closeAddUserModalBtn = document.getElementById('closeAddUserModalBtn');
const newUserUsername = document.getElementById('newUserUsername');
const newUserPassword = document.getElementById('newUserPassword');
const newUserEmail = document.getElementById('newUserEmail');
const addUserMessage = document.getElementById('addUserMessage');

function ensureCompositionSettingsField() {
  if (!taxForm || compositionValidDaysEl) {
    return;
  }
  const saveButton = taxForm.querySelector('button[type="submit"]');
  const label = document.createElement('label');
  label.innerHTML = `
    Composition Valid Range (Days)
    <input id="compositionValidDays" type="number" min="1" max="3650" step="1" required />
  `;
  taxForm.insertBefore(label, saveButton || null);
  compositionValidDaysEl = document.getElementById('compositionValidDays');
}

function ensureCompositionSupplyType() {
  if (!taxModeEl) {
    return;
  }
  const hasComposition = Array.from(taxModeEl.options).some((option) => option.value === 'composition');
  if (hasComposition) {
    return;
  }
  const compositionOption = document.createElement('option');
  compositionOption.value = 'composition';
  compositionOption.textContent = 'Composition';
  const noTaxOption = Array.from(taxModeEl.options).find((option) => option.value === 'none');
  taxModeEl.insertBefore(compositionOption, noTaxOption || null);
}

ensureCompositionSettingsField();
ensureCompositionSupplyType();

function ensureBackupSettingsPanel() {
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsCard = document.getElementById('settingsPage')?.querySelector('.card.panel');
  if (!settingsToggle || !settingsCard) {
    return;
  }

  if (!settingsToggle.querySelector('input[name="settingsTab"][value="backup"]')) {
    const backupTabLabel = document.createElement('label');
    backupTabLabel.innerHTML = '<input type="radio" name="settingsTab" value="backup" /> Backup';
    const passwordTabLabel = settingsToggle.querySelector('input[name="settingsTab"][value="password"]')?.closest('label');
    settingsToggle.insertBefore(backupTabLabel, passwordTabLabel || null);
  }

  if (!document.getElementById('settingsBackup')) {
    const panel = document.createElement('div');
    panel.id = 'settingsBackup';
    panel.className = 'settings-panel hidden';
    panel.innerHTML = `
      <div class="stack compact">
        <p>Backup Location: <strong>C:\\GST Application\\Backups</strong></p>
        <p>Last Backup Date & Time: <span id="backupLastAt">No backup yet</span></p>
        <button id="createBackupBtn" class="btn primary" type="button">Create Backup</button>
        <p id="backupMessage" class="message"></p>
      </div>
    `;
    const passwordPanel = document.getElementById('settingsPassword');
    settingsCard.insertBefore(panel, passwordPanel || null);
  }
}

ensureBackupSettingsPanel();
ensureInvoiceSupplyTypeColumn();
ensureCustomerIdColumn();

const settingsRadio = document.querySelectorAll('input[name="settingsTab"]');
const settingsPanels = {
  profile: document.getElementById('settingsProfile'),
  tax: document.getElementById('settingsTax'),
  users: document.getElementById('settingsUsers'),
  backup: document.getElementById('settingsBackup'),
  password: document.getElementById('settingsPassword')
};
const createBackupBtn = document.getElementById('createBackupBtn');
const backupLastAtEl = document.getElementById('backupLastAt');
const backupMessageEl = document.getElementById('backupMessage');

let currentUser = null;
let usersCache = [];
let products = [];
let customers = [];
let billsCache = [];
let productSalesCache = [];
let defaultTaxRate = 12;
let invoiceStartValue = 1;
let compositionValidDays = 30;
let editingCustomerId = null;
let editingProductId = null;
const PAGE_SIZE = 15;
const UNIT_OPTIONS = ['Meter', 'Kgs', 'Pices'];
const searchState = {
  dashboard: '',
  invoices: '',
  customers: '',
  products: '',
  productSales: ''
};
const dateFilterState = {
  dashboardFrom: '',
  dashboardTo: '',
  invoicesFrom: '',
  invoicesTo: '',
  productSalesFrom: '',
  productSalesTo: ''
};
const paginationState = {
  dashboard: 1,
  invoices: 1,
  customers: 1,
  products: 1,
  productSales: 1
};

const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

function populateStateDropdown(selectEl) {
  if (!selectEl) {
    return;
  }
  selectEl.innerHTML =
    ['<option value="">Select State</option>']
      .concat(INDIA_STATES.map((state) => `<option value="${state}">${state}</option>`))
      .join('');
}
function setMessage(el, text, type = '') {
  el.textContent = text;
  el.className = `message ${type}`.trim();
}

function updatePasswordSettingsUsername() {
  if (!currentUser || !passwordUsername || !newPassword || !confirmPassword) {
    return;
  }
  passwordUsername.value = currentUser.username;
  newPassword.value = '';
  confirmPassword.value = '';
}

function formatBackupDateTime(value) {
  const text = String(value || '').trim();
  if (!text) {
    return 'No backup yet';
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getPaginationMeta(totalItems, key) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number(paginationState[key] || 1), 1), totalPages);
  paginationState[key] = currentPage;
  return { totalPages, currentPage };
}

function paginateItems(items, key) {
  const { totalPages, currentPage } = getPaginationMeta(items.length, key);
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    rows: items.slice(start, start + PAGE_SIZE),
    totalPages,
    currentPage
  };
}

function renderPagination(containerEl, key, totalItems) {
  if (!containerEl) {
    return;
  }
  const { totalPages, currentPage } = getPaginationMeta(totalItems, key);
  if (totalItems <= PAGE_SIZE) {
    containerEl.innerHTML = '';
    return;
  }

  containerEl.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const activeClass = page === currentPage ? 'active' : '';
    return `<button type="button" class="page-btn ${activeClass}" data-page="${page}">${page}</button>`;
  }).join('');
}

function matchesQuery(parts, query) {
  if (!query) {
    return true;
  }
  const q = query.toLowerCase();
  return parts.some((part) => String(part ?? '').toLowerCase().includes(q));
}

function isDateInRange(dateValue, fromValue, toValue) {
  const value = String(dateValue || '');
  if (!value) {
    return false;
  }
  if (fromValue && value < fromValue) {
    return false;
  }
  if (toValue && value > toValue) {
    return false;
  }
  return true;
}

function getSupplyTypeLabel(taxMode) {
  if (taxMode === 'intra') {
    return 'Intra-state (CGST + SGST)';
  }
  if (taxMode === 'inter') {
    return 'Inter-state (IGST)';
  }
  if (taxMode === 'composition') {
    return 'Composition';
  }
  return 'No Tax';
}

function ensureInvoiceSupplyTypeColumn() {
  const invoiceTableHeadRow = document.querySelector('#invoicesPage table thead tr');
  if (!invoiceTableHeadRow) {
    return;
  }
  const exists = Array.from(invoiceTableHeadRow.querySelectorAll('th')).some(
    (th) => th.textContent.trim().toLowerCase() === 'supply type'
  );
  if (exists) {
    return;
  }
  const dateHeader = Array.from(invoiceTableHeadRow.querySelectorAll('th')).find(
    (th) => th.textContent.trim().toLowerCase() === 'date'
  );
  const th = document.createElement('th');
  th.textContent = 'Supply Type';
  invoiceTableHeadRow.insertBefore(th, dateHeader || null);
}

function ensureCustomerIdColumn() {
  const customerTableHeadRow = document.querySelector('#customersPage table thead tr');
  if (!customerTableHeadRow) {
    return;
  }
  const exists = Array.from(customerTableHeadRow.querySelectorAll('th')).some(
    (th) => th.textContent.trim().toLowerCase() === 'id'
  );
  if (exists) {
    return;
  }
  const firstHeader = customerTableHeadRow.querySelector('th');
  const th = document.createElement('th');
  th.textContent = 'ID';
  customerTableHeadRow.insertBefore(th, firstHeader || null);
}

function normalizeGstin(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function isValidGstin(value) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(value);
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function getFilteredBillsForSection(sectionKey, bills = billsCache) {
  const query = sectionKey === 'dashboard' ? searchState.dashboard : searchState.invoices;
  const fromValue =
    sectionKey === 'dashboard' ? dateFilterState.dashboardFrom : dateFilterState.invoicesFrom;
  const toValue = sectionKey === 'dashboard' ? dateFilterState.dashboardTo : dateFilterState.invoicesTo;

  return bills.filter((bill) => {
    const matchesSearch = matchesQuery(
      [bill.invoiceNo, bill.customerName, bill.billDate, Number(bill.total).toFixed(2)],
      query
    );
    if (!matchesSearch) {
      return false;
    }
    return isDateInRange(bill.billDate, fromValue, toValue);
  });
}

let toastTimer = null;
function showToast(text, type = 'success') {
  const existing = document.getElementById('appToast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'appToast';
  toast.className = `toast ${type}`.trim();
  toast.textContent = text;
  document.body.appendChild(toast);

  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 220);
  }, 2200);
}

let invoiceModalState = null;
let invoiceModalEl = null;
let invoiceModalFrameEl = null;
let invoiceModalHeadMetaEl = null;
let invoiceModalDownloadBtn = null;

function ensureInvoiceModal() {
  if (invoiceModalEl) {
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'invoice-modal-backdrop hidden';
  modal.innerHTML = `
    <div class="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoiceModalTitle">
      <div class="invoice-modal-head">
        <div class="invoice-modal-title-wrap">
          <h4 id="invoiceModalTitle">Invoice Preview</h4>
          <p class="invoice-modal-meta" data-modal-meta></p>
        </div>
        <button type="button" class="inline-btn" data-modal-close>Close</button>
      </div>
      <iframe class="invoice-preview-frame" data-modal-frame title="Invoice Preview"></iframe>
      <div class="invoice-modal-actions">
        <button type="button" class="btn primary" data-modal-download>Download</button>
      </div>
    </div>
  `;

  const panel = modal.querySelector('.invoice-modal');
  const closeBtn = modal.querySelector('[data-modal-close]');

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  closeBtn.addEventListener('click', () => {
    closeInvoiceModal();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeInvoiceModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeInvoiceModal();
    }
  });

  document.body.appendChild(modal);
  invoiceModalEl = modal;
  invoiceModalHeadMetaEl = modal.querySelector('[data-modal-meta]');
  invoiceModalFrameEl = modal.querySelector('[data-modal-frame]');
  invoiceModalDownloadBtn = modal.querySelector('[data-modal-download]');

  invoiceModalDownloadBtn.addEventListener('click', async () => {
    if (!invoiceModalState?.id) {
      return;
    }
    await downloadBillById(invoiceModalState.id, invoiceModalDownloadBtn);
  });
}

async function openInvoiceModal(bill) {
  ensureInvoiceModal();
  invoiceModalState = bill;
  invoiceModalHeadMetaEl.textContent = `${bill.invoiceNo} | ${bill.customerName} | ${bill.billDate} | ${Number(bill.total).toFixed(2)}`;
  invoiceModalFrameEl.srcdoc = '<p style="font-family: Segoe UI, sans-serif; padding: 16px;">Loading invoice...</p>';
  invoiceModalEl.classList.remove('hidden');

  const result = await window.billingApi.getInvoiceHtml({ billId: bill.id });
  if (!result.success) {
    invoiceModalFrameEl.srcdoc = `<p style="font-family: Segoe UI, sans-serif; padding: 16px; color: #c1324a;">${result.message || 'Unable to load invoice.'}</p>`;
    return;
  }

  invoiceModalFrameEl.srcdoc = result.html || '<p style="font-family: Segoe UI, sans-serif; padding: 16px;">Invoice preview is empty.</p>';
}

function closeInvoiceModal() {
  if (!invoiceModalEl) {
    return;
  }
  invoiceModalEl.classList.add('hidden');
  if (invoiceModalFrameEl) {
    invoiceModalFrameEl.srcdoc = '';
  }
}

async function downloadBillById(billId, buttonEl = null) {
  if (!billId) {
    return;
  }

  const button = buttonEl || null;
  const originalText = button ? button.textContent : '';
  if (button) {
    button.disabled = true;
    button.textContent = 'Preparing...';
  }

  const result = await window.billingApi.downloadInvoicePdf({ billId });

  if (button) {
    button.disabled = false;
    button.textContent = originalText || 'Download';
  }

  if (!result.success) {
    setMessage(billMessage, result.message || 'Unable to download invoice.', 'error');
    return;
  }

  showToast('Downloaded successfully');
  setMessage(billMessage, `Invoice downloaded: ${result.filePath}`, 'success');
}

function showPage(pageId, options = { pushState: true }) {
  const targetPageId = String(pageId || '').trim();
  if (!targetPageId) {
    return;
  }

  pages.forEach((page) => {
    page.classList.toggle('visible', page.id === targetPageId);
    page.classList.toggle('hidden', page.id !== targetPageId);
  });

  pageButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.page === targetPageId);
  });

  if (options.pushState) {
    const newHash = `#${targetPageId}`;
    if (window.location.hash !== newHash) {
      window.history.pushState({ page: targetPageId }, '', newHash);
    } else {
      window.history.replaceState({ page: targetPageId }, '', newHash);
    }
  }
}

function getRoutePage() {
  const requested = String(window.location.hash || '').replace(/^#/, '').trim();
  const validPage = Array.from(pageButtons).map((button) => button.dataset.page).find((pageId) => pageId === requested);
  return validPage || 'dashboardPage';
}

function setLoginRoute() {
  if (window.location.hash !== '#login') {
    window.history.pushState({ page: 'login' }, '', '#login');
  }
}

window.addEventListener('popstate', () => {
  if (currentUser) {
    const pageId = getRoutePage();
    showPage(pageId, { pushState: false });
  }
});

function isCurrentUserAdmin() {
  return currentUser?.role === 'admin' || currentUser?.username === 'admin';
}

function selectSettingsTab(tabName) {
  const radio = document.querySelector(`input[name="settingsTab"][value="${tabName}"]`);
  if (!radio) {
    return;
  }
  radio.checked = true;
  Object.keys(settingsPanels).forEach((key) => {
    if (!settingsPanels[key]) {
      return;
    }
    settingsPanels[key].classList.toggle('visible', key === tabName);
    settingsPanels[key].classList.toggle('hidden', key !== tabName);
  });
  if (tabName === 'password') {
    updatePasswordSettingsUsername();
  }
}

function updateUsersAccess() {
  const isAdmin = isCurrentUserAdmin();
  usersSettingsTabLabel?.classList.toggle('hidden', !isAdmin);
  settingsUsersPanel?.classList.toggle('hidden', !isAdmin);
  addUserModal?.classList.add('hidden');

  if (!isAdmin) {
    usersCache = [];
    if (usersTableBody) {
      usersTableBody.innerHTML = '';
    }
    const usersRadio = document.querySelector('input[name="settingsTab"][value="users"]');
    if (usersRadio?.checked) {
      selectSettingsTab('profile');
    }
  }
}

function showApp(user) {
  loginScreen.classList.remove('visible');
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  appScreen.classList.add('visible');
  updateUsersAccess();
  updatePasswordSettingsUsername();
  // Start inactivity timer when user logs in
  startInactivityTimer();
}

function showLogin() {
  stopInactivityTimer();
  appScreen.classList.remove('visible');
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginScreen.classList.add('visible');

  currentUser = null;
  usersCache = [];
  updateUsersAccess();
  loginForm.reset();
  setMessage(loginMessage, '');
  billForm.reset();
  billDateEl.value = new Date().toISOString().slice(0, 10);
  itemsList.innerHTML = '';
  clearInvoiceDetails();
  invoiceDetailsSection.classList.add('hidden');
  toggleDetailsBtn.textContent = '+ Add Details';
  updateTotals();
}

function escapeAttr(value) {
  return String(value ?? '').replace(/"/g, '&quot;');
}

function normalizeUnit(value) {
  const unit = String(value || '').trim();
  return UNIT_OPTIONS.includes(unit) ? unit : 'Kgs';
}

function renderUnitOptions(selectedValue = 'Kgs') {
  const selectedUnit = normalizeUnit(selectedValue);
  return UNIT_OPTIONS.map((unit) => (
    `<option value="${unit}"${unit === selectedUnit ? ' selected' : ''}>${unit}</option>`
  )).join('');
}

function getTaxLabel(taxRate = defaultTaxRate) {
  const normalizedRate = Number(taxRate || 0);
  if (normalizedRate <= 0) {
    return '0%';
  }
  return `${normalizedRate}%`;
}

function parseTaxRateInput(rawValue) {
  const cleaned = String(rawValue ?? '').replace('%', '').trim();
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function syncItemTaxFields(forceRate = null) {
  itemsList.querySelectorAll('.item-tax').forEach((input) => {
    const existingRate = parseTaxRateInput(input.value);
    const currentRate = forceRate === null ? existingRate : Number(forceRate || 0);
    input.value = getTaxLabel(currentRate);
  });
}

function handleTaxModeChange() {
  if (taxModeEl.value === 'none' || taxModeEl.value === 'composition') {
    syncItemTaxFields(0);
    updateTotals();
    return;
  }

  syncItemTaxFields();
  updateTotals();
}

function createItemRow(initial = {}) {
  const row = document.createElement('div');
  row.className = 'item-row';
  const initialTaxRate = Number((initial.taxRate ?? ((taxModeEl.value === 'none' || taxModeEl.value === 'composition') ? 0 : defaultTaxRate)) || 0);

  const productOptions = ['<option value="">Select product</option>']
    .concat(
      products.map((product) => `<option value="${product.id}">${product.productName}</option>`)
    )
    .join('');

  row.innerHTML = `
    <label>
      Product
      <select class="item-product">${productOptions}</select>
    </label>
    <label>
      Description
      <input class="item-description" type="text" value="${escapeAttr(initial.description || '')}" required />
    </label>
    <label>
      HSN/SAC
      <input class="item-hsn" type="text" value="${escapeAttr(initial.hsnSac || '')}" />
    </label>
    <label>
      Qty
      <input class="item-qty" type="number" min="0" step="0.001" value="${initial.quantity || 1}" required />
    </label>
    <label>
      Unit
      <select class="item-unit">${renderUnitOptions(initial.unit || 'Kgs')}</select>
    </label>
    <label>
      Rate
      <input class="item-rate" type="number" min="0" step="0.01" value="${initial.rate || 0}" required />
    </label>
    <label>
      Tax
      <input class="item-tax" type="text" value="${escapeAttr(getTaxLabel(initialTaxRate))}" />
    </label>
    <div class="item-actions">
      <button class="item-add" type="button" title="Add Item">+</button>
      <button class="item-remove" type="button" title="Remove">x</button>
    </div>
  `;

  const productSelect = row.querySelector('.item-product');
  productSelect.addEventListener('change', () => {
    const selectedId = Number(productSelect.value || 0);
    const found = products.find((p) => p.id === selectedId);
    if (!found) {
      return;
    }

    row.querySelector('.item-description').value = found.productName;
    row.querySelector('.item-hsn').value = found.hsnSac || '';
    row.querySelector('.item-unit').value = normalizeUnit(found.unit);
    row.querySelector('.item-rate').value = Number(found.rate).toFixed(2);
    updateTotals();
  });

  row.querySelectorAll('input,select').forEach((element) => {
    element.addEventListener('input', updateTotals);
    element.addEventListener('change', updateTotals);
  });
  const taxInput = row.querySelector('.item-tax');
  taxInput.addEventListener('blur', () => {
    taxInput.value = getTaxLabel(parseTaxRateInput(taxInput.value));
    updateTotals();
  });

  row.querySelector('.item-remove').addEventListener('click', () => {
    row.remove();
    if (itemsList.children.length === 0) {
      addItemRow();
    }
    updateTotals();
  });

  row.querySelector('.item-add').addEventListener('click', () => {
    addItemRow();
  });

  return row;
}

function addItemRow(initial = {}) {
  itemsList.appendChild(createItemRow(initial));
  updateTotals();
}

function collectItems() {
  return Array.from(itemsList.querySelectorAll('.item-row')).map((row) => {
    const selectedProductId = Number(row.querySelector('.item-product').value || 0);
    const selectedProduct = products.find((product) => product.id === selectedProductId);

    return {
      description: row.querySelector('.item-description').value.trim(),
      hsnSac: row.querySelector('.item-hsn').value.trim(),
      quantity: Number(row.querySelector('.item-qty').value || 0),
      rate: Number(row.querySelector('.item-rate').value || 0),
      unit: normalizeUnit(row.querySelector('.item-unit').value || selectedProduct?.unit || 'Kgs'),
      taxRate: parseTaxRateInput(row.querySelector('.item-tax').value)
    };
  });
}

function updateTotals() {
  const items = collectItems();
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const isNoTaxMode = taxModeEl.value === 'none' || taxModeEl.value === 'composition';
  const totalTax = isNoTaxMode
    ? 0
    : items.reduce((sum, item) => sum + (item.quantity * item.rate * item.taxRate) / 100, 0);

  const isIntra = taxModeEl.value === 'intra';
  const isInter = taxModeEl.value === 'inter';
  const cgst = isIntra ? totalTax / 2 : 0;
  const sgst = isIntra ? totalTax / 2 : 0;
  const igst = isInter ? totalTax : 0;
  const total = subtotal + totalTax;

  subtotalVal.textContent = subtotal.toFixed(2);
  cgstVal.textContent = cgst.toFixed(2);
  sgstVal.textContent = sgst.toFixed(2);
  igstVal.textContent = igst.toFixed(2);
  totalVal.textContent = total.toFixed(2);
}

function clearInvoiceDetails() {
  deliveryNoteEl.value = '';
  referenceNoDateEl.value = '';
  otherReferencesEl.value = '';
  buyersOrderNoEl.value = '';
  buyersOrderDateEl.value = '';
  dispatchDocNoEl.value = '';
  deliveryNoteDateEl.value = '';
  dispatchedThroughEl.value = '';
  destinationEl.value = '';
  termsOfDeliveryEl.value = '';
}

function resetBillingForm() {
  billForm.reset();
  billDateEl.value = new Date().toISOString().slice(0, 10);
  taxModeEl.value = 'intra';
  handleTaxModeChange();
  customerGstinEl.value = '';
  customerAddressEl.value = '';
  customerStateEl.value = '';
  customerPhoneEl.value = '';
  customerEmailEl.value = '';
  eWayBillNoEl.value = '';
  clearInvoiceDetails();
  invoiceDetailsSection.classList.add('hidden');
  toggleDetailsBtn.textContent = '+ Add Details';
  itemsList.innerHTML = '';
  addItemRow();
  updateTotals();
  customerNameEl.focus();
  document.getElementById('billingPage')?.scrollIntoView({ block: 'start' });
}

function fillCustomerDatalist() {
  customerListEl.innerHTML = customers
    .map((customer) => `<option value="${customer.customerName}"></option>`)
    .join('');
}

function resetCustomerEditMode() {
  editingCustomerId = null;
  if (customerSubmitBtnEl) {
    customerSubmitBtnEl.textContent = 'Save Customer';
  }
  customerCancelEditBtnEl?.classList.add('hidden');
}

function resetProductEditMode() {
  editingProductId = null;
  if (productSubmitBtnEl) {
    productSubmitBtnEl.textContent = 'Save Product';
  }
  productCancelEditBtnEl?.classList.add('hidden');
}

function renderCustomersTable() {
  const filteredCustomers = customers.filter((customer) =>
    matchesQuery(
      [String(customer.id || ''), customer.customerName, customer.gstin, customer.state, customer.phone, customer.email],
      searchState.customers
    )
  );
  const { rows } = paginateItems(filteredCustomers, 'customers');
  customersTableBody.innerHTML = '';
  if (rows.length === 0) {
    customersTableBody.innerHTML = `<tr><td colspan="7" class="muted">${
      filteredCustomers.length === 0 && customers.length > 0 ? 'No matching customers.' : 'No customers added.'
    }</td></tr>`;
    renderPagination(customerPaginationEl, 'customers', filteredCustomers.length);
    return;
  }

  rows.forEach((customer) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${customer.id}</td>
      <td>${customer.customerName}</td>
      <td>${customer.gstin || '-'}</td>
      <td>${customer.state || '-'}</td>
      <td>${customer.phone || '-'}</td>
      <td>${customer.email || '-'}</td>
      <td><button type="button" class="inline-btn" data-edit-customer-id="${customer.id}">Edit</button></td>
    `;
    customersTableBody.appendChild(row);
  });
  renderPagination(customerPaginationEl, 'customers', filteredCustomers.length);
}

function renderProductsTable() {
  const filteredProducts = products.filter((product) =>
    matchesQuery(
      [product.productName, product.hsnSac, product.unit, Number(product.rate).toFixed(2)],
      searchState.products
    )
  );
  const { rows } = paginateItems(filteredProducts, 'products');
  productsTableBody.innerHTML = '';
  if (rows.length === 0) {
    productsTableBody.innerHTML = `<tr><td colspan="5" class="muted">${
      filteredProducts.length === 0 && products.length > 0 ? 'No matching products.' : 'No products added.'
    }</td></tr>`;
    renderPagination(productPaginationEl, 'products', filteredProducts.length);
    return;
  }

  rows.forEach((product) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.productName}</td>
      <td>${product.hsnSac || '-'}</td>
      <td>${product.unit || 'Kgs'}</td>
      <td>${Number(product.rate).toFixed(2)}</td>
      <td><button type="button" class="inline-btn" data-edit-product-id="${product.id}">Edit</button></td>
    `;
    productsTableBody.appendChild(row);
  });
  renderPagination(productPaginationEl, 'products', filteredProducts.length);
}

function getFilteredProductSales() {
  return productSalesCache.filter((row) => {
    const matches = matchesQuery([row.productName, row.hsnSac], searchState.productSales);
    return matches;
  });
}

function renderProductSalesTable() {
  if (!productSalesTableBody) {
    return;
  }
  const filteredRows = getFilteredProductSales();
  const { rows } = paginateItems(filteredRows, 'productSales');
  productSalesTableBody.innerHTML = '';

  if (rows.length === 0) {
    productSalesTableBody.innerHTML = '<tr><td colspan="7" class="muted">No product sales found.</td></tr>';
    renderPagination(productSalesPaginationEl, 'productSales', filteredRows.length);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.productName || '-'}</td>
      <td>${row.hsnSac || '-'}</td>
      <td>${Number(row.totalQty || 0).toFixed(3)}</td>
      <td>${Number(row.taxableValue || 0).toFixed(2)}</td>
      <td>${Number(row.taxAmount || 0).toFixed(2)}</td>
      <td>${Number(row.totalAmount || 0).toFixed(2)}</td>
      <td>${Number(row.invoiceCount || 0)}</td>
    `;
    productSalesTableBody.appendChild(tr);
  });
  renderPagination(productSalesPaginationEl, 'productSales', filteredRows.length);
}

function renderBillsTable(bills = billsCache) {
  const filteredBills = getFilteredBillsForSection('invoices', bills);
  const { rows } = paginateItems(filteredBills, 'invoices');
  billsTableBody.innerHTML = '';

  if (rows.length === 0) {
    billsTableBody.innerHTML = `<tr><td colspan="6" class="muted">${
      filteredBills.length === 0 && bills.length > 0 ? 'No matching invoices.' : 'No invoices saved.'
    }</td></tr>`;
    renderPagination(invoicePaginationEl, 'invoices', filteredBills.length);
    return;
  }

  rows.forEach((bill) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><button type="button" class="invoice-link-btn" data-open-invoice-id="${bill.id}">${bill.invoiceNo}</button></td>
      <td>${bill.customerName}</td>
      <td>${getSupplyTypeLabel(bill.taxMode)}</td>
      <td>${bill.billDate}</td>
      <td>${Number(bill.total).toFixed(2)}</td>
      <td><button type="button" class="inline-btn" data-open-invoice-id="${bill.id}">Preview</button></td>
    `;
    billsTableBody.appendChild(row);
  });
  renderPagination(invoicePaginationEl, 'invoices', filteredBills.length);
}

function renderDashboard() {
  if (!dashInvoiceCountEl) {
    return;
  }

  const filteredBills = getFilteredBillsForSection('dashboard', billsCache);
  const invoiceValue = filteredBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthValue = filteredBills
    .filter((bill) => String(bill.billDate || '').startsWith(monthPrefix))
    .reduce((sum, bill) => sum + Number(bill.total || 0), 0);
  dashInvoiceCountEl.textContent = String(billsCache.length);
  dashCustomerCountEl.textContent = String(customers.length);
  dashProductCountEl.textContent = String(products.length);
  dashInvoiceValueEl.textContent = invoiceValue.toFixed(2);
  dashMonthValueEl.textContent = monthValue.toFixed(2);

  const { rows } = paginateItems(filteredBills, 'dashboard');

  const invoiceItems = rows
    .slice(0, 8)
    .map(
      (bill) =>
        `<button type="button" class="dash-item invoice-dash-btn" data-open-invoice-id="${bill.id}"><strong>${bill.invoiceNo}</strong><span>${bill.customerName} | ${Number(bill.total).toFixed(2)}</span></button>`
    )
    .join('');
  dashRecentInvoicesEl.innerHTML = invoiceItems || '<p class="muted">No invoices available.</p>';

  const nextInvoiceItems = rows
    .slice(8, 15)
    .map(
      (bill) =>
        `<button type="button" class="dash-item invoice-dash-btn" data-open-invoice-id="${bill.id}"><strong>${bill.invoiceNo}</strong><span>${bill.customerName} | ${Number(bill.total).toFixed(2)}</span></button>`
    )
    .join('');
  dashNextInvoicesEl.innerHTML = nextInvoiceItems || '<p class="muted">No more invoices.</p>';
  renderPagination(dashPaginationEl, 'dashboard', filteredBills.length);

}

async function loadCustomers() {
  const result = await window.billingApi.listCustomers();
  if (!result.success) {
    return;
  }
  customers = result.customers;
  fillCustomerDatalist();
  renderCustomersTable();
  renderDashboard();
}

async function loadProducts() {
  const result = await window.billingApi.listProducts();
  if (!result.success) {
    return;
  }
  products = result.products;
  renderProductsTable();

  const existingRows = Array.from(itemsList.children);
  if (existingRows.length > 0) {
    itemsList.innerHTML = '';
    existingRows.forEach(() => addItemRow());
  }
  renderDashboard();
}

async function loadBills() {
  const result = await window.billingApi.listBills();
  if (!result.success) {
    return;
  }
  billsCache = result.bills || [];
  renderBillsTable(result.bills);
  renderDashboard();
}

function ensureProductSalesDefaultMonth() {
  if (!productSalesDateFromEl || !productSalesDateToEl) {
    return;
  }
  if (dateFilterState.productSalesFrom && dateFilterState.productSalesTo) {
    return;
  }
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const toIso = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  dateFilterState.productSalesFrom = toIso(firstDay);
  dateFilterState.productSalesTo = toIso(now);
  productSalesDateFromEl.value = dateFilterState.productSalesFrom;
  productSalesDateToEl.value = dateFilterState.productSalesTo;
}

async function loadProductSales() {
  ensureProductSalesDefaultMonth();
  const result = await window.billingApi.listProductSales({
    dateFrom: dateFilterState.productSalesFrom || '',
    dateTo: dateFilterState.productSalesTo || ''
  });
  if (!result.success) {
    setMessage(productSalesMessageEl, result.message || 'Unable to load product sales.', 'error');
    return;
  }
  productSalesCache = result.rows || [];
  paginationState.productSales = 1;
  renderProductSalesTable();
  setMessage(productSalesMessageEl, '', '');
}

async function loadSettings() {
  const result = await window.billingApi.getSettings();
  if (!result.success) {
    return;
  }

  profileName.value = result.settings.profileName;
  profileEmail.value = result.settings.profileEmail;
  profileGstin.value = result.settings.profileGstin || '';
  profilePhone.value = result.settings.profilePhone || '';
  profileState.value = result.settings.profileState || '';
  profileStateCode.value = result.settings.profileStateCode || '';
  profileAddress.value = result.settings.profileAddress || '';
  profileBankName.value = result.settings.profileBankName || '';
  profileAccountNo.value = result.settings.profileAccountNo || '';
  profileBranchName.value = result.settings.profileBranchName || '';
  profileIfsc.value = result.settings.profileIfsc || '';
  profileDeclaration.value = result.settings.profileDeclaration || '';
  profileSignatory.value = result.settings.profileSignatory || '';
  defaultTaxRate = Number(result.settings.defaultTaxRate || 12);
  invoiceStartValue = Number(result.settings.invoiceStartValue || 1);
  compositionValidDays = Number(result.settings.compositionValidDays || 30);
  defaultTaxRateEl.value = defaultTaxRate;
  if (invoiceStartValueEl) {
    invoiceStartValueEl.value = invoiceStartValue;
  }
  if (compositionValidDaysEl) {
    compositionValidDaysEl.value = String(compositionValidDays);
  }
  if (invoicePrefixEl) {
    invoicePrefixEl.value = result.settings.invoicePrefix || 'GST';
  }
  if (backupLastAtEl) {
    backupLastAtEl.textContent = formatBackupDateTime(result.settings.backupLastAt || '');
  }
  syncItemTaxFields();
}

function setAddUserModalVisible(visible) {
  if (!addUserModal || !addUserForm) {
    return;
  }
  addUserModal.classList.toggle('hidden', !visible);
  if (visible) {
    addUserForm.reset();
    setMessage(addUserMessage, '', '');
    newUserUsername?.focus();
  }
}

function renderUsersTable() {
  if (!usersTableBody) {
    return;
  }

  usersTableBody.innerHTML = '';

  if (!isCurrentUserAdmin()) {
    return;
  }

  if (usersCache.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'No users found.';
    row.appendChild(cell);
    usersTableBody.appendChild(row);
    return;
  }

  usersCache.forEach((user) => {
    const row = document.createElement('tr');
    const cells = [
      user.id,
      user.username,
      user.email || '-',
      user.active === false ? 'Inactive' : 'Active'
    ];

    cells.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.appendChild(cell);
    });

    const actionCell = document.createElement('td');
    const actionButton = document.createElement('button');
    const active = user.active !== false;
    const isProtectedUser = Number(user.id) === 1 || Number(user.id) === Number(currentUser?.id);
    actionButton.type = 'button';
    actionButton.className = 'inline-btn';
    actionButton.textContent = active ? 'Deactivate' : 'Activate';
    actionButton.disabled = isProtectedUser;
    actionButton.title = isProtectedUser ? 'Admin user cannot be deactivated.' : '';
    actionButton.addEventListener('click', async () => {
      actionButton.disabled = true;
      const result = await window.billingApi.setUserActive({
        userId: user.id,
        active: !active
      });

      if (!result.success) {
        setMessage(usersMessage, result.message || 'Unable to update user.', 'error');
        actionButton.disabled = false;
        return;
      }

      usersCache = usersCache.map((rowUser) => (
        Number(rowUser.id) === Number(result.user.id) ? result.user : rowUser
      ));
      renderUsersTable();
      setMessage(usersMessage, `User ${result.user.username} ${result.user.active ? 'activated' : 'deactivated'}.`, 'success');
    });

    actionCell.appendChild(actionButton);
    row.appendChild(actionCell);
    usersTableBody.appendChild(row);
  });
}

async function loadUsers() {
  updateUsersAccess();
  if (!isCurrentUserAdmin()) {
    return;
  }

  let result;
  try {
    result = await window.billingApi.listUsers();
  } catch (error) {
    setMessage(usersMessage, error.message || 'Unable to load users.', 'error');
    return;
  }
  if (!result.success) {
    setMessage(usersMessage, result.message || 'Unable to load users.', 'error');
    return;
  }

  usersCache = result.users || [];
  renderUsersTable();
  setMessage(usersMessage, '', '');
}

async function bootstrapAppData() {
  await Promise.all([loadSettings(), loadCustomers(), loadProducts(), loadBills(), loadProductSales()]);
  await loadUsers();
}

customerNameEl.addEventListener('input', () => {
  const found = customers.find(
    (customer) => customer.customerName.toLowerCase() === customerNameEl.value.trim().toLowerCase()
  );
  if (found) {
    customerGstinEl.value = found.gstin || '';
    customerAddressEl.value = found.address || '';
    customerStateEl.value = found.state || '';
    customerPhoneEl.value = found.phone || '';
    customerEmailEl.value = found.email || '';
  }
});

function bindSearch(inputEl, key, renderFn) {
  if (!inputEl) {
    return;
  }
  inputEl.addEventListener('input', () => {
    searchState[key] = inputEl.value.trim();
    paginationState[key] = 1;
    renderFn();
  });
}

function bindPagination(containerEl, key, renderFn) {
  if (!containerEl) {
    return;
  }
  containerEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button) {
      return;
    }
    const page = Number(button.dataset.page || 1);
    if (!page || paginationState[key] === page) {
      return;
    }
    paginationState[key] = page;
    renderFn();
  });
}

bindSearch(dashSearchInputEl, 'dashboard', renderDashboard);
bindSearch(invoiceSearchInputEl, 'invoices', renderBillsTable);
bindSearch(customerSearchInputEl, 'customers', renderCustomersTable);
bindSearch(productSearchInputEl, 'products', renderProductsTable);
bindSearch(productSalesSearchInputEl, 'productSales', renderProductSalesTable);

bindPagination(dashPaginationEl, 'dashboard', renderDashboard);
bindPagination(invoicePaginationEl, 'invoices', renderBillsTable);
bindPagination(customerPaginationEl, 'customers', renderCustomersTable);
bindPagination(productPaginationEl, 'products', renderProductsTable);
bindPagination(productSalesPaginationEl, 'productSales', renderProductSalesTable);

function bindDateFilter(inputEl, key, renderFn) {
  if (!inputEl) {
    return;
  }
  inputEl.addEventListener('change', () => {
    dateFilterState[key] = inputEl.value || '';
    const paginationKey = key.startsWith('dashboard') ? 'dashboard' : 'invoices';
    paginationState[paginationKey] = 1;
    renderFn();
  });
}

bindDateFilter(dashDateFromEl, 'dashboardFrom', renderDashboard);
bindDateFilter(dashDateToEl, 'dashboardTo', renderDashboard);
bindDateFilter(invoiceDateFromEl, 'invoicesFrom', renderBillsTable);
bindDateFilter(invoiceDateToEl, 'invoicesTo', renderBillsTable);

invoiceExportBtnEl?.addEventListener('click', async () => {
  const filteredBills = getFilteredBillsForSection('invoices', billsCache);
  if (filteredBills.length === 0) {
    setMessage(billMessage, 'No invoices found for current filters.', 'error');
    return;
  }

  invoiceExportBtnEl.disabled = true;
  const originalText = invoiceExportBtnEl.textContent;
  invoiceExportBtnEl.textContent = 'Exporting...';

  const result = await window.billingApi.exportBillsExcel({
    bills: filteredBills,
    dateFrom: dateFilterState.invoicesFrom || '',
    dateTo: dateFilterState.invoicesTo || ''
  });

  invoiceExportBtnEl.disabled = false;
  invoiceExportBtnEl.textContent = originalText || 'Download Excel';

  if (!result.success) {
    setMessage(billMessage, result.message || 'Unable to export Excel.', 'error');
    return;
  }

  showToast('Excel downloaded successfully');
  setMessage(billMessage, `Excel downloaded: ${result.filePath}`, 'success');
});

dashResetFilterBtnEl?.addEventListener('click', () => {
  searchState.dashboard = '';
  dateFilterState.dashboardFrom = '';
  dateFilterState.dashboardTo = '';
  paginationState.dashboard = 1;
  if (dashSearchInputEl) {
    dashSearchInputEl.value = '';
  }
  if (dashDateFromEl) {
    dashDateFromEl.value = '';
  }
  if (dashDateToEl) {
    dashDateToEl.value = '';
  }
  renderDashboard();
});

invoiceResetFilterBtnEl?.addEventListener('click', () => {
  searchState.invoices = '';
  dateFilterState.invoicesFrom = '';
  dateFilterState.invoicesTo = '';
  paginationState.invoices = 1;
  if (invoiceSearchInputEl) {
    invoiceSearchInputEl.value = '';
  }
  if (invoiceDateFromEl) {
    invoiceDateFromEl.value = '';
  }
  if (invoiceDateToEl) {
    invoiceDateToEl.value = '';
  }
  renderBillsTable();
});

async function applyProductSalesDateFilter() {
  dateFilterState.productSalesFrom = productSalesDateFromEl?.value || '';
  dateFilterState.productSalesTo = productSalesDateToEl?.value || '';
  await loadProductSales();
}

productSalesDateFromEl?.addEventListener('change', applyProductSalesDateFilter);
productSalesDateToEl?.addEventListener('change', applyProductSalesDateFilter);

productSalesResetBtnEl?.addEventListener('click', async () => {
  if (productSalesSearchInputEl) {
    productSalesSearchInputEl.value = '';
  }
  searchState.productSales = '';
  paginationState.productSales = 1;
  dateFilterState.productSalesFrom = '';
  dateFilterState.productSalesTo = '';
  ensureProductSalesDefaultMonth();
  await loadProductSales();
});

productSalesExportBtnEl?.addEventListener('click', async () => {
  const rows = getFilteredProductSales();
  if (rows.length === 0) {
    setMessage(productSalesMessageEl, 'No product sales found for export.', 'error');
    return;
  }

  productSalesExportBtnEl.disabled = true;
  const originalText = productSalesExportBtnEl.textContent;
  productSalesExportBtnEl.textContent = 'Exporting...';

  const result = await window.billingApi.exportProductSalesExcel({
    rows,
    dateFrom: dateFilterState.productSalesFrom || '',
    dateTo: dateFilterState.productSalesTo || ''
  });

  productSalesExportBtnEl.disabled = false;
  productSalesExportBtnEl.textContent = originalText || 'Download Excel';

  if (!result.success) {
    setMessage(productSalesMessageEl, result.message || 'Unable to export product sales.', 'error');
    return;
  }

  showToast('Excel downloaded successfully');
  setMessage(productSalesMessageEl, `Excel downloaded: ${result.filePath}`, 'success');
});

pageButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const pageId = button.dataset.page;
    showPage(pageId);
    if (pageId === 'productSalesPage') {
      await loadProductSales();
    }
    if (pageId === 'settingsPage') {
      updateUsersAccess();
      if (isCurrentUserAdmin()) {
        await loadUsers();
      }
    }
  });
});

settingsRadio.forEach((radio) => {
  radio.addEventListener('change', async () => {
    if (radio.value === 'users' && !isCurrentUserAdmin()) {
      selectSettingsTab('profile');
      return;
    }
    selectSettingsTab(radio.value);
    if (radio.value === 'users') {
      await loadUsers();
    }
  });
});

addUserBtn?.addEventListener('click', () => {
  if (!isCurrentUserAdmin()) {
    setMessage(usersMessage, 'Only admin can add users.', 'error');
    return;
  }
  setAddUserModalVisible(true);
});

closeAddUserModalBtn?.addEventListener('click', () => {
  setAddUserModalVisible(false);
});

addUserModal?.addEventListener('click', (event) => {
  if (event.target === addUserModal) {
    setAddUserModalVisible(false);
  }
});

addUserForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!isCurrentUserAdmin()) {
    setMessage(addUserMessage, 'Only admin can add users.', 'error');
    return;
  }

  const submitButton = addUserForm.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent || 'Save User';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
  }

  let result;
  try {
    result = await window.billingApi.addUser({
      username: newUserUsername.value.trim(),
      password: newUserPassword.value,
      email: newUserEmail.value.trim()
    });
  } catch (error) {
    result = { success: false, message: error.message || 'Unable to add user.' };
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  if (!result.success) {
    setMessage(addUserMessage, result.message || 'Unable to add user.', 'error');
    return;
  }

  setAddUserModalVisible(false);
  await loadUsers();
  setMessage(usersMessage, result.message || `User ${result.user.username} added.`, result.message ? 'error' : 'success');
});

createBackupBtn?.addEventListener('click', async () => {
  createBackupBtn.disabled = true;
  const originalText = createBackupBtn.textContent;
  createBackupBtn.textContent = 'Creating...';
  setMessage(backupMessageEl, '', '');

  const result = await window.billingApi.createBackup();

  createBackupBtn.disabled = false;
  createBackupBtn.textContent = originalText || 'Create Backup';

  if (!result.success) {
    setMessage(backupMessageEl, result.message || 'Unable to create backup.', 'error');
    return;
  }

  if (backupLastAtEl) {
    backupLastAtEl.textContent = formatBackupDateTime(result.backupLastAt || '');
  }
  const successText = result.mailMessage
    ? `Backup created: ${result.backupZipPath || result.backupPath}. ${result.mailMessage}`
    : `Backup created: ${result.backupZipPath || result.backupPath}`;
  setMessage(backupMessageEl, successText, result.mailSent === false ? 'error' : 'success');
});

// Password visibility toggle
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
let inactivityTimer = null;
const INACTIVITY_DELAY_MS = 15 * 60 * 1000; // 15 minutes

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', (event) => {
    event.preventDefault();
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePasswordBtn.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
      togglePasswordBtn.title = 'Hide password';
    } else {
      passwordInput.type = 'password';
      togglePasswordBtn.innerHTML = '<span class="material-symbols-outlined">visibility_off</span>';
      togglePasswordBtn.title = 'Show password';
    }
  });
}

// Auto-logout after 15 minutes of inactivity
function startInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    // Clear login credentials
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.type = 'password';
      if (togglePasswordBtn) {
        togglePasswordBtn.innerHTML = '<span class="material-symbols-outlined">visibility_off</span>';
        togglePasswordBtn.title = 'Show password';
      }
    }
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
      usernameInput.value = '';
    }
    
    // Logout user
    showLogin();
    setMessage(loginMessage, 'Session expired after 15 minutes of inactivity. Please login again.', 'error');
    setLoginRoute();
  }, INACTIVITY_DELAY_MS);
}

function stopInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function resetInactivityTimer() {
  if (currentUser) {
    startInactivityTimer();
  }
}

// Track user activity
function handleUserActivity() {
  if (currentUser) {
    resetInactivityTimer();
  }
}

window.addEventListener('mousemove', handleUserActivity);
window.addEventListener('mousedown', handleUserActivity);
window.addEventListener('keydown', handleUserActivity);
window.addEventListener('touchstart', handleUserActivity);
window.addEventListener('click', handleUserActivity);

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(loginMessage, '');

  let result;
  try {
    result = await window.billingApi.login({
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value
    });
  } catch (error) {
    setMessage(loginMessage, error.message || 'Login failed.', 'error');
    return;
  }

  if (!result.success) {
    setMessage(loginMessage, result.message || 'Login failed.', 'error');
    return;
  }

  currentUser = result.user;
  showApp(currentUser);
  showPage(getRoutePage());
  await bootstrapAppData();
  if (itemsList.children.length === 0) {
    addItemRow();
  }
  invoiceDetailsSection.classList.add('hidden');
  toggleDetailsBtn.textContent = '+ Add Details';
  updateTotals();
});

logoutBtn.addEventListener('click', async () => {
  await window.billingApi.logout();
  showLogin();
  setLoginRoute();
});

toggleDetailsBtn.addEventListener('click', () => {
  const isHidden = invoiceDetailsSection.classList.contains('hidden');
  invoiceDetailsSection.classList.toggle('hidden', !isHidden);
  toggleDetailsBtn.textContent = isHidden ? '- Hide Details' : '+ Add Details';
});
taxModeEl.addEventListener('change', handleTaxModeChange);

billForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitAction = event.submitter?.dataset?.action || 'save';

  if (!currentUser) {
    setMessage(billMessage, 'Please login again.', 'error');
    return;
  }

  const payload = {
    customerName: customerNameEl.value.trim(),
    customerGstin: customerGstinEl.value.trim(),
    customerAddress: customerAddressEl.value.trim(),
    customerState: customerStateEl.value.trim(),
    customerPhone: customerPhoneEl.value.trim(),
    customerEmail: customerEmailEl.value.trim(),
    eWayBillNo: eWayBillNoEl.value.trim(),
    deliveryNote: deliveryNoteEl.value.trim(),
    referenceNoDate: referenceNoDateEl.value.trim(),
    otherReferences: otherReferencesEl.value.trim(),
    buyersOrderNo: buyersOrderNoEl.value.trim(),
    buyersOrderDate: buyersOrderDateEl.value,
    dispatchDocNo: dispatchDocNoEl.value.trim(),
    deliveryNoteDate: deliveryNoteDateEl.value,
    dispatchedThrough: dispatchedThroughEl.value.trim(),
    destination: destinationEl.value.trim(),
    termsOfDelivery: termsOfDeliveryEl.value.trim(),
    billDate: billDateEl.value,
    taxMode: taxModeEl.value,
    createdBy: currentUser.id,
    items: collectItems()
  };

  const result = await window.billingApi.createBill(payload);
  if (!result.success) {
    setMessage(billMessage, result.message || 'Failed to save invoice.', 'error');
    return;
  }

  let postSaveMessage = `Invoice ${result.invoiceNo} saved to C:\\GST Application\\Invoices.`;
  let postSaveMessageType = 'success';

  if (submitAction === 'save-print' && result.bill?.id) {
    const saveResult = await window.billingApi.downloadInvoicePdf({ billId: result.bill.id });
    if (!saveResult.success) {
      postSaveMessage =
        `Invoice ${result.invoiceNo} saved, but download failed: ${saveResult.message || 'Unable to download invoice.'}`;
      postSaveMessageType = 'error';
    } else {
      showToast('Downloaded successfully');

      const printResult = await window.billingApi.printInvoice({ billId: result.bill.id });
      if (!printResult.success) {
        postSaveMessage =
          `Invoice ${result.invoiceNo} saved and downloaded, but print failed: ${printResult.message || 'Unable to open printer.'}`;
        postSaveMessageType = 'error';
      } else {
        showToast('Printer opened successfully');
        postSaveMessage = `Invoice ${result.invoiceNo} saved to C:\\GST Application\\Invoices and printer opened.`;
      }
    }
  } else {
    const saveResult = await window.billingApi.downloadInvoicePdf({ billId: result.bill.id });
    if (!saveResult.success) {
      postSaveMessage =
        `Invoice ${result.invoiceNo} saved, but download failed: ${saveResult.message || 'Unable to download invoice.'}`;
      postSaveMessageType = 'error';
    } else {
      showToast('Downloaded successfully');
    }
  }

  setMessage(billMessage, postSaveMessage, postSaveMessageType);
  resetBillingForm();
  await loadBills();
});

billsTableBody.addEventListener('click', async (event) => {
  const openButton = event.target.closest('[data-open-invoice-id]');
  if (openButton) {
    const openBillId = Number(openButton.dataset.openInvoiceId || 0);
    const openBill = billsCache.find((bill) => bill.id === openBillId);
    if (openBill) {
      await openInvoiceModal(openBill);
    }
    return;
  }
});

[dashRecentInvoicesEl, dashNextInvoicesEl].forEach((listEl) => {
  listEl?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-invoice-id]');
    if (!button) {
      return;
    }
    const billId = Number(button.dataset.openInvoiceId || 0);
    const found = billsCache.find((bill) => bill.id === billId);
    if (!found) {
      return;
    }
    openInvoiceModal(found);
  });
});

customersTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit-customer-id]');
  if (!button) {
    return;
  }
  const customerId = Number(button.dataset.editCustomerId || 0);
  const customer = customers.find((item) => item.id === customerId);
  if (!customer) {
    return;
  }

  editingCustomerId = customer.id;
  custName.value = customer.customerName || '';
  custGstin.value = customer.gstin || '';
  custState.value = customer.state || '';
  custPhone.value = customer.phone || '';
  custEmail.value = customer.email || '';
  custAddress.value = customer.address || '';
  if (customerSubmitBtnEl) {
    customerSubmitBtnEl.textContent = 'Update Customer';
  }
  customerCancelEditBtnEl?.classList.remove('hidden');
  custName.focus();
});

productsTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit-product-id]');
  if (!button) {
    return;
  }
  const productId = Number(button.dataset.editProductId || 0);
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  editingProductId = product.id;
  prodName.value = product.productName || '';
  prodHsn.value = product.hsnSac || '';
  prodUnit.value = normalizeUnit(product.unit);
  prodRate.value = Number(product.rate || 0).toFixed(2);
  if (productSubmitBtnEl) {
    productSubmitBtnEl.textContent = 'Update Product';
  }
  productCancelEditBtnEl?.classList.remove('hidden');
  prodName.focus();
});

customerCancelEditBtnEl?.addEventListener('click', () => {
  customerForm.reset();
  resetCustomerEditMode();
  setMessage(customerMessage, '', '');
});

productCancelEditBtnEl?.addEventListener('click', () => {
  productForm.reset();
  resetProductEditMode();
  setMessage(productMessage, '', '');
});

custPhone?.addEventListener('input', () => {
  custPhone.value = normalizePhone(custPhone.value).slice(0, 10);
});
custGstin?.addEventListener('input', () => {
  custGstin.value = normalizeGstin(custGstin.value).slice(0, 15);
});
prodHsn?.addEventListener('input', () => {
  prodHsn.value = String(prodHsn.value || '').replace(/\D/g, '');
});

if (custGstin) {
  custGstin.setAttribute('maxlength', '15');
  custGstin.setAttribute('autocapitalize', 'characters');
}
if (custPhone) {
  custPhone.setAttribute('maxlength', '10');
  custPhone.setAttribute('inputmode', 'numeric');
}
if (prodHsn) {
  prodHsn.setAttribute('inputmode', 'numeric');
}

customerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const normalizedPhone = normalizePhone(custPhone.value).slice(0, 10);
  const normalizedGstin = normalizeGstin(custGstin.value).slice(0, 15);
  if (normalizedPhone && normalizedPhone.length !== 10) {
    setMessage(customerMessage, 'Phone number must be exactly 10 digits.', 'error');
    return;
  }
  if (normalizedGstin && !isValidGstin(normalizedGstin)) {
    setMessage(customerMessage, 'Enter a valid GSTIN format', 'error');
    return;
  }
  custPhone.value = normalizedPhone;
  custGstin.value = normalizedGstin;

  const payload = {
    customerName: custName.value.trim(),
    gstin: normalizedGstin,
    state: custState.value.trim(),
    phone: normalizedPhone,
    email: custEmail.value.trim(),
    address: custAddress.value.trim()
  };
  const result = editingCustomerId
    ? await window.billingApi.updateCustomer({ customerId: editingCustomerId, ...payload })
    : await window.billingApi.addCustomer(payload);

  if (!result.success) {
    setMessage(customerMessage, result.message || 'Failed to save customer.', 'error');
    return;
  }

  customerForm.reset();
  setMessage(customerMessage, editingCustomerId ? 'Customer updated.' : 'Customer saved.', 'success');
  resetCustomerEditMode();
  await loadCustomers();
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const normalizedHsn = String(prodHsn.value || '').replace(/\D/g, '');
  if (prodHsn.value.trim() && !normalizedHsn) {
    setMessage(productMessage, 'HSN/SAC must contain only numbers.', 'error');
    return;
  }
  if (prodHsn.value.trim() && normalizedHsn !== prodHsn.value.trim()) {
    setMessage(productMessage, 'HSN/SAC must contain only numbers.', 'error');
    return;
  }
  prodHsn.value = normalizedHsn;

  const payload = {
    productName: prodName.value.trim(),
    hsnSac: normalizedHsn,
    unit: normalizeUnit(prodUnit.value),
    rate: Number(prodRate.value || 0)
  };
  const result = editingProductId
    ? await window.billingApi.updateProduct({ productId: editingProductId, ...payload })
    : await window.billingApi.addProduct(payload);

  if (!result.success) {
    setMessage(productMessage, result.message || 'Failed to save product.', 'error');
    return;
  }

  productForm.reset();
  setMessage(productMessage, editingProductId ? 'Product updated.' : 'Product saved.', 'success');
  resetProductEditMode();
  await loadProducts();
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const result = await window.billingApi.updateProfile({
    profileName: profileName.value.trim(),
    profileEmail: profileEmail.value.trim(),
    profileGstin: profileGstin.value.trim(),
    profilePhone: profilePhone.value.trim(),
    profileState: profileState.value.trim(),
    profileStateCode: profileStateCode.value.trim(),
    profileAddress: profileAddress.value.trim(),
    profileBankName: profileBankName.value.trim(),
    profileAccountNo: profileAccountNo.value.trim(),
    profileBranchName: profileBranchName.value.trim(),
    profileIfsc: profileIfsc.value.trim(),
    profileDeclaration: profileDeclaration.value.trim(),
    profileSignatory: profileSignatory.value.trim()
  });

  if (!result.success) {
    setMessage(profileMessage, result.message || 'Unable to save profile.', 'error');
    return;
  }

  setMessage(profileMessage, 'Profile updated.', 'success');
});

taxForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const result = await window.billingApi.updateTax({
    defaultTaxRate: Number(defaultTaxRateEl.value || 0),
    invoicePrefix: invoicePrefixEl?.value || '',
    invoiceStartValue: Number(invoiceStartValueEl?.value || 1),
    compositionValidDays: Number(compositionValidDaysEl?.value || 30)
  });

  if (!result.success) {
    setMessage(taxMessage, result.message || 'Unable to save tax.', 'error');
    return;
  }

  defaultTaxRate = Number(defaultTaxRateEl.value || 0);
  invoiceStartValue = Number(invoiceStartValueEl?.value || 1);
  compositionValidDays = Number(compositionValidDaysEl?.value || 30);
  setMessage(taxMessage, 'Tax settings updated.', 'success');

  syncItemTaxFields();
  updateTotals();
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentUser) {
    setMessage(passwordMessage, 'Please login again.', 'error');
    return;
  }

  const nextPassword = newPassword.value;
  const confirm = confirmPassword.value;
  const newUsername = String(passwordUsername?.value || '').trim();

  if (!newUsername) {
    setMessage(passwordMessage, 'Username is required.', 'error');
    return;
  }

  const isPasswordChange = nextPassword.length > 0 || confirm.length > 0;
  if (isPasswordChange) {
    if (nextPassword.length < 6) {
      setMessage(passwordMessage, 'Password must be at least 6 characters.', 'error');
      return;
    }
    if (nextPassword !== confirm) {
      setMessage(passwordMessage, 'New password and confirm password must match.', 'error');
      return;
    }
  }

  const result = await window.billingApi.changePassword({
    userId: currentUser.id,
    newUsername,
    newPassword: isPasswordChange ? nextPassword : undefined
  });

  if (!result.success) {
    setMessage(passwordMessage, result.message || 'Unable to save login details.', 'error');
    return;
  }

  if (passwordUsername && currentUser) {
    currentUser.username = newUsername;
    try {
      localStorage.setItem('gstBillingCurrentUser', JSON.stringify({
        id: currentUser.id,
        username: currentUser.username
      }));
    } catch {
      // ignore storage errors
    }
  }

  passwordForm.reset();
  if (passwordUsername && currentUser) {
    passwordUsername.value = currentUser.username;
  }
  setMessage(
    passwordMessage,
    isPasswordChange ? 'Username and password updated successfully.' : 'Username updated successfully.',
    'success'
  );
});

billDateEl.value = new Date().toISOString().slice(0, 10);
populateStateDropdown(customerStateEl);
populateStateDropdown(custState);
populateStateDropdown(profileState);
updateTotals();

const persistedUser = await window.billingApi.restoreSession();
if (persistedUser) {
  currentUser = persistedUser;
  showApp(currentUser);
  showPage(getRoutePage(), { pushState: true });
  await bootstrapAppData();
  if (itemsList.children.length === 0) {
    addItemRow();
  }
} else {
  showLogin();
}

})();
