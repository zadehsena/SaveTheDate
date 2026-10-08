// Paste this file into a Google Apps Script project.
// Google Sheet receiving invitation details.
const SHEET_ID = '1gyI8Cokz-22O79HwzPnSdsxaZTyPcJtrXIvKXo9k5hA';
const TAB_NAME = 'Responses';
const HEADERS = [
  'Submitted at', 'First name', 'Last name', 'Additional invitees',
  'Email', 'Phone number', 'Street address', 'Unit', 'City', 'State', 'ZIP code', 'Submission ID'
];
const PHONE_COLUMN = 6;
const SUBMISSION_ID_COLUMN = 12;

function doGet() {
  return page('Invitation details', 'Please use the form on Neusha and Jacob\'s website.');
}

function doPost(e) {
  try {
    if (!e || !e.parameter) {
      throw new Error('The Google Sheet is not configured.');
    }

    // A hidden field catches simple automated submissions.
    if (value(e.parameter.website)) {
      return page('Thank you', 'Your details have been received.');
    }

    const firstName = value(e.parameter.firstName);
    const lastName = value(e.parameter.lastName);
    const email = value(e.parameter.email);
    const phone = value(e.parameter.phone);
    const street = value(e.parameter.street);
    const unit = value(e.parameter.unit);
    const city = value(e.parameter.city);
    const state = value(e.parameter.state);
    const zip = value(e.parameter.zip);
    const submissionId = value(e.parameter.submissionId);
    const inviteeFirstNames = e.parameters.inviteeFirstName || [];
    const inviteeLastNames = e.parameters.inviteeLastName || [];

    if (!firstName || !lastName || !phone || !street || !city || !state || !zip ||
        !/^[A-Za-z0-9_-]{10,80}$/.test(submissionId) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        inviteeFirstNames.length !== inviteeLastNames.length) {
      return page('Please check your details', 'A required field is missing or invalid. Go back and try again.');
    }

    const invitees = inviteeFirstNames.map((first, index) => {
      const name = [value(first), value(inviteeLastNames[index])];
      if (!name[0] || !name[1]) {
        throw new Error('An additional invitee name is incomplete.');
      }
      return name.join(' ');
    });

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const sheet = spreadsheet.getSheetByName(TAB_NAME) || spreadsheet.insertSheet(TAB_NAME);
      ensureColumns(sheet);

      const lastRow = sheet.getLastRow();
      if (lastRow > 1 && sheet.getRange(2, SUBMISSION_ID_COLUMN, lastRow - 1, 1)
          .createTextFinder(submissionId).matchEntireCell(true).findNext()) {
        return page('Thank you', 'We already received these details. No duplicate was added.');
      }

      sheet.appendRow([
        new Date(), firstName, lastName, invitees.join('; '),
        email, phone, street, unit, city, state, zip, submissionId
      ].map((cell, index) => index === 0 ? cell : safeCell(cell)));
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return page('Thank you', 'Your details have been received. We can’t wait to celebrate with you!');
  } catch (error) {
    console.error(error);
    return page('Unable to send', 'Your details were not saved. Please go back and try again.');
  }
}

function ensureColumns(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }

  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (headers[0] !== 'Submitted at' || headers[4] !== 'Email') {
    throw new Error('The response sheet columns have changed.');
  }

  if (headers[PHONE_COLUMN - 1] !== 'Phone number') {
    if (headers[PHONE_COLUMN - 1] !== 'Street address') {
      throw new Error('The response sheet columns have changed.');
    }

    // Preserve existing responses while moving the old last column beside email.
    if (headers[HEADERS.length - 1] === 'Phone number') {
      sheet.moveColumns(sheet.getRange(1, HEADERS.length, sheet.getMaxRows(), 1), PHONE_COLUMN);
    } else {
      sheet.insertColumnBefore(PHONE_COLUMN);
    }
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function value(input) {
  return String(input == null ? '' : input).trim().replace(/[\r\n]+/g, ' ').slice(0, 500);
}

function safeCell(input) {
  const text = String(input);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function page(title, message) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + title + '</title><style>' +
    'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8f6ef;color:#273a33;font-family:Georgia,serif;text-align:center}' +
    'main{max-width:34rem;padding:2rem}h1{font-size:2.5rem;font-weight:400}p{font-size:1.3rem;line-height:1.5}' +
    '</style></head><body><main><h1>' + title + '</h1><p>' + message + '</p></main></body></html>'
  ).setTitle(title);
}
