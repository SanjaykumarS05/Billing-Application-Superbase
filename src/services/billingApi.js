import { isSupabaseConfigured, supabase, supabaseTableName } from './supabase.js';

const REMOTE_STATE_ID = 'default';
const PASSWORD_SALT = 'gst-local-app-v2';
const ADMIN_USERNAME = 'admin';
const defaultSettings = {
  profileName: 'GST Application',
  profileEmail: 'company@example.com',
  profileGstin: '',
  profilePhone: '',
  profileState: '',
  profileStateCode: '',
  profileAddress: '',
  profileBankName: '',
  profileAccountNo: '',
  profileBranchName: '',
  profileIfsc: '',
  profileDeclaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  profileSignatory: 'Authorised Signatory',
  profileSignatureData: '',
  defaultTaxRate: 12,
  invoicePrefix: 'GST',
  invoiceStartValue: 1,
  compositionValidDays: 30,
  backupLastAt: ''
};

let stateCache = null;
let authStateCache = null;
let currentUser = null;
const SESSION_STORAGE_KEY = 'gstBillingCurrentUser';

function loadStoredUser() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id || !parsed.username) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredUser(user) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    if (!user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      id: user.id,
      username: user.username
    }));
  } catch {
    // Ignore storage failures.
  }
}

function clearStoredUser() {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

async function restoreSession() {
  const storedUser = loadStoredUser();
  if (!storedUser) {
    return null;
  }

  const authState = await loadAuthState();
  const user = authState.users.find((row) => Number(row.id) === Number(storedUser.id) && row.username === storedUser.username && row.active !== false);
  if (!user) {
    clearStoredUser();
    return null;
  }

  currentUser = publicUser(user);
  stateCache = null;
  await loadState();
  return currentUser;
}

async function logout() {
  currentUser = null;
  stateCache = null;
  clearStoredUser();
  return { success: true };
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotateRight(value, bits) {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256Fallback(bytes) {
  const data = Array.from(bytes);
  const bitLength = data.length * 8;
  data.push(0x80);
  while ((data.length % 64) !== 56) {
    data.push(0);
  }
  for (let shift = 56; shift >= 0; shift -= 8) {
    data.push(Math.floor(bitLength / (2 ** shift)) & 0xff);
  }

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const words = new Array(64);

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const position = offset + (index * 4);
      words[index] =
        ((data[position] << 24) | (data[position + 1] << 16) | (data[position + 2] << 8) | data[position + 3]) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return hash.map((value) => value.toString(16).padStart(8, '0')).join('');
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(`${password}:${PASSWORD_SALT}`);
  if (globalThis.crypto?.subtle) {
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(bytes);
}

async function defaultState() {
  return {
    users: [
      {
        id: 1,
        username: ADMIN_USERNAME,
        passwordHash: await hashPassword('admin123'),
        fullName: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      }
    ],
    customers: [],
    products: [],
    bills: [],
    payments: [],
    settings: { ...defaultSettings },
    counters: {
      users: 1,
      customers: 0,
      products: 0,
      bills: 0,
      payments: 0
    }
  };
}

async function emptyUserState(user) {
  return {
    users: [
      {
        id: Number(user?.id || 0),
        username: String(user?.username || '').trim(),
        passwordHash: String(user?.passwordHash || ''),
        fullName: String(user?.fullName || user?.username || '').trim(),
        email: String(user?.email || '').trim(),
        role: user.role || 'user',
        active: user.active !== false,
        createdAt: user.createdAt || new Date().toISOString()
      }
    ],
    customers: [],
    products: [],
    bills: [],
    payments: [],
    settings: { ...defaultSettings, profileEmail: String(user?.email || defaultSettings.profileEmail).trim() },
    counters: {
      users: 1,
      customers: 0,
      products: 0,
      bills: 0,
      payments: 0
    }
  };
}

function normalizeUser(user, index = 0) {
  const id = Number(user?.id || index + 1);
  const username = String(user?.username || '').trim();
  const isAdmin = username === ADMIN_USERNAME || user?.role === 'admin' || id === 1;
  return {
    id,
    username,
    passwordHash: String(user?.passwordHash || ''),
    fullName: String(user?.fullName || username || `User ${id}`).trim(),
    email: String(user?.email || '').trim(),
    role: isAdmin ? 'admin' : 'user',
    active: user?.active !== false,
    createdAt: user?.createdAt || ''
  };
}

function normalizeState(raw) {
  const users = Array.isArray(raw?.users) ? raw.users.map(normalizeUser).filter((user) => user.username) : [];
  const settings = { ...defaultSettings, ...(raw?.settings || {}) };
  return {
    users,
    customers: Array.isArray(raw?.customers) ? raw.customers : [],
    products: Array.isArray(raw?.products)
      ? raw.products.map((product) => ({ ...product, unit: normalizeUnit(product?.unit) }))
      : [],
    bills: Array.isArray(raw?.bills) ? raw.bills : [],
    payments: Array.isArray(raw?.payments) ? raw.payments : [],
    settings,
    counters: {
      users: Number(raw?.counters?.users || users.length || 1),
      customers: Number(raw?.counters?.customers || raw?.customers?.length || 0),
      products: Number(raw?.counters?.products || raw?.products?.length || 0),
      bills: Number(raw?.counters?.bills || raw?.bills?.length || 0),
      payments: Number(raw?.counters?.payments || raw?.payments?.length || 0)
    }
  };
}

async function ensureDefaultAdmin(state) {
  if (state.users.length > 0) {
    return false;
  }

  state.users.push({
    id: 1,
    username: ADMIN_USERNAME,
    passwordHash: await hashPassword('admin123'),
    fullName: 'Administrator',
    email: 'admin@example.com',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString()
  });
  state.counters.users = Math.max(Number(state.counters.users || 0), 1);
  return true;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role || 'user',
    active: user.active !== false,
    createdAt: user.createdAt || ''
  };
}

const UNIT_OPTIONS = ['Meter', 'Kgs', 'Pices'];

function normalizeUnit(value) {
  const unit = String(value || '').trim();
  return UNIT_OPTIONS.includes(unit) ? unit : 'Kgs';
}

function isAdminUser(user = currentUser) {
  return user?.role === 'admin' || user?.username === ADMIN_USERNAME;
}

function userDocId(user = currentUser) {
  return isAdminUser(user) ? REMOTE_STATE_ID : `user-${Number(user?.id || 0)}`;
}

function supabaseStorageError(error, stateId) {
  const message = String(error?.message || error || '');
  const networkLike = /fetch|network|failed to fetch|timeout|gateway|service unavailable|503|504|offline/i.test(message);
  const missingTable = /Could not find the table|does not exist|schema cache|relation .* does not exist/i.test(message);

  if (networkLike) {
    return new Error('Server storage is unavailable. Check your internet connection or contact the provider.');
  }

  if (missingTable) {
    return new Error('Server storage is not ready yet. Please contact the provider.');
  }

  return new Error('Server storage is unavailable. Check your internet connection or contact the provider.');
}

async function loadRemoteState(stateId) {
  const { data, error } = await supabase
    .from(supabaseTableName)
    .select('data')
    .eq('id', stateId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.data ? normalizeState(data.data) : null;
}

async function saveRemoteState(stateId, state) {
  const { error } = await supabase
    .from(supabaseTableName)
    .upsert({
      id: stateId,
      data: state,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}

async function loadAuthState() {
  if (authStateCache) {
    return authStateCache;
  }

  if (isSupabaseConfigured) {
    try {
      const serverState = await loadRemoteState(REMOTE_STATE_ID);
      if (serverState) {
        authStateCache = serverState;
        const repairedAdmin = await ensureDefaultAdmin(authStateCache);
        if (repairedAdmin) {
          await saveRemoteState(REMOTE_STATE_ID, authStateCache);
        }
        return authStateCache;
      }
      authStateCache = await defaultState();
      await ensureDefaultAdmin(authStateCache);
      await saveRemoteState(REMOTE_STATE_ID, authStateCache);
      return authStateCache;
    } catch (error) {
      throw supabaseStorageError(error, REMOTE_STATE_ID);
    }
  }

  throw new Error('Server storage is unavailable. Check your internet connection or contact the provider.');
}

async function loadState() {
  if (stateCache) {
    return stateCache;
  }

  const activeUser = currentUser || (await loadAuthState()).users.find((user) => user.username === ADMIN_USERNAME);
  if (!activeUser) {
    throw new Error('Please login again.');
  }

  if (isAdminUser(activeUser)) {
    stateCache = await loadAuthState();
    return stateCache;
  }

  if (isSupabaseConfigured) {
    try {
      const activeUserDocId = userDocId(activeUser);
      const serverState = await loadRemoteState(activeUserDocId);
      if (serverState) {
        stateCache = serverState;
        return stateCache;
      }
      stateCache = await emptyUserState(activeUser);
      await saveRemoteState(activeUserDocId, stateCache);
      return stateCache;
    } catch (error) {
      throw supabaseStorageError(error, userDocId(activeUser));
    }
  }

  throw new Error('Server storage is unavailable. Check your internet connection or contact the provider.');
}

async function saveState(nextState) {
  stateCache = normalizeState(nextState);
  if (isSupabaseConfigured) {
    try {
      await saveRemoteState(userDocId(), stateCache);
      if (isAdminUser()) {
        authStateCache = stateCache;
      }
    } catch (error) {
      throw supabaseStorageError(error, userDocId());
    }
  } else {
    throw new Error('Server storage is unavailable. Check your internet connection or contact the provider.');
  }
  return stateCache;
}

async function saveAuthState(nextAuthState) {
  authStateCache = normalizeState(nextAuthState);
  if (isSupabaseConfigured) {
    try {
      await saveRemoteState(REMOTE_STATE_ID, authStateCache);
      if (isAdminUser()) {
        stateCache = authStateCache;
      }
    } catch (error) {
      throw supabaseStorageError(error, REMOTE_STATE_ID);
    }
  } else {
    throw new Error('Server storage is unavailable. Check your internet connection or contact the provider.');
  }
  return authStateCache;
}

function nextId(state, key) {
  state.counters[key] = Number(state.counters[key] || 0) + 1;
  return state.counters[key];
}

function cleanInvoicePrefix(value) {
  return String(value || 'GST').trim().replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() || 'GST';
}

function getNextInvoiceNumber(state) {
  const prefix = cleanInvoicePrefix(state.settings.invoicePrefix);
  const startValue = Number.isInteger(Number(state.settings.invoiceStartValue)) && Number(state.settings.invoiceStartValue) > 0
    ? Number(state.settings.invoiceStartValue)
    : 1;
  const maxExistingValue = state.bills.reduce((maxValue, bill) => {
    const invoiceNo = String(bill.invoiceNo || '');
    if (!invoiceNo.startsWith(`${prefix}-`)) {
      return maxValue;
    }
    const suffix = invoiceNo.slice(prefix.length + 1);
    return /^\d+$/.test(suffix) ? Math.max(maxValue, Number(suffix)) : maxValue;
  }, 0);
  const nextValue = Math.max(startValue, maxExistingValue + 1);
  return `${prefix}-${String(nextValue).padStart(Math.max(3, String(nextValue).length), '0')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInvoiceCell(value, fallback = '&nbsp;') {
  const text = String(value ?? '').trim();
  return text ? escapeHtml(text) : fallback;
}

function formatInvoiceAddress(value) {
  const text = String(value ?? '').trim();
  return text ? escapeHtml(text).replace(/\n/g, '<br />') : '&nbsp;';
}

function formatInvoiceMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatInvoiceQty(value) {
  return Number(value || 0).toFixed(3);
}

function convertNumberToWords(number) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const belowHundred = (value) => {
    if (value < 10) {
      return ones[value];
    }
    if (value < 20) {
      return teens[value - 10];
    }
    const ten = Math.floor(value / 10);
    const unit = value % 10;
    return `${tens[ten]}${unit ? ` ${ones[unit]}` : ''}`;
  };

  const belowThousand = (value) => {
    if (value < 100) {
      return belowHundred(value);
    }
    const hundred = Math.floor(value / 100);
    const rest = value % 100;
    return `${ones[hundred]} Hundred${rest ? ` ${belowHundred(rest)}` : ''}`;
  };

  let remaining = Math.floor(Math.abs(Number(number) || 0));
  if (!remaining) {
    return 'Zero';
  }

  const parts = [];
  const units = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand']
  ];

  for (const [divisor, label] of units) {
    const chunk = Math.floor(remaining / divisor);
    if (chunk) {
      parts.push(`${belowThousand(chunk)} ${label}`);
      remaining %= divisor;
    }
  }

  if (remaining) {
    parts.push(belowThousand(remaining));
  }

  return parts.join(' ').trim();
}

function amountToWords(amount) {
  const value = Math.max(0, Number(amount || 0));
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);
  const rupeeWords = convertNumberToWords(rupees);

  if (!paise) {
    return `INR ${rupeeWords} Only`;
  }

  return `INR ${rupeeWords} and ${convertNumberToWords(paise)} Paise Only`;
}

function parseSignatureData(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      mode: ['text', 'draw', 'upload'].includes(parsed.mode) ? parsed.mode : 'text',
      name: String(parsed.name || '').trim(),
      style: ['script', 'classic', 'bold', 'italic'].includes(parsed.style) ? parsed.style : 'script',
      data: String(parsed.data || '').trim()
    };
  } catch {
    if (raw.startsWith('data:image/')) {
      return { mode: 'upload', name: '', style: 'script', data: raw };
    }
    return null;
  }
}

function safeSignatureStyle(value) {
  return ['script', 'classic', 'bold', 'italic'].includes(value) ? value : 'script';
}

function renderSignatureMarkup(signatureData, signatoryName = 'Authorised Signatory', options = {}) {
  const signature = parseSignatureData(signatureData);
  if (!signature) {
    return '';
  }

  const showCaption = options.showCaption !== false;
  const displayName = signature.name || String(signatoryName || '').trim() || 'Authorised Signatory';
  if (signature.mode === 'upload' || signature.mode === 'draw') {
    if (!signature.data) {
      return '';
    }
    return `
      <div class="signature-render signature-mode-image signature-footprint">
        <img src="${escapeHtml(signature.data)}" alt="Signature" />
        ${showCaption ? `<div class="signature-caption">${escapeHtml(displayName)}</div>` : ''}
      </div>
    `;
  }

  return `
    <div class="signature-render signature-mode-text signature-style-${safeSignatureStyle(signature.style)} signature-footprint">
      <div class="signature-text">${escapeHtml(displayName)}</div>
      ${showCaption ? `<div class="signature-caption">${escapeHtml(displayName)}</div>` : ''}
    </div>
  `;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function renderInvoicePage({
  companyName,
  companyGstin,
  companyState,
  companyStateCode,
  companyAddress,
  companyEmail,
  companyPhone,
  buyerGstin,
  buyerStateValue,
  buyerEmailValue,
  buyerPhoneValue,
  buyerAddress,
  bill,
  metaRowsHtml,
  itemRowsHtml,
  totalQty,
  totalUnitLabel,
  subtotal,
  totalTax,
  roundOff,
  amountWords,
  taxTableHead,
  taxTableRows,
  taxAmountWords,
  companyDeclaration,
  ownerSignatureMarkup,
  recipientSignatureMarkup,
  showFooter,
  pageIndex,
  totalPages
}) {
  const pageFooterHtml = showFooter
    ? `
        <table class="footer-grid">
          <tr>
            <td class="declaration-cell" colspan="2">
              <div class="footer-title">Declaration</div>
              <div>${companyDeclaration ? escapeHtml(companyDeclaration) : '&nbsp;'}</div>
            </td>
          </tr>
          <tr class="signature-head-row">
            <td style="width: 50%;">Authorised Signatory</td>
            <td style="width: 50%;">Recipient Signature</td>
          </tr>
          <tr>
            <td class="signature-cell">
              <div class="sign-block">
                ${ownerSignatureMarkup}
              </div>
            </td>
            <td class="signature-cell">
              <div class="sign-block">
                ${recipientSignatureMarkup}
              </div>
            </td>
          </tr>
        </table>
        <div class="footer-note">This is a Computer Generated Invoice</div>
      `
    : `
        <div class="page-continued">Continued on next page</div>
      `;

  return `
    <section class="invoice-page${showFooter ? ' is-final' : ''}">
      <table class="header-box">
        <tr>
          <th class="company-title" colspan="2">${escapeHtml(companyName)}</th>
        </tr>
        <tr>
          <th class="invoice-title" colspan="2">${bill.taxMode === 'composition' ? 'BILL OF SUPPLY' : 'TAX INVOICE'}</th>
        </tr>
        <tr>
          <td class="party-cell">
            <div class="company-name">${escapeHtml(companyName)}</div>
            <div><span class="b">GSTIN/UIN:</span> ${companyGstin ? escapeHtml(companyGstin) : '&nbsp;'}</div>
            <div><span class="b">State Name:</span> ${companyState ? escapeHtml(companyState) : '&nbsp;'}${companyStateCode ? `, Code: ${escapeHtml(companyStateCode)}` : ''}</div>
            <div><span class="b">Contact:</span> ${companyPhone ? escapeHtml(companyPhone) : '&nbsp;'}</div>
            <div><span class="b">E-Mail:</span> ${companyEmail ? escapeHtml(companyEmail) : '&nbsp;'}</div>
            <div>${companyAddress}</div>
          </td>
          <td class="party-cell buyer-cell">
            <div class="party-title">Buyer (Bill to)</div>
            <div><span class="b">Name:</span> ${formatInvoiceCell(bill.customerName)}</div>
            <div><span class="b">GSTIN/UIN:</span> ${buyerGstin}</div>
            <div><span class="b">State Name:</span> ${buyerStateValue}</div>
            <div><span class="b">Contact:</span> ${buyerPhoneValue}</div>
            <div><span class="b">E-Mail:</span> ${buyerEmailValue}</div>
            <div>${buyerAddress}</div>
          </td>
        </tr>
        <tr>
          <td class="meta-section" colspan="2">
            <table class="meta-table">
              ${metaRowsHtml}
            </table>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th class="sl">Sl No</th>
            <th class="desc">Description of Goods</th>
            <th class="hsn">HSN/SAC</th>
            <th class="qty">Quantity</th>
            <th class="rate">Rate</th>
            <th class="per">per</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
          ${showFooter ? `
            <tr class="summary-row">
              <td class="r" colspan="3">Total</td>
              <td class="r">${formatInvoiceQty(totalQty)}</td>
              <td></td>
              <td class="c">${totalUnitLabel}</td>
              <td class="r">${formatInvoiceMoney(subtotal)}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      ${showFooter ? `
        <table class="totals-table">
          <tr>
            <td class="label">CGST</td>
            <td class="value">${formatInvoiceMoney(bill.cgst)}</td>
          </tr>
          <tr>
            <td class="label">SGST</td>
            <td class="value">${formatInvoiceMoney(bill.sgst)}</td>
          </tr>
          <tr>
            <td class="label">IGST</td>
            <td class="value">${formatInvoiceMoney(bill.igst)}</td>
          </tr>
          <tr>
            <td class="label">Round Off</td>
            <td class="value">${formatInvoiceMoney(roundOff)}</td>
          </tr>
          <tr>
            <td class="label b">Grand Total</td>
            <td class="value b">${formatInvoiceMoney(bill.total)}</td>
          </tr>
        </table>

        <table class="words-row">
          <tr>
            <td class="words-label">Amount Chargeable (in words)</td>
            <td class="words-value">${amountWords}</td>
          </tr>
        </table>

        <table class="tax-table">
          ${taxTableHead}
          ${taxTableRows}
        </table>

        <table class="words-row">
          <tr>
            <td class="words-label">Tax Amount (in words)</td>
            <td class="words-value">${taxAmountWords}</td>
          </tr>
        </table>
      ` : ''}

      ${pageFooterHtml}
      <div class="page-number">Page ${pageIndex} of ${totalPages}</div>
    </section>
  `;
}

function buildTaxBreakdown(items, taxMode) {
  const summary = new Map();

  items.forEach((item) => {
    const taxRate = Number(item.taxRate || 0);
    const taxableValue = Number(item.taxableValue || 0);
    const taxAmount = Number(item.taxAmount || 0);
    const key = taxRate.toFixed(2);
    const row = summary.get(key) || {
      taxRate,
      taxableValue: 0,
      taxAmount: 0
    };

    row.taxableValue = Number((row.taxableValue + taxableValue).toFixed(2));
    row.taxAmount = Number((row.taxAmount + taxAmount).toFixed(2));
    summary.set(key, row);
  });

  const rows = [...summary.values()];
  rows.sort((a, b) => a.taxRate - b.taxRate);
  return rows.length > 0 ? rows : [{ taxRate: 0, taxableValue: 0, taxAmount: 0 }];
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadTextFile(fileName, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return fileName;
}

function safeFileName(value, fallback) {
  return String(value || fallback || 'document').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function openPrintablePdf(html, title = 'Document') {
  let frame = document.getElementById('printFrame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'printFrame';
    frame.title = 'Print document';
    frame.style.position = 'fixed';
    frame.style.left = '-10000px';
    frame.style.top = '0';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.border = '0';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    document.body.appendChild(frame);
  }
  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument || frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    return { success: false, message: 'Unable to prepare print page.' };
  }
  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  frameDocument.title = title;
  setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
  }, 200);
  return { success: true };
}

function paymentTotalsForBill(state, billId) {
  const paidAmount = state.payments
    .filter((payment) => Number(payment.billId) === Number(billId))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const bill = state.bills.find((row) => Number(row.id) === Number(billId));
  const total = Number(bill?.total || 0);
  const dueAmount = Number(Math.max(total - paidAmount, 0).toFixed(2));
  return {
    paidAmount: Number(paidAmount.toFixed(2)),
    dueAmount,
    paymentStatus: dueAmount <= 0 && total > 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid'
  };
}

function renderInvoiceHtml(data) {
  const { bill, items, profile } = data;
  const companyName = String(profile.name || 'GST Application').trim() || 'GST Application';
  const companyGstin = String(profile.gstin || '').trim();
  const companyState = String(profile.state || '').trim();
  const companyStateCode = String(profile.stateCode || '').trim();
  const companyAddress = formatInvoiceAddress(profile.address);
  const companyEmail = String(profile.email || '').trim();
  const companyPhone = String(profile.phone || '').trim();
  const companyBankName = String(profile.bankName || '').trim();
  const companyAccountNo = String(profile.accountNo || '').trim();
  const companyBranchName = String(profile.branchName || '').trim();
  const companyIfsc = String(profile.ifsc || '').trim();
  const companyDeclaration = String(profile.declaration || '').trim();
  const companySignatory = String(profile.signatory || '').trim() || 'Authorised Signatory';
  const companySignatureData = String(profile.signatureData || '').trim();
  const recipientSignatureData = String(bill.recipientSignatureData || '').trim();
  const buyerStateValue = bill.customerState ? escapeHtml(String(bill.customerState).trim()) : '&nbsp;';
  const buyerEmailValue = bill.customerEmail ? escapeHtml(String(bill.customerEmail).trim()) : '&nbsp;';
  const buyerPhoneValue = bill.customerPhone ? escapeHtml(String(bill.customerPhone).trim()) : '&nbsp;';
  const buyerGstin = bill.customerGstin ? escapeHtml(String(bill.customerGstin).trim()) : '&nbsp;';
  const buyerAddress = formatInvoiceAddress(bill.customerAddress);
  const totalQty = Number(items.reduce((sum, item) => sum + Number(item.quantity || 0), 0).toFixed(3));
  const unitNames = [...new Set(items.map((item) => String(item.unit || '').trim()).filter(Boolean))];
  const totalUnitLabel = unitNames.length === 1 ? escapeHtml(unitNames[0]) : 'Mixed';
  const subtotal = Number(bill.subtotal || 0);
  const totalTax = Number((Number(bill.cgst || 0) + Number(bill.sgst || 0) + Number(bill.igst || 0)).toFixed(2));
  const roundOff = Number((Number(bill.total || 0) - subtotal - totalTax).toFixed(2));
  const taxBreakdownRows = buildTaxBreakdown(items, bill.taxMode);
  const ownerSignatureMarkup = renderSignatureMarkup(companySignatureData, companySignatory, { showCaption: false });
  const recipientSignatureMarkup = renderSignatureMarkup(recipientSignatureData, 'Recipient Signature', { showCaption: false });
  const itemRows = items.map((item, index) => `
    <tr>
      <td class="c">${index + 1}</td>
      <td>${formatInvoiceCell(item.description)}</td>
      <td class="c">${formatInvoiceCell(item.hsnSac)}</td>
      <td class="r">${formatInvoiceQty(item.quantity)}</td>
      <td class="r">${formatInvoiceMoney(item.rate)}</td>
      <td class="c">${formatInvoiceCell(item.unit || 'Nos')}</td>
      <td class="r">${formatInvoiceMoney(item.lineTotal)}</td>
    </tr>
  `).join('');
  const taxTableHead = bill.taxMode === 'inter'
    ? `
      <tr>
        <th>Taxable Value</th>
        <th>IGST Rate</th>
        <th>IGST Amount</th>
        <th>Total Tax Amount</th>
      </tr>
    `
    : `
      <tr>
        <th>Taxable Value</th>
        <th>CGST Rate</th>
        <th>CGST Amount</th>
        <th>SGST/UTGST Rate</th>
        <th>SGST/UTGST Amount</th>
        <th>Total Tax Amount</th>
      </tr>
    `;
  const taxTableRows = taxBreakdownRows.map((row) => bill.taxMode === 'inter'
    ? `
      <tr>
        <td class="r">${formatInvoiceMoney(row.taxableValue)}</td>
        <td class="r">${formatInvoiceMoney(row.taxRate)}%</td>
        <td class="r">${formatInvoiceMoney(row.taxAmount)}</td>
        <td class="r">${formatInvoiceMoney(row.taxAmount)}</td>
      </tr>
    `
    : `
      <tr>
        <td class="r">${formatInvoiceMoney(row.taxableValue)}</td>
        <td class="r">${formatInvoiceMoney(row.taxRate / 2)}%</td>
        <td class="r">${formatInvoiceMoney(row.taxAmount / 2)}</td>
        <td class="r">${formatInvoiceMoney(row.taxRate / 2)}%</td>
        <td class="r">${formatInvoiceMoney(row.taxAmount / 2)}</td>
        <td class="r">${formatInvoiceMoney(row.taxAmount)}</td>
      </tr>
    `
  ).join('');
  const taxAmountWords = amountToWords(totalTax);
  const amountWords = amountToWords(bill.total);
  const metaRowsHtml = `
    <tr>
      <td class="meta-label">Invoice No.</td>
      <td class="meta-value">${formatInvoiceCell(bill.invoiceNo)}</td>
      <td class="meta-label">Dated</td>
      <td class="meta-value">${formatInvoiceCell(bill.billDate)}</td>
    </tr>
    <tr>
      <td class="meta-label">e-Way Bill No.</td>
      <td class="meta-value">${formatInvoiceCell(bill.eWayBillNo)}</td>
      <td class="meta-label">Delivery Note</td>
      <td class="meta-value">${formatInvoiceCell(bill.deliveryNote)}</td>
    </tr>
    <tr>
      <td class="meta-label">Reference No. &amp; Date</td>
      <td class="meta-value">${formatInvoiceCell(bill.referenceNoDate)}</td>
      <td class="meta-label">Other References</td>
      <td class="meta-value">${formatInvoiceCell(bill.otherReferences)}</td>
    </tr>
    <tr>
      <td class="meta-label">Buyer's Order No.</td>
      <td class="meta-value">${formatInvoiceCell(bill.buyersOrderNo)}</td>
      <td class="meta-label">Dated</td>
      <td class="meta-value">${formatInvoiceCell(bill.buyersOrderDate)}</td>
    </tr>
    <tr>
      <td class="meta-label">Dispatch Doc No.</td>
      <td class="meta-value">${formatInvoiceCell(bill.dispatchDocNo)}</td>
      <td class="meta-label">Delivery Note Date</td>
      <td class="meta-value">${formatInvoiceCell(bill.deliveryNoteDate)}</td>
    </tr>
    <tr>
      <td class="meta-label">Dispatched through</td>
      <td class="meta-value">${formatInvoiceCell(bill.dispatchedThrough)}</td>
      <td class="meta-label">Destination</td>
      <td class="meta-value">${formatInvoiceCell(bill.destination)}</td>
    </tr>
    <tr>
      <td class="meta-label">Terms of Delivery</td>
      <td class="meta-value" colspan="3">${formatInvoiceCell(bill.termsOfDelivery)}</td>
    </tr>
  `;

  const itemPages = chunkArray(items, 7);
  const pageCount = itemPages.length;
  const pagesHtml = itemPages.map((pageItems, index) => {
    const startIndex = index * 7;
    const pageRows = pageItems.map((item, itemIndex) => `
      <tr>
        <td class="c">${startIndex + itemIndex + 1}</td>
        <td>${formatInvoiceCell(item.description)}</td>
        <td class="c">${formatInvoiceCell(item.hsnSac)}</td>
        <td class="r">${formatInvoiceQty(item.quantity)}</td>
        <td class="r">${formatInvoiceMoney(item.rate)}</td>
        <td class="c">${formatInvoiceCell(item.unit || 'Nos')}</td>
        <td class="r">${formatInvoiceMoney(item.lineTotal)}</td>
      </tr>
    `).join('');

    return renderInvoicePage({
      companyName,
      companyGstin,
      companyState,
      companyStateCode,
      companyAddress,
      companyEmail,
      companyPhone,
      buyerGstin,
      buyerStateValue,
      buyerEmailValue,
      buyerPhoneValue,
      buyerAddress,
      bill,
      metaRowsHtml,
      itemRowsHtml: pageRows,
      totalQty,
      totalUnitLabel,
      subtotal,
      totalTax,
      roundOff,
      amountWords,
      taxTableHead,
      taxTableRows,
      taxAmountWords,
      companyDeclaration,
      ownerSignatureMarkup,
      recipientSignatureMarkup,
      showFooter: index === pageCount - 1,
      pageIndex: index + 1,
      totalPages: pageCount
    });
  }).join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          background: #fff;
          font-size: 8.6px;
          line-height: 1.18;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        th,
        td {
          border: 1px solid #111;
          padding: 4px 5px;
          vertical-align: top;
        }

        .invoice-page {
          width: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          break-after: page;
        }

        .invoice-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .invoice-title {
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.3px;
          padding: 2px 4px;
        }

        .company-title {
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          padding: 3px 4px;
        }

        .header-box td,
        .header-box th {
          font-size: 9px;
        }

        .header-box .party-cell {
          width: 50%;
          min-height: 122px;
          padding: 5px 6px;
        }

        .buyer-cell {
          width: 50%;
          min-height: 118px;
          padding: 5px 6px;
        }

        .company-name {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .meta-table td {
          padding: 2px 4px;
        }

        .meta-section td {
          padding: 0;
        }

        .meta-section .meta-table {
          width: 100%;
        }

        .meta-label {
          width: 20%;
          font-weight: 700;
        }

        .meta-value {
          width: 30%;
        }

        .party-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .items-table th {
          font-weight: 700;
          text-align: center;
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .items-table .sl {
          width: 4%;
        }

        .items-table .desc {
          width: 37%;
        }

        .items-table .hsn {
          width: 12%;
        }

        .items-table .qty {
          width: 11%;
        }

        .items-table .rate {
          width: 11%;
        }

        .items-table .per {
          width: 9%;
        }

        .items-table .amount {
          width: 16%;
        }

        .c {
          text-align: center;
        }

        .r {
          text-align: right;
        }

        .b {
          font-weight: 700;
        }

        .summary-row td {
          font-weight: 700;
        }

        .totals-table td {
          padding: 4px 5px;
        }

        .totals-table .label {
          width: 86%;
          font-weight: 700;
          text-align: right;
        }

        .totals-table .value {
          width: 14%;
          text-align: right;
        }

        .words-row td {
          padding: 4px 5px;
        }

        .words-label {
          width: 30%;
          font-weight: 700;
        }

        .words-value {
          width: 70%;
        }

        .tax-table th {
          text-align: center;
          font-weight: 700;
        }

        .footer-grid td {
          vertical-align: top;
          padding: 6px 6px 5px 6px;
        }

        .declaration-cell {
          padding-bottom: 6px;
        }

        .signature-head-row td {
          padding: 2px 6px 0 6px;
          font-weight: 700;
          text-align: left;
        }

        .signature-cell {
          height: 70px;
          vertical-align: middle;
          padding-top: 0;
        }

        .footer-title {
          font-weight: 700;
          margin-bottom: 2px;
        }

        .footer-note {
          text-align: center;
          font-size: 8px;
          padding: 2px 5px;
          margin-top: auto;
        }

        .page-number {
          text-align: right;
          font-size: 8px;
          padding: 0 3px 2px 3px;
        }

        .sign-block {
          min-height: 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          white-space: pre-line;
          margin-top: 0;
        }

        .signature-footprint {
          width: 68px;
          max-width: 68px;
          align-self: center;
        }

        .signature-footprint img {
          display: block;
          width: 100%;
          max-width: 68px;
          max-height: 20px;
          object-fit: contain;
          margin: 0 auto 1px auto;
        }

        .signature-footprint.signature-mode-text .signature-text {
          font-size: 0.68rem;
          line-height: 1.05;
        }

        .signature-footprint .signature-caption {
          font-size: 0.58rem;
          line-height: 1;
        }

        .page-continued {
          text-align: right;
          font-size: 8px;
          padding: 2px 3px 0 3px;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
  </html>`;
}

function renderPaymentReceiptHtml(data) {
  const { payment, bill, profile } = data;
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #111; margin: 28px; font-size: 12px; }
        .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
        .box { border: 1px solid #111; padding: 10px; min-height: 84px; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        th, td { border: 1px solid #111; padding: 7px; text-align: left; }
        th { background: #eee; width: 34%; }
        .amount { font-size: 16px; font-weight: 700; }
        .sign { margin-top: 54px; text-align: right; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="title">PAYMENT RECEIPT</div>
      <div class="grid">
        <div class="box">
          <strong>${escapeHtml(profile.name)}</strong><br />
          GSTIN: ${escapeHtml(profile.gstin)}<br />
          ${escapeHtml(profile.address).replace(/\n/g, '<br />')}<br />
          Phone: ${escapeHtml(profile.phone)}<br />
          Email: ${escapeHtml(profile.email)}
        </div>
        <div class="box">
          <strong>Receipt No:</strong> ${escapeHtml(payment.receiptNo)}<br />
          <strong>Payment Date:</strong> ${escapeHtml(payment.paymentDate)}<br />
          <strong>Invoice No:</strong> ${escapeHtml(bill.invoiceNo)}<br />
          <strong>Invoice Date:</strong> ${escapeHtml(bill.billDate)}
        </div>
      </div>
      <div class="box">
        <strong>Received From:</strong> ${escapeHtml(bill.customerName)}<br />
        GSTIN: ${escapeHtml(bill.customerGstin || '')}<br />
        Phone: ${escapeHtml(bill.customerPhone || '')}<br />
        ${escapeHtml(bill.customerAddress || '').replace(/\n/g, '<br />')}
      </div>
      <table>
        <tr><th>Amount Received</th><td class="amount">${Number(payment.amount || 0).toFixed(2)}</td></tr>
        <tr><th>Payment Method</th><td>${escapeHtml(payment.method)}</td></tr>
        <tr><th>Reference No</th><td>${escapeHtml(payment.referenceNo || '-')}</td></tr>
        <tr><th>Invoice Total</th><td>${Number(bill.total || 0).toFixed(2)}</td></tr>
        <tr><th>Total Paid</th><td>${Number(data.paidAmount || 0).toFixed(2)}</td></tr>
        <tr><th>Balance Due</th><td>${Number(data.dueAmount || 0).toFixed(2)}</td></tr>
        <tr><th>Notes</th><td>${escapeHtml(payment.notes || '-')}</td></tr>
      </table>
      <div class="sign">For ${escapeHtml(profile.name)}<br /><br />${escapeHtml(profile.signatory)}</div>
    </body>
  </html>`;
}

async function getInvoiceData(billId) {
  const state = await loadState();
  const bill = state.bills.find((row) => Number(row.id) === Number(billId));
  if (!bill) {
    return null;
  }
  const latestCustomer = state.customers.find((customer) => customer.customerName?.toLowerCase() === bill.customerName?.toLowerCase());
  return {
    bill: {
      ...bill,
      customerGstin: bill.customerGstin || latestCustomer?.gstin || '',
      customerState: bill.customerState || latestCustomer?.state || '',
      customerPhone: bill.customerPhone || latestCustomer?.phone || '',
      customerEmail: bill.customerEmail || latestCustomer?.email || '',
      customerAddress: bill.customerAddress || latestCustomer?.address || ''
    },
    items: bill.items || [],
    profile: {
      name: state.settings.profileName,
      email: state.settings.profileEmail,
      gstin: state.settings.profileGstin,
      phone: state.settings.profilePhone,
      state: state.settings.profileState,
      stateCode: state.settings.profileStateCode,
      address: state.settings.profileAddress,
      bankName: state.settings.profileBankName,
      accountNo: state.settings.profileAccountNo,
      branchName: state.settings.profileBranchName,
      ifsc: state.settings.profileIfsc,
      declaration: state.settings.profileDeclaration,
      signatory: state.settings.profileSignatory,
      signatureData: state.settings.profileSignatureData,
      compositionValidDays: state.settings.compositionValidDays
    }
  };
}

async function getPaymentReceiptData(paymentId) {
  const state = await loadState();
  const payment = state.payments.find((row) => Number(row.id) === Number(paymentId));
  if (!payment) {
    return null;
  }
  const bill = state.bills.find((row) => Number(row.id) === Number(payment.billId));
  if (!bill) {
    return null;
  }
  const totals = paymentTotalsForBill(state, bill.id);
  return {
    payment,
    bill,
    ...totals,
    profile: {
      name: state.settings.profileName,
      email: state.settings.profileEmail,
      gstin: state.settings.profileGstin,
      phone: state.settings.profilePhone,
      address: state.settings.profileAddress,
      signatory: state.settings.profileSignatory
    }
  };
}

export const billingApi = {
  async loadPageTemplate(fileName) {
    const safeName = String(fileName || '').split('/').pop();
    if (!safeName.endsWith('.html')) {
      return { success: false, message: 'Invalid template file.' };
    }
    try {
      const response = await fetch(`/pages/${safeName}`);
      if (!response.ok) {
        throw new Error(`Unable to load ${safeName}`);
      }
      return { success: true, content: await response.text() };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async login(payload) {
    const state = await loadAuthState();
    const username = String(payload?.username || '').trim();
    const password = String(payload?.password || '');
    const user = state.users.find((row) => row.username === username);
    if (!user || user.passwordHash !== await hashPassword(password)) {
      return { success: false, message: 'Invalid credentials.' };
    }
    if (user.active === false) {
      return { success: false, message: 'User deactive. Contact admin.' };
    }
    currentUser = publicUser(user);
    saveStoredUser(currentUser);
    stateCache = null;
    await loadState();
    return { success: true, user: currentUser };
  },

  async restoreSession() {
    return restoreSession();
  },

  async logout() {
    return logout();
  },

  async changePassword(payload) {
    const state = await loadAuthState();
    const user = state.users.find((row) => Number(row.id) === Number(payload?.userId));
    const newUsername = String(payload?.newUsername || '').trim();
    const newPassword = String(payload?.newPassword || '');
    if (!currentUser || Number(currentUser.id) !== Number(payload?.userId)) {
      return { success: false, message: 'Please login again.' };
    }
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    if (!newUsername) {
      return { success: false, message: 'Username is required.' };
    }
    if (state.users.some((row) => row.username.toLowerCase() === newUsername.toLowerCase() && Number(row.id) !== Number(user.id))) {
      return { success: false, message: 'Username is already in use.' };
    }
    user.username = newUsername;
    if (newPassword.length > 0) {
      user.passwordHash = await hashPassword(newPassword);
    }
    await saveAuthState(state);
    if (stateCache?.users) {
      const localUser = stateCache.users.find((row) => Number(row.id) === Number(user.id));
      if (localUser) {
        localUser.username = user.username;
        localUser.passwordHash = user.passwordHash;
        await saveState(stateCache);
      }
    }
    return { success: true };
  },

  async listUsers() {
    if (!isAdminUser()) {
      return { success: false, message: 'Only admin can manage users.' };
    }
    const state = await loadAuthState();
    return { success: true, users: state.users.map(publicUser).sort((a, b) => a.id - b.id) };
  },

  async addUser(payload) {
    if (!isAdminUser()) {
      return { success: false, message: 'Only admin can add users.' };
    }
    const state = await loadAuthState();
    const username = String(payload?.username || '').trim();
    const password = String(payload?.password || '');
    const email = String(payload?.email || '').trim();
    if (!username || password.length < 6 || !email) {
      return { success: false, message: 'Username, email and 6 character password are required.' };
    }
    if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Username already exists.' };
    }
    const nextUserId = nextId(state, 'users');
    const user = {
      id: nextUserId,
      username,
      passwordHash: await hashPassword(password),
      fullName: username,
      email,
      role: 'user',
      active: true,
      createdAt: new Date().toISOString()
    };
    state.users.push(user);
    await saveAuthState(state);
    if (isSupabaseConfigured) {
      try {
        await saveRemoteState(userDocId(user), await emptyUserState(user));
      } catch (error) {
        return {
          success: true,
          user: publicUser(user),
          message: 'User added, but server storage is unavailable. Check your internet connection or contact the provider.'
        };
      }
    }
    return { success: true, user: publicUser(user) };
  },

  async updateUser(payload) {
    if (!isAdminUser()) {
      return { success: false, message: 'Only admin can update users.' };
    }
    const state = await loadAuthState();
    const userId = Number(payload?.userId);
    const username = String(payload?.username || '').trim();
    const password = String(payload?.password || '');
    const email = String(payload?.email || '').trim();
    const user = state.users.find((row) => Number(row.id) === userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    if (!username || !email) {
      return { success: false, message: 'Username and email are required.' };
    }
    if (password.length > 0 && password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    if (state.users.some((row) => row.username.toLowerCase() === username.toLowerCase() && Number(row.id) !== Number(user.id))) {
      return { success: false, message: 'Username already exists.' };
    }

    user.username = username;
    user.email = email;
    user.fullName = username;
    if (password.length > 0) {
      user.passwordHash = await hashPassword(password);
    }

    await saveAuthState(state);
    if (currentUser && Number(currentUser.id) === Number(user.id)) {
      currentUser = publicUser(user);
      saveStoredUser(currentUser);
    }
    return { success: true, user: publicUser(user) };
  },

  async setUserActive(payload) {
    if (!isAdminUser()) {
      return { success: false, message: 'Only admin can update users.' };
    }
    const userId = Number(payload?.userId);
    const active = Boolean(payload?.active);
    if (userId === 1 || userId === Number(currentUser?.id)) {
      return { success: false, message: 'Admin user cannot be deactivated.' };
    }
    const state = await loadAuthState();
    const user = state.users.find((row) => Number(row.id) === userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    user.active = active;
    await saveAuthState(state);
    return { success: true, user: publicUser(user) };
  },

  async addCustomer(payload) {
    const state = await loadState();
    const customerName = String(payload?.customerName || '').trim();
    if (!customerName) {
      return { success: false, message: 'Customer name is required.' };
    }
    state.customers.unshift({
      id: nextId(state, 'customers'),
      customerName,
      gstin: String(payload?.gstin || '').trim(),
      state: String(payload?.state || '').trim(),
      phone: String(payload?.phone || '').trim(),
      email: String(payload?.email || '').trim(),
      address: String(payload?.address || '').trim()
    });
    await saveState(state);
    return { success: true };
  },

  async updateCustomer(payload) {
    const state = await loadState();
    const customer = state.customers.find((row) => Number(row.id) === Number(payload?.customerId));
    const customerName = String(payload?.customerName || '').trim();
    if (!customer || !customerName) {
      return { success: false, message: 'Valid customer id and name are required.' };
    }
    Object.assign(customer, {
      customerName,
      gstin: String(payload?.gstin || '').trim(),
      state: String(payload?.state || '').trim(),
      phone: String(payload?.phone || '').trim(),
      email: String(payload?.email || '').trim(),
      address: String(payload?.address || '').trim()
    });
    await saveState(state);
    return { success: true };
  },

  async listCustomers() {
    const state = await loadState();
    return { success: true, customers: [...state.customers].sort((a, b) => b.id - a.id) };
  },

  async addProduct(payload) {
    const state = await loadState();
    const productName = String(payload?.productName || '').trim();
    const rate = Number(payload?.rate || 0);
    if (!productName || rate < 0) {
      return { success: false, message: 'Valid product name and rate are required.' };
    }
    state.products.unshift({
      id: nextId(state, 'products'),
      productName,
      hsnSac: String(payload?.hsnSac || '').trim(),
      unit: normalizeUnit(payload?.unit),
      rate
    });
    await saveState(state);
    return { success: true };
  },

  async updateProduct(payload) {
    const state = await loadState();
    const product = state.products.find((row) => Number(row.id) === Number(payload?.productId));
    const productName = String(payload?.productName || '').trim();
    const rate = Number(payload?.rate || 0);
    if (!product || !productName || rate < 0) {
      return { success: false, message: 'Valid product id, name and rate are required.' };
    }
    Object.assign(product, {
      productName,
      hsnSac: String(payload?.hsnSac || '').trim(),
      unit: normalizeUnit(payload?.unit),
      rate
    });
    await saveState(state);
    return { success: true };
  },

  async listProducts() {
    const state = await loadState();
    return { success: true, products: [...state.products].sort((a, b) => b.id - a.id) };
  },

  async getSettings() {
    const state = await loadState();
    return { success: true, settings: { ...defaultSettings, ...state.settings } };
  },

  async updateProfile(payload) {
    const state = await loadState();
    const profileName = String(payload?.profileName || '').trim();
    const profileEmail = String(payload?.profileEmail || '').trim();
    if (!profileEmail) {
      return { success: false, message: 'Email is required.' };
    }
    Object.assign(state.settings, {
      profileName,
      profileEmail,
      profileGstin: String(payload?.profileGstin || '').trim(),
      profilePhone: String(payload?.profilePhone || '').trim(),
      profileState: String(payload?.profileState || '').trim(),
      profileStateCode: String(payload?.profileStateCode || '').trim(),
      profileAddress: String(payload?.profileAddress || '').trim(),
      profileBankName: String(payload?.profileBankName || '').trim(),
      profileAccountNo: String(payload?.profileAccountNo || '').trim(),
      profileBranchName: String(payload?.profileBranchName || '').trim(),
      profileIfsc: String(payload?.profileIfsc || '').trim(),
      profileDeclaration: String(payload?.profileDeclaration || '').trim(),
      profileSignatory: String(payload?.profileSignatory || '').trim(),
      profileSignatureData: String(payload?.profileSignatureData || '').trim()
    });
    await saveState(state);
    return { success: true };
  },

  async updateTax(payload) {
    const state = await loadState();
    const defaultTaxRate = Number(payload?.defaultTaxRate || 0);
    const invoicePrefix = cleanInvoicePrefix(payload?.invoicePrefix);
    const invoiceStartValue = Number(payload?.invoiceStartValue || 0);
    const compositionValidDays = Number(payload?.compositionValidDays || 0);
    if (!Number.isFinite(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 50) {
      return { success: false, message: 'Default tax must be between 0 and 50.' };
    }
    if (!Number.isInteger(invoiceStartValue) || invoiceStartValue < 1) {
      return { success: false, message: 'Invoice start value must be 1 or more.' };
    }
    if (!Number.isInteger(compositionValidDays) || compositionValidDays < 1 || compositionValidDays > 3650) {
      return { success: false, message: 'Composition valid days must be between 1 and 3650.' };
    }
    Object.assign(state.settings, { defaultTaxRate, invoicePrefix, invoiceStartValue, compositionValidDays });
    await saveState(state);
    return { success: true };
  },

  async createBackup() {
    const state = await loadState();
    state.settings.backupLastAt = new Date().toISOString();
    await saveState(state);
    const fileName = `gst_billing_backup_${state.settings.backupLastAt.replace(/[-:.]/g, '').slice(0, 15)}.json`;
    downloadTextFile(fileName, JSON.stringify(state, null, 2), 'application/json;charset=utf-8');
    return {
      success: true,
      backupPath: fileName,
      backupZipPath: fileName,
      backupLastAt: state.settings.backupLastAt,
      mailSent: false,
      mailMessage: 'Web backup downloaded in the browser.'
    };
  },

  async createBill(payload) {
    const state = await loadState();
    const customerName = String(payload?.customerName || '').trim();
    const billDate = String(payload?.billDate || '').trim();
    const createdBy = Number(currentUser?.id || payload?.createdBy || 0);
    const sourceItems = Array.isArray(payload?.items) ? payload.items : [];
    if (!customerName || !billDate || !createdBy || sourceItems.length === 0) {
      return { success: false, message: 'Customer, date, and at least one item are required.' };
    }
    const taxMode = ['inter', 'none', 'composition'].includes(payload?.taxMode) ? payload.taxMode : 'intra';
    const items = sourceItems.map((item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const taxRate = Number(item.taxRate || 0);
      const taxableValue = Number((quantity * rate).toFixed(2));
      const taxAmount = taxMode === 'none' || taxMode === 'composition' ? 0 : Number(((taxableValue * taxRate) / 100).toFixed(2));
      return {
        description: String(item.description || '').trim(),
        hsnSac: String(item.hsnSac || '').trim(),
        unit: normalizeUnit(item.unit),
        quantity,
        rate,
        taxRate,
        taxableValue,
        taxAmount,
        lineTotal: Number((taxableValue + taxAmount).toFixed(2))
      };
    }).filter((item) => item.description && item.quantity > 0 && item.rate >= 0);
    if (items.length === 0) {
      return { success: false, message: 'Valid line items are required.' };
    }
    const subtotal = Number(items.reduce((sum, item) => sum + item.taxableValue, 0).toFixed(2));
    const totalTax = Number(items.reduce((sum, item) => sum + item.taxAmount, 0).toFixed(2));
    const bill = {
      id: nextId(state, 'bills'),
      invoiceNo: getNextInvoiceNumber(state),
      customerName,
      customerGstin: String(payload?.customerGstin || '').trim(),
      customerState: String(payload?.customerState || '').trim(),
      customerPhone: String(payload?.customerPhone || '').trim(),
      customerEmail: String(payload?.customerEmail || '').trim(),
      customerAddress: String(payload?.customerAddress || '').trim(),
      eWayBillNo: String(payload?.eWayBillNo || '').trim(),
      deliveryNote: String(payload?.deliveryNote || '').trim(),
      referenceNoDate: String(payload?.referenceNoDate || '').trim(),
      otherReferences: String(payload?.otherReferences || '').trim(),
      buyersOrderNo: String(payload?.buyersOrderNo || '').trim(),
      buyersOrderDate: String(payload?.buyersOrderDate || '').trim(),
      dispatchDocNo: String(payload?.dispatchDocNo || '').trim(),
      deliveryNoteDate: String(payload?.deliveryNoteDate || '').trim(),
      dispatchedThrough: String(payload?.dispatchedThrough || '').trim(),
      destination: String(payload?.destination || '').trim(),
      termsOfDelivery: String(payload?.termsOfDelivery || '').trim(),
      recipientSignatureData: String(payload?.recipientSignatureData || '').trim(),
      billDate,
      taxMode,
      subtotal,
      cgst: taxMode === 'intra' ? Number((totalTax / 2).toFixed(2)) : 0,
      sgst: taxMode === 'intra' ? Number((totalTax / 2).toFixed(2)) : 0,
      igst: taxMode === 'inter' ? totalTax : 0,
      total: Number((subtotal + totalTax).toFixed(2)),
      createdById: createdBy,
      createdBy: currentUser?.fullName || state.users.find((user) => Number(user.id) === createdBy)?.fullName || 'Administrator',
      createdAt: new Date().toISOString(),
      items
    };
    state.bills.unshift(bill);
    await saveState(state);
    return { success: true, invoiceNo: bill.invoiceNo, bill };
  },

  async listBills() {
    const state = await loadState();
    const bills = [...state.bills].sort((a, b) => b.id - a.id).slice(0, 50).map((bill) => ({
      ...paymentTotalsForBill(state, bill.id),
      id: bill.id,
      invoiceNo: bill.invoiceNo,
      customerName: bill.customerName,
      billDate: bill.billDate,
      taxMode: bill.taxMode,
      total: bill.total,
      createdBy: bill.createdBy || 'Administrator'
    }));
    return { success: true, bills };
  },

  async listPayments() {
    const state = await loadState();
    const payments = [...state.payments].sort((a, b) => b.id - a.id).map((payment) => {
      const bill = state.bills.find((row) => Number(row.id) === Number(payment.billId));
      return {
        ...payment,
        invoiceNo: bill?.invoiceNo || '',
        customerName: bill?.customerName || '',
        invoiceTotal: Number(bill?.total || 0),
        ...paymentTotalsForBill(state, payment.billId)
      };
    });
    return { success: true, payments };
  },

  async savePayment(payload) {
    const state = await loadState();
    const billId = Number(payload?.billId || 0);
    const bill = state.bills.find((row) => Number(row.id) === billId);
    const paymentDate = String(payload?.paymentDate || '').trim();
    const amount = Number(payload?.amount || 0);
    if (!bill || !paymentDate || !Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Invoice, date and valid payment amount are required.' };
    }
    const totals = paymentTotalsForBill(state, billId);
    if (amount > totals.dueAmount + 0.001) {
      return { success: false, message: `Payment cannot exceed balance due (${totals.dueAmount.toFixed(2)}).` };
    }
    const paymentId = nextId(state, 'payments');
    const payment = {
      id: paymentId,
      receiptNo: `PAY-${String(paymentId).padStart(Math.max(3, String(paymentId).length), '0')}`,
      billId,
      paymentDate,
      amount: Number(amount.toFixed(2)),
      method: String(payload?.method || 'Cash').trim() || 'Cash',
      referenceNo: String(payload?.referenceNo || '').trim(),
      notes: String(payload?.notes || '').trim(),
      createdById: Number(currentUser?.id || payload?.createdBy || 0),
      createdBy: currentUser?.fullName || 'Administrator',
      createdAt: new Date().toISOString()
    };
    state.payments.unshift(payment);
    await saveState(state);
    return { success: true, payment };
  },

  async listProductSales(payload) {
    const state = await loadState();
    const dateFrom = String(payload?.dateFrom || '').trim();
    const dateTo = String(payload?.dateTo || '').trim();
    const groups = new Map();
    state.bills
      .filter((bill) => (!dateFrom || bill.billDate >= dateFrom) && (!dateTo || bill.billDate <= dateTo))
      .forEach((bill) => {
        (bill.items || []).forEach((item) => {
          const key = `${item.description}|${item.hsnSac}`;
          const row = groups.get(key) || {
            productName: item.description,
            hsnSac: item.hsnSac,
            totalQty: 0,
            taxableValue: 0,
            taxAmount: 0,
            totalAmount: 0,
            invoiceIds: new Set()
          };
          row.totalQty += Number(item.quantity || 0);
          row.taxableValue += Number(item.taxableValue || 0);
          row.taxAmount += Number(item.taxAmount || 0);
          row.totalAmount += Number(item.lineTotal || 0);
          row.invoiceIds.add(bill.id);
          groups.set(key, row);
        });
      });
    const rows = Array.from(groups.values()).map((row) => ({
      ...row,
      totalQty: Number(row.totalQty.toFixed(3)),
      taxableValue: Number(row.taxableValue.toFixed(2)),
      taxAmount: Number(row.taxAmount.toFixed(2)),
      totalAmount: Number(row.totalAmount.toFixed(2)),
      invoiceCount: row.invoiceIds.size
    })).sort((a, b) => b.totalAmount - a.totalAmount || a.productName.localeCompare(b.productName));
    return { success: true, rows };
  },

  async getInvoiceHtml(payload) {
    const data = await getInvoiceData(payload?.billId);
    if (!data) {
      return { success: false, message: 'Invoice not found.' };
    }
    return { success: true, html: renderInvoiceHtml(data) };
  },

  async exportBillsExcel(payload) {
    const bills = Array.isArray(payload?.bills) ? payload.bills : [];
    if (bills.length === 0) {
      return { success: false, message: 'No invoice rows provided for export.' };
    }
    const headers = ['Invoice No', 'Bill Date', 'Customer Name', 'Tax Mode', 'Total', 'Created By'];
    const rows = bills.map((bill) => [
      escapeCsv(bill.invoiceNo),
      escapeCsv(bill.billDate),
      escapeCsv(bill.customerName),
      escapeCsv(bill.taxMode),
      escapeCsv(Number(bill.total || 0).toFixed(2)),
      escapeCsv(bill.createdBy || '')
    ].join(','));
    const fileName = `invoices_${payload?.dateFrom || 'ALL'}_to_${payload?.dateTo || 'ALL'}.csv`.replace(/-/g, '');
    downloadTextFile(fileName, `\uFEFF${[headers.join(','), ...rows].join('\n')}`);
    return { success: true, filePath: fileName };
  },

  async exportProductSalesExcel(payload) {
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (rows.length === 0) {
      return { success: false, message: 'No product sales rows provided for export.' };
    }
    const headers = ['Product', 'HSN/SAC', 'Qty', 'Taxable Value', 'Tax Amount', 'Total Amount', 'Invoices'];
    const csvRows = rows.map((row) => [
      escapeCsv(row.productName),
      escapeCsv(row.hsnSac),
      escapeCsv(Number(row.totalQty || 0).toFixed(3)),
      escapeCsv(Number(row.taxableValue || 0).toFixed(2)),
      escapeCsv(Number(row.taxAmount || 0).toFixed(2)),
      escapeCsv(Number(row.totalAmount || 0).toFixed(2)),
      escapeCsv(Number(row.invoiceCount || 0))
    ].join(','));
    const fileName = `product_sales_${payload?.dateFrom || 'ALL'}_to_${payload?.dateTo || 'ALL'}.csv`.replace(/-/g, '');
    downloadTextFile(fileName, `\uFEFF${[headers.join(','), ...csvRows].join('\n')}`);
    return { success: true, filePath: fileName };
  },

  async downloadInvoicePdf(payload) {
    const data = await getInvoiceData(payload?.billId);
    if (!data) {
      return { success: false, message: 'Invoice not found.' };
    }
    const fileName = `${safeFileName(data.bill.invoiceNo, 'invoice')}.pdf`;
    const result = openPrintablePdf(renderInvoiceHtml(data), fileName);
    if (!result.success) {
      return result;
    }
    return { success: true, filePath: fileName };
  },

  async getPaymentReceiptHtml(payload) {
    const data = await getPaymentReceiptData(payload?.paymentId);
    if (!data) {
      return { success: false, message: 'Payment not found.' };
    }
    return { success: true, html: renderPaymentReceiptHtml(data) };
  },

  async downloadPaymentPdf(payload) {
    const data = await getPaymentReceiptData(payload?.paymentId);
    if (!data) {
      return { success: false, message: 'Payment not found.' };
    }
    const fileName = `${safeFileName(data.payment.receiptNo, 'payment_receipt')}.pdf`;
    const result = openPrintablePdf(renderPaymentReceiptHtml(data), fileName);
    if (!result.success) {
      return result;
    }
    return { success: true, filePath: fileName };
  },

  async printInvoice(payload) {
    const data = await getInvoiceData(payload?.billId);
    if (!data) {
      return { success: false, message: 'Invoice not found.' };
    }
    return openPrintablePdf(renderInvoiceHtml(data), `${safeFileName(data.bill.invoiceNo, 'invoice')}.pdf`);
  }
};
