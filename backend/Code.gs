/**
 * ICT Al Firdaus Purwodadi — CSS Playground account API
 *
 * Account database: data/accounts.json in this same GitHub repository.
 * The JSON contents are encrypted because this repository is public.
 * No Google Drive files are used.
 *
 * Required Apps Script Project Settings > Script properties:
 *   GITHUB_TOKEN = a fine-grained GitHub token, Contents: Read and write,
 *                  restricted to Imamsaa/css-playground only.
 *
 * Run setupDatabase() once. It generates the encryption key in Script Properties,
 * creates the student-data branch if needed, and initializes data/accounts.json.
 */

const GITHUB_OWNER = 'Imamsaa';
const GITHUB_REPOSITORY = 'css-playground';
const GITHUB_DEFAULT_BRANCH = 'main';
const GITHUB_DATA_BRANCH = 'student-data';
const DATABASE_PATH = 'data/accounts.json';
const TOKEN_PROPERTY = 'GITHUB_TOKEN';
const ENCRYPTION_SECRET_PROPERTY = 'ICT_CSS_ENCRYPTION_SECRET';

const MAX_NAME_LENGTH = 60;
const MAX_CODE_LENGTH = 12000;
const MAX_ACCOUNT_CODE_TOTAL = 90000;
const MAX_COMPLETED_TASKS = 100;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Run once manually in the Apps Script editor.
 * Creates a random encryption secret in Script Properties, ensures the data branch,
 * and initializes the encrypted JSON database. The secret is never logged.
 */
function setupDatabase() {
  getEncryptionSecret_();
  ensureDataBranch_();
  const record = readDatabaseRecord_();
  if (!record.database) {
    const initial = { schemaVersion: 1, accounts: {} };
    writeDatabase_(initial, record.sha);
  }
  return 'Ready: ' + GITHUB_OWNER + '/' + GITHUB_REPOSITORY + ' / ' + GITHUB_DATA_BRANCH + '/' + DATABASE_PATH;
}

/** Optional health check. */
function doGet() {
  return ContentService
    .createTextOutput('ICT Al Firdaus CSS account API is running. Send a POST request from the playground.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  let requestId = '';
  let response;
  try {
    const rawPayload = e && e.parameter && e.parameter.payload
      ? e.parameter.payload
      : (e && e.postData && e.postData.contents ? e.postData.contents : '{}');
    const payload = JSON.parse(rawPayload);
    requestId = String(payload.requestId || '').slice(0, 100);
    response = runAction_(payload);
  } catch (error) {
    response = { ok: false, error: safeErrorMessage_(error) };
  }
  response.type = 'ict-css-account-response';
  response.requestId = requestId;
  return htmlPostMessage_(response);
}

function runAction_(payload) {
  const action = String(payload.action || '').toLowerCase();
  if (action !== 'create' && action !== 'restore' && action !== 'save') {
    throw new Error('Perintah tidak dikenal.');
  }
  return withLock_(function () {
    const record = readDatabaseRecord_();
    const database = record.database || { schemaVersion: 1, accounts: {} };

    if (action === 'create') {
      const name = sanitizeName_(payload.name);
      if (name.length < 2) throw new Error('Nama siswa minimal 2 karakter.');
      let code = '';
      let key = '';
      for (let attempt = 0; attempt < 20; attempt++) {
        code = generateAccountCode_();
        key = normalizeCode_(code);
        if (!database.accounts[key]) break;
        code = '';
      }
      if (!code) throw new Error('Gagal membuat kode unik. Silakan coba kembali.');
      const now = new Date().toISOString();
      const state = sanitizeState_(payload.state || {});
      const account = {
        code: code,
        name: name,
        createdAt: now,
        updatedAt: now,
        lastTaskId: state.lastTaskId,
        codes: state.codes,
        completedTaskIds: state.completedTaskIds
      };
      database.accounts[key] = account;
      writeDatabase_(database, record.sha);
      return { ok: true, account: publicAccount_(account) };
    }

    const key = normalizeCode_(payload.code);
    if (!key || !database.accounts[key]) {
      throw new Error('Kode akun tidak ditemukan. Periksa kembali kode yang dimasukkan.');
    }
    const account = database.accounts[key];
    if (action === 'restore') return { ok: true, account: publicAccount_(account) };

    const incoming = sanitizeState_(payload.state || {});
    const mergedCodes = Object.assign({}, account.codes || {});
    Object.keys(incoming.codes).forEach(function (taskId) {
      // Empty strings represent a student's explicit editor reset.
      mergedCodes[taskId] = incoming.codes[taskId];
    });
    account.codes = capCodes_(mergedCodes);
    account.completedTaskIds = incoming.completedTaskIds;
    account.lastTaskId = incoming.lastTaskId || account.lastTaskId || '';
    account.updatedAt = new Date().toISOString();
    database.accounts[key] = account;
    writeDatabase_(database, record.sha);
    return {
      ok: true,
      account: {
        code: account.code,
        name: account.name,
        updatedAt: account.updatedAt,
        lastTaskId: account.lastTaskId
      }
    };
  });
}

function withLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getGitHubToken_() {
  const token = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  if (!token) {
    throw new Error('Backend belum dikonfigurasi: tambahkan Script Property GITHUB_TOKEN dengan izin Contents Read and write pada repositori ' + GITHUB_OWNER + '/' + GITHUB_REPOSITORY + '.');
  }
  return token.trim();
}

function getEncryptionSecret_() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty(ENCRYPTION_SECRET_PROPERTY);
  if (!secret) {
    // UUIDs are generated server-side; the secret stays in Script Properties and is never committed.
    secret = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty(ENCRYPTION_SECRET_PROPERTY, secret);
  }
  return secret;
}

function githubApiRequest_(path, method, body, allowNotFound) {
  const url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPOSITORY + path;
  const options = {
    method: String(method || 'get').toLowerCase(),
    headers: {
      Authorization: 'Bearer ' + getGitHubToken_(),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  };
  if (body !== undefined && body !== null) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }
  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();
  const text = response.getContentText();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch (error) {}
  if (status === 404 && allowNotFound) return { status: status, body: json };
  if (status < 200 || status >= 300) {
    if (status === 401 || status === 403) {
      throw new Error('GitHub menolak akses database. Periksa GITHUB_TOKEN dan izin Contents Read and write.');
    }
    throw new Error('GitHub API gagal (' + status + '): ' + String(json.message || 'Permintaan tidak berhasil.').slice(0, 180));
  }
  return { status: status, body: json };
}

function ensureDataBranch_() {
  const branchPath = '/git/ref/heads/' + encodeURIComponent(GITHUB_DATA_BRANCH);
  const existing = githubApiRequest_(branchPath, 'get', null, true);
  if (existing.status === 200) return existing.body.object.sha;

  const main = githubApiRequest_('/git/ref/heads/' + encodeURIComponent(GITHUB_DEFAULT_BRANCH), 'get', null, false);
  const created = githubApiRequest_('/git/refs', 'post', {
    ref: 'refs/heads/' + GITHUB_DATA_BRANCH,
    sha: main.body.object.sha
  }, false);
  return created.body.object.sha;
}

function readDatabaseRecord_() {
  ensureDataBranch_();
  const path = '/contents/' + DATABASE_PATH.split('/').map(encodeURIComponent).join('/') +
    '?ref=' + encodeURIComponent(GITHUB_DATA_BRANCH);
  const result = githubApiRequest_(path, 'get', null, true);
  if (result.status === 404) return { database: null, sha: null };

  const file = result.body;
  const bytes = Utilities.base64Decode(String(file.content || '').replace(/\s/g, ''));
  const text = Utilities.newBlob(bytes).getDataAsString('UTF-8');
  let envelope;
  try { envelope = JSON.parse(text); }
  catch (error) { throw new Error('File data/accounts.json bukan JSON yang valid.'); }

  if (envelope && envelope.encrypted === true && envelope.envelope === null) {
    return { database: { schemaVersion: 1, accounts: {} }, sha: file.sha };
  }
  return { database: decryptDatabase_(envelope), sha: file.sha };
}

function writeDatabase_(database, existingSha) {
  const envelope = encryptDatabase_(database);
  const text = JSON.stringify(envelope, null, 2);
  const encoded = Utilities.base64Encode(Utilities.newBlob(text, 'application/json').getBytes());
  const path = '/contents/' + DATABASE_PATH.split('/').map(encodeURIComponent).join('/');
  const body = {
    message: 'Update encrypted student progress database',
    content: encoded,
    branch: GITHUB_DATA_BRANCH
  };
  if (existingSha) body.sha = existingSha;
  githubApiRequest_(path, 'put', body, false);
}

function encryptDatabase_(database) {
  const secret = getEncryptionSecret_();
  const saltHex = randomHex_();
  const ivHex = randomHex_();
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const master = CryptoJS.enc.Utf8.parse(secret);
  const encryptionKey = CryptoJS.HmacSHA256('ict-css-db|enc|' + saltHex, master);
  const macKey = CryptoJS.HmacSHA256('ict-css-db|mac|' + saltHex, master);
  const plaintext = JSON.stringify(database);
  const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).ciphertext.toString(CryptoJS.enc.Hex);
  const macInput = 'v1|' + saltHex + '|' + ivHex + '|' + encrypted;
  const mac = CryptoJS.HmacSHA256(macInput, macKey).toString(CryptoJS.enc.Hex);
  return {
    schemaVersion: 1,
    encrypted: true,
    algorithm: 'AES-256-CBC+HMAC-SHA256',
    envelope: { version: 1, salt: saltHex, iv: ivHex, ciphertext: encrypted, mac: mac }
  };
}

function decryptDatabase_(record) {
  if (!record || record.encrypted !== true || !record.envelope) {
    throw new Error('Database belum dienkripsi atau formatnya tidak sesuai. Jalankan setupDatabase() dan jangan menaruh data siswa sebagai JSON biasa di branch publik.');
  }
  const envelope = record.envelope;
  if (envelope.version !== 1 || !envelope.salt || !envelope.iv || !envelope.ciphertext || !envelope.mac) {
    throw new Error('Envelope database terenkripsi tidak lengkap.');
  }
  const secret = getEncryptionSecret_();
  const master = CryptoJS.enc.Utf8.parse(secret);
  const encryptionKey = CryptoJS.HmacSHA256('ict-css-db|enc|' + envelope.salt, master);
  const macKey = CryptoJS.HmacSHA256('ict-css-db|mac|' + envelope.salt, master);
  const expectedMac = CryptoJS.HmacSHA256(
    'v1|' + envelope.salt + '|' + envelope.iv + '|' + envelope.ciphertext,
    macKey
  ).toString(CryptoJS.enc.Hex);
  if (!constantTimeEqual_(expectedMac, envelope.mac)) {
    throw new Error('Verifikasi keamanan database gagal. Periksa apakah ICT_CSS_ENCRYPTION_SECRET masih sama.');
  }
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Hex.parse(envelope.ciphertext) },
    encryptionKey,
    {
      iv: CryptoJS.enc.Hex.parse(envelope.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext) throw new Error('Database tidak dapat didekripsi.');
  let database;
  try { database = JSON.parse(plaintext); }
  catch (error) { throw new Error('Isi database setelah dekripsi bukan JSON yang valid.'); }
  if (!database || typeof database !== 'object' || Array.isArray(database)) {
    throw new Error('Struktur database JSON tidak valid.');
  }
  if (!database.accounts || typeof database.accounts !== 'object' || Array.isArray(database.accounts)) {
    database.accounts = {};
  }
  database.schemaVersion = 1;
  return database;
}

function randomHex_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 32);
}

function constantTimeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) {
    difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return difference === 0;
}

function sanitizeName_(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function normalizeCode_(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function generateAccountCode_() {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid(),
    Utilities.Charset.UTF_8
  );
  let suffix = '';
  for (let i = 0; i < 10; i++) suffix += CODE_ALPHABET.charAt((bytes[i] & 255) & 31);
  return 'ICT-' + suffix.slice(0, 5) + '-' + suffix.slice(5);
}

function sanitizeState_(state) {
  const sourceCodes = state && state.codes && typeof state.codes === 'object' && !Array.isArray(state.codes)
    ? state.codes
    : {};
  const codes = {};
  let totalLength = 0;
  Object.keys(sourceCodes).forEach(function (taskId) {
    if (!/^[a-z0-9-]{1,80}$/i.test(taskId) || typeof sourceCodes[taskId] !== 'string') return;
    const code = sourceCodes[taskId].slice(0, MAX_CODE_LENGTH);
    if (totalLength + code.length > MAX_ACCOUNT_CODE_TOTAL) return;
    codes[taskId] = code;
    totalLength += code.length;
  });
  const completed = Array.isArray(state && state.completedTaskIds)
    ? state.completedTaskIds.filter(function (id) { return typeof id === 'string' && /^[a-z0-9-]{1,80}$/i.test(id); }).slice(0, MAX_COMPLETED_TASKS)
    : [];
  const lastTask = String((state && state.lastTaskId) || '');
  const lastTaskId = /^[a-z0-9-]{1,80}$/i.test(lastTask) ? lastTask : '';
  return { codes: codes, completedTaskIds: Array.from(new Set(completed)), lastTaskId: lastTaskId };
}

function capCodes_(source) {
  return sanitizeState_({ codes: source, completedTaskIds: [], lastTaskId: '' }).codes;
}

function publicAccount_(account) {
  return {
    code: account.code,
    name: account.name,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastTaskId: account.lastTaskId || '',
    codes: account.codes || {},
    completedTaskIds: account.completedTaskIds || []
  };
}

function safeErrorMessage_(error) {
  return String(error && error.message ? error.message : 'Terjadi kesalahan pada server akun.').slice(0, 240);
}

function htmlPostMessage_(data) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + json + ', "*");</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
