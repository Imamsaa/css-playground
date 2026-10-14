/**
 * ICT Al Firdaus Purwodadi — CSS Playground account API
 *
 * Storage: one private JSON file in the owner's Google Drive.
 * Deploy as a Web App: Execute as "Me"; access "Anyone".
 * The frontend posts regular HTML forms to avoid browser CORS preflight.
 */

const DB_FILE_NAME = 'ICT-Al-Firdaus-CSS-Playground-Accounts.json';
const DB_FILE_ID_PROPERTY = 'ICT_CSS_PLAYGROUND_JSON_DB_FILE_ID';
const MAX_NAME_LENGTH = 60;
const MAX_CODE_LENGTH = 20000;
const MAX_ACCOUNT_CODE_TOTAL = 160000;
const MAX_COMPLETED_TASKS = 100;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Run this function once in the Apps Script editor and approve Drive access.
 * The JSON file remains private in your Google Drive.
 */
function setupDatabase() {
  const file = getDatabaseFile_();
  Logger.log('JSON database ready: ' + file.getName() + ' | file ID: ' + file.getId());
  return 'JSON database ready: ' + file.getName();
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
    response = {
      ok: false,
      error: safeErrorMessage_(error)
    };
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
    const file = getDatabaseFile_();
    const database = readDatabase_(file);

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
      writeDatabase_(file, database);
      return { ok: true, account: publicAccount_(account) };
    }

    const key = normalizeCode_(payload.code);
    if (!key || !database.accounts[key]) throw new Error('Kode akun tidak ditemukan. Periksa kembali kode yang dimasukkan.');

    const account = database.accounts[key];
    if (action === 'restore') {
      return { ok: true, account: publicAccount_(account) };
    }

    const incoming = sanitizeState_(payload.state || {});
    const mergedCodes = Object.assign({}, account.codes || {});
    Object.keys(incoming.codes).forEach(function (taskId) {
      // Empty code is meaningful: it represents a student's explicit reset.
      mergedCodes[taskId] = incoming.codes[taskId];
    });
    const now = new Date().toISOString();
    account.codes = capCodes_(mergedCodes);
    account.completedTaskIds = incoming.completedTaskIds;
    account.lastTaskId = incoming.lastTaskId || account.lastTaskId || '';
    account.updatedAt = now;
    database.accounts[key] = account;
    writeDatabase_(file, database);
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

function getDatabaseFile_() {
  const properties = PropertiesService.getScriptProperties();
  const savedId = properties.getProperty(DB_FILE_ID_PROPERTY);
  if (savedId) {
    try {
      return DriveApp.getFileById(savedId);
    } catch (error) {
      properties.deleteProperty(DB_FILE_ID_PROPERTY);
    }
  }

  const files = DriveApp.getFilesByName(DB_FILE_NAME);
  if (files.hasNext()) {
    const file = files.next();
    properties.setProperty(DB_FILE_ID_PROPERTY, file.getId());
    return file;
  }

  const initialDatabase = { schemaVersion: 1, accounts: {} };
  const file = DriveApp.createFile(
    DB_FILE_NAME,
    JSON.stringify(initialDatabase, null, 2),
    MimeType.PLAIN_TEXT
  );
  properties.setProperty(DB_FILE_ID_PROPERTY, file.getId());
  return file;
}

function readDatabase_(file) {
  const raw = file.getBlob().getDataAsString('UTF-8');
  let database;
  try {
    database = JSON.parse(raw || '{}');
  } catch (error) {
    throw new Error('File database JSON tidak valid. Jangan menghapus file; hubungi admin untuk memulihkannya.');
  }
  if (!database || typeof database !== 'object' || Array.isArray(database)) {
    throw new Error('Struktur database JSON tidak valid.');
  }
  if (!database.accounts || typeof database.accounts !== 'object' || Array.isArray(database.accounts)) {
    database.accounts = {};
  }
  database.schemaVersion = 1;
  return database;
}

function writeDatabase_(file, database) {
  file.setContent(JSON.stringify(database, null, 2));
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
  // A UUID provides random seed material; SHA-256 bytes supply 5 bits per character.
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid(),
    Utilities.Charset.UTF_8
  );
  let suffix = '';
  for (let i = 0; i < 10; i++) {
    suffix += CODE_ALPHABET.charAt((bytes[i] & 255) & 31);
  }
  return 'ICT-' + suffix.slice(0, 5) + '-' + suffix.slice(5);
}

function sanitizeState_(state) {
  const sourceCodes = state && state.codes && typeof state.codes === 'object' && !Array.isArray(state.codes)
    ? state.codes
    : {};
  const codes = {};
  let totalLength = 0;
  Object.keys(sourceCodes).forEach(function (taskId) {
    if (!/^[a-z0-9-]{1,80}$/i.test(taskId)) return;
    if (typeof sourceCodes[taskId] !== 'string') return;
    const code = sourceCodes[taskId].slice(0, MAX_CODE_LENGTH);
    if (totalLength + code.length > MAX_ACCOUNT_CODE_TOTAL) return;
    codes[taskId] = code;
    totalLength += code.length;
  });

  const validCompleted = Array.isArray(state && state.completedTaskIds)
    ? state.completedTaskIds
        .filter(function (id) { return typeof id === 'string' && /^[a-z0-9-]{1,80}$/i.test(id); })
        .slice(0, MAX_COMPLETED_TASKS)
    : [];
  const lastTask = String((state && state.lastTaskId) || '');
  const lastTaskId = /^[a-z0-9-]{1,80}$/i.test(lastTask) ? lastTask : '';

  return {
    codes: codes,
    completedTaskIds: Array.from(new Set(validCompleted)),
    lastTaskId: lastTaskId
  };
}

function capCodes_(source) {
  return sanitizeState_({
    codes: source,
    completedTaskIds: [],
    lastTaskId: ''
  }).codes;
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
  const message = error && error.message ? String(error.message) : 'Terjadi kesalahan pada server akun.';
  return message.slice(0, 240);
}

function htmlPostMessage_(data) {
  // Escape characters that could terminate an inline script if a name contains markup.
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + json + ', "*");</script>' +
    '</body></html>';
  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
