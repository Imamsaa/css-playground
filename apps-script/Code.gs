/**
 * CSS Playground — Google Sheets submission receiver
 *
 * Sheet columns:
 *   A: Nama
 *   B: Tugas
 *   C: Waktu Pengumpulan
 *
 * The endpoint deliberately does NOT store student CSS, score, or code.
 */

const CONFIG = {
  SPREADSHEET_NAME: 'CSS Playground - Pengumpulan Tugas',
  SHEET_NAME: 'Pengumpulan',
  TIME_ZONE: 'Asia/Jakarta',
  RECEIPT_TTL_SECONDS: 600
};

/**
 * Run once from the Apps Script editor.
 * Creates the spreadsheet and the submission tab, then logs its URL.
 * Running it again reuses the same spreadsheet.
 */
function setup() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
    spreadsheetId = spreadsheet.getId();
    properties.setProperty('SPREADSHEET_ID', spreadsheetId);
  }

  spreadsheet.setSpreadsheetTimeZone(CONFIG.TIME_ZONE);

  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([[
      'Nama',
      'Tugas',
      'Waktu Pengumpulan'
    ]]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange('A1:C1')
    .setFontWeight('bold')
    .setBackground('#e8eefc')
    .setFontColor('#1e293b');
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 360);
  sheet.setColumnWidth(3, 190);
  sheet.getRange('C:C').setNumberFormat('dd/MM/yyyy HH:mm:ss');

  Logger.log('Spreadsheet siap: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

/**
 * Receive one submission from the CSS Playground.
 * Request body is JSON sent as text/plain to avoid a browser CORS preflight.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Empty request body.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const submissionId = cleanText_(payload.submissionId, 80);
    const studentName = cleanText_(payload.name, 100);
    const taskName = cleanText_(payload.task, 180);

    if (!/^[a-zA-Z0-9_-]{12,80}$/.test(submissionId)) {
      return jsonResponse_({ ok: false, error: 'Invalid submission ID.' });
    }
    if (!studentName) {
      return jsonResponse_({ ok: false, error: 'Student name is required.' });
    }
    if (!taskName) {
      return jsonResponse_({ ok: false, error: 'Task name is required.' });
    }

    lock.waitLock(15000);

    const cache = CacheService.getScriptCache();
    const receiptKey = 'submission_' + submissionId;

    // Idempotency: a retry with the same ID must not create a duplicate row.
    if (cache.get(receiptKey) === 'saved') {
      return jsonResponse_({ ok: true, duplicate: true });
    }

    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty('SPREADSHEET_ID');

    if (!spreadsheetId) {
      throw new Error('Spreadsheet is not configured. Run setup() first.');
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(['Nama', 'Tugas', 'Waktu Pengumpulan']);
      sheet.setFrozenRows(1);
      sheet.getRange('C:C').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    }

    // Server-side timestamp in the spreadsheet timezone.
    const submittedAt = new Date();
    sheet.appendRow([studentName, taskName, submittedAt]);

    // Used only to confirm receipt to the browser; not written to the sheet.
    cache.put(receiptKey, 'saved', CONFIG.RECEIPT_TTL_SECONDS);

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

/**
 * JSONP receipt check. The callback name is strictly allow-listed to prevent
 * injecting arbitrary JavaScript into the returned response.
 */
function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.action !== 'status') {
    return ContentService
      .createTextOutput('CSS Playground submission endpoint is active.')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const callback = String(params.callback || '');
  const submissionId = String(params.id || '');

  if (!/^__cssQuestAck_[A-Za-z0-9_]+$/.test(callback) ||
      !/^[a-zA-Z0-9_-]{12,80}$/.test(submissionId)) {
    return ContentService
      .createTextOutput('/* Invalid status request */')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const saved = CacheService.getScriptCache()
    .get('submission_' + submissionId) === 'saved';

  const response = JSON.stringify({ ok: saved });
  return ContentService
    .createTextOutput(callback + '(' + response + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
