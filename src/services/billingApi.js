import { isSupabaseConfigured, supabase, supabaseTableName } from './supabase.js';

const REMOTE_STATE_ID = 'default';
const PASSWORD_SALT = 'gst-local-app-v2';
const ADMIN_USERNAME = 'admin';
const LEGACY_DEFAULT_PROFILE_NAME = 'MARGAZHI TEX';
const LEGACY_DEFAULT_PROFILE_GSTIN = '33DTEPR0721R1ZC';

const defaultSettings = {
  profileName: '',
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
  defaultTaxRate: 12,
  invoicePrefix: 'GST',
  invoiceStartValue: 1,
  compositionValidDays: 30,
  backupLastAt: ''
};

let stateCache = null;
let authStateCache = null;
let currentUser = null;

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
    settings: { ...defaultSettings },
    counters: {
      users: 1,
      customers: 0,
      products: 0,
      bills: 0
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
    settings: { ...defaultSettings, profileEmail: String(user?.email || defaultSettings.profileEmail).trim() },
    counters: {
      users: 1,
      customers: 0,
      products: 0,
      bills: 0
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
  if (settings.profileName === LEGACY_DEFAULT_PROFILE_NAME) {
    settings.profileName = '';
  }
  if (settings.profileGstin === LEGACY_DEFAULT_PROFILE_GSTIN) {
    settings.profileGstin = '';
  }
  return {
    users,
    customers: Array.isArray(raw?.customers) ? raw.customers : [],
    products: Array.isArray(raw?.products)
      ? raw.products.map((product) => ({ ...product, unit: normalizeUnit(product?.unit) }))
      : [],
    bills: Array.isArray(raw?.bills) ? raw.bills : [],
    settings,
    counters: {
      users: Number(raw?.counters?.users || users.length || 1),
      customers: Number(raw?.counters?.customers || raw?.customers?.length || 0),
      products: Number(raw?.counters?.products || raw?.products?.length || 0),
      bills: Number(raw?.counters?.bills || raw?.bills?.length || 0)
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
  const message = String(error?.message || error || 'Unknown Supabase error');
  const missingTable = /Could not find the table|does not exist|schema cache/i.test(message);
  const setupHint = missingTable
    ? ' Run supabase-schema.sql in your Supabase SQL editor, then rebuild the app.'
    : '';
  return new Error(`Supabase server storage failed: ${message}. Check table public.${supabaseTableName} allows reading and writing ${stateId}.${setupHint}`);
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

  throw new Error('Supabase is not configured. Fill .env Supabase values to store data on the server.');
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

  throw new Error('Supabase is not configured. Fill .env Supabase values to store data on the server.');
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
    throw new Error('Supabase is not configured. Fill .env Supabase values to store data on the server.');
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
    throw new Error('Supabase is not configured. Fill .env Supabase values to store data on the server.');
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

function renderInvoiceHtml(data) {
  const { bill, items, profile } = data;
  const taxLabel = bill.taxMode === 'inter' ? 'IGST' : bill.taxMode === 'composition' ? 'Composition' : 'CGST / SGST';
  const itemRows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.hsnSac)}</td>
      <td>${escapeHtml(item.unit || 'Kgs')}</td>
      <td class="r">${Number(item.quantity || 0).toFixed(3)} ${escapeHtml(item.unit || 'Kgs')}</td>
      <td class="r">${Number(item.rate || 0).toFixed(2)}</td>
      <td class="r">${Number(item.taxableValue || 0).toFixed(2)}</td>
      <td class="r">${Number(item.taxAmount || 0).toFixed(2)}</td>
      <td class="r">${Number(item.lineTotal || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #111; margin: 24px; font-size: 12px; }
        .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
        .box { border: 1px solid #111; padding: 10px; min-height: 92px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #111; padding: 6px; vertical-align: top; }
        th { background: #eee; }
        .r { text-align: right; }
        .total { font-size: 15px; font-weight: 700; }
        .sign { margin-top: 48px; text-align: right; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="title">${bill.taxMode === 'composition' ? 'BILL OF SUPPLY' : 'TAX INVOICE'}</div>
      <div class="grid">
        <div class="box">
          <strong>${escapeHtml(profile.name)}</strong><br />
          GSTIN: ${escapeHtml(profile.gstin)}<br />
          ${escapeHtml(profile.address).replace(/\n/g, '<br />')}<br />
          Phone: ${escapeHtml(profile.phone)}<br />
          Email: ${escapeHtml(profile.email)}
        </div>
        <div class="box">
          <strong>Invoice No:</strong> ${escapeHtml(bill.invoiceNo)}<br />
          <strong>Date:</strong> ${escapeHtml(bill.billDate)}<br />
          <strong>Tax Mode:</strong> ${escapeHtml(taxLabel)}<br />
          <strong>E-Way Bill:</strong> ${escapeHtml(bill.eWayBillNo || '')}
        </div>
      </div>
      <div class="box">
        <strong>Buyer:</strong> ${escapeHtml(bill.customerName)}<br />
        GSTIN: ${escapeHtml(bill.customerGstin)}<br />
        State: ${escapeHtml(bill.customerState)}<br />
        Phone: ${escapeHtml(bill.customerPhone)}<br />
        ${escapeHtml(bill.customerAddress).replace(/\n/g, '<br />')}
      </div>
      <br />
      <table>
        <thead>
          <tr>
            <th>#</th><th>Description</th><th>HSN/SAC</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>Tax</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr><td colspan="6" class="r">Subtotal</td><td class="r">${Number(bill.subtotal).toFixed(2)}</td><td></td><td></td></tr>
          <tr><td colspan="8" class="r">CGST</td><td class="r">${Number(bill.cgst).toFixed(2)}</td></tr>
          <tr><td colspan="8" class="r">SGST</td><td class="r">${Number(bill.sgst).toFixed(2)}</td></tr>
          <tr><td colspan="8" class="r">IGST</td><td class="r">${Number(bill.igst).toFixed(2)}</td></tr>
          <tr class="total"><td colspan="8" class="r">Grand Total</td><td class="r">${Number(bill.total).toFixed(2)}</td></tr>
        </tfoot>
      </table>
      <p>${escapeHtml(profile.declaration)}</p>
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
      compositionValidDays: state.settings.compositionValidDays
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
    stateCache = null;
    await loadState();
    return { success: true, user: currentUser };
  },

  async changePassword(payload) {
    const state = await loadAuthState();
    const user = state.users.find((row) => Number(row.id) === Number(payload?.userId));
    const newPassword = String(payload?.newPassword || '');
    if (!currentUser || Number(currentUser.id) !== Number(payload?.userId)) {
      return { success: false, message: 'Please login again.' };
    }
    if (!user || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    user.passwordHash = await hashPassword(newPassword);
    await saveAuthState(state);
    if (stateCache?.users) {
      const localUser = stateCache.users.find((row) => Number(row.id) === Number(user.id));
      if (localUser) {
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
          message: `User added, but user storage setup failed: ${supabaseStorageError(error, userDocId(user)).message}`
        };
      }
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
      profileSignatory: String(payload?.profileSignatory || '').trim()
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
    const html = renderInvoiceHtml(data);
    const fileName = `${String(data.bill.invoiceNo || 'invoice').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')}.html`;
    downloadTextFile(fileName, html, 'text/html;charset=utf-8');
    return { success: true, filePath: fileName };
  },

  async printInvoice(payload) {
    const data = await getInvoiceData(payload?.billId);
    if (!data) {
      return { success: false, message: 'Invoice not found.' };
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return { success: false, message: 'Popup blocked. Allow popups to print invoices.' };
    }
    printWindow.document.open();
    printWindow.document.write(renderInvoiceHtml(data));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return { success: true };
  }
};
