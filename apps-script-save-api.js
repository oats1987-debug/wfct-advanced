const SPREADSHEET_ID = "1f2HYxfmWESkjBKKi9rVzM8cnjzfunyivPHcDYzE_62M";
const SHEET_NAME = "Players";
const ADMIN_KEY = "CHANGE_THIS_TO_A_PRIVATE_ADMIN_PASSWORD";

function doGet(e) {
  const callback = e.parameter.callback || "callback";
  const action = e.parameter.action || "";
  const sheet = getSheet();
  let result;

  if (action === "load") {
    result = loadPlayer(sheet, e.parameter.profileKey);
  } else if (action === "list") {
    result = isAdmin(e.parameter.adminKey) ? listPlayers(sheet) : { ok: false, error: "Not authorized." };
  } else if (action === "reset") {
    result = isAdmin(e.parameter.adminKey) ? resetPlayer(sheet, e.parameter.profileKey) : { ok: false, error: "Not authorized." };
  } else {
    result = { ok: false, error: "Unknown action." };
  }

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(result)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const payload = parsePayload(e);
    const sheet = getSheet();

    if (payload.action === "load") {
      return json(loadPlayer(sheet, payload.profileKey));
    }

    if (payload.action === "save") {
      savePlayer(sheet, payload.profile);
      return json({ ok: true });
    }

    return json({ ok: false, error: "Unknown action." });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function parsePayload(e) {
  if (e.parameter && e.parameter.action) {
    return {
      action: e.parameter.action,
      profileKey: e.parameter.profileKey,
      profile: e.parameter.profile ? JSON.parse(e.parameter.profile) : null
    };
  }

  return JSON.parse((e.postData && e.postData.contents) || "{}");
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "profileKey",
      "playerName",
      "boardJson",
      "progressJson",
      "createdAt",
      "updatedAt"
    ]);
  }

  return sheet;
}

function loadPlayer(sheet, profileKey) {
  if (!profileKey) {
    return { ok: false, error: "Missing profile key." };
  }

  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === profileKey) {
      return {
        ok: true,
        found: true,
        profile: {
          version: 1,
          profileKey: values[i][0],
          playerName: values[i][1],
          board: JSON.parse(values[i][2] || "[]"),
          progress: JSON.parse(values[i][3] || "{}"),
          createdAt: values[i][4],
          updatedAt: values[i][5]
        }
      };
    }
  }

  return { ok: true, found: false };
}

function listPlayers(sheet) {
  const values = sheet.getDataRange().getValues();
  const players = [];

  for (let i = 1; i < values.length; i += 1) {
    players.push({
      profileKey: values[i][0],
      playerName: values[i][1],
      board: JSON.parse(values[i][2] || "[]"),
      progress: JSON.parse(values[i][3] || "{}"),
      createdAt: values[i][4],
      updatedAt: values[i][5]
    });
  }

  return { ok: true, players };
}

function resetPlayer(sheet, profileKey) {
  if (!profileKey) {
    return { ok: false, error: "Missing profile key." };
  }

  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === profileKey) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }

  return { ok: false, error: "Player not found." };
}

function savePlayer(sheet, profile) {
  if (!profile || !profile.profileKey) {
    throw new Error("Missing profile.");
  }

  const values = sheet.getDataRange().getValues();
  const row = [
    profile.profileKey,
    profile.playerName || "",
    JSON.stringify(profile.board || []),
    JSON.stringify(profile.progress || {}),
    profile.createdAt || new Date().toISOString(),
    profile.updatedAt || new Date().toISOString()
  ];

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === profile.profileKey) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }

  sheet.appendRow(row);
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAdmin(adminKey) {
  return Boolean(adminKey) && adminKey === ADMIN_KEY;
}
