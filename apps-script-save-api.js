const SPREADSHEET_ID = "1f2HYxfmWESkjBKKi9rVzM8cnjzfunyivPHcDYzE_62M";
const SHEET_NAME = "Players";
const ADMIN_KEY = "CHANGE_THIS_TO_A_PRIVATE_ADMIN_PASSWORD";
const PROOF_FOLDER_ID = "PASTE_FC_ADMIN_DRIVE_FOLDER_ID_HERE";

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

    if (payload.action === "uploadProof") {
      uploadProof(sheet, payload);
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
    const payload = {};
    Object.keys(e.parameter).forEach((key) => {
      payload[key] = e.parameter[key];
    });
    payload.profile = e.parameter.profile ? JSON.parse(e.parameter.profile) : null;
    return payload;
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
  const incomingProgress = profile.progress || {};
  const row = [
    profile.profileKey,
    profile.playerName || "",
    JSON.stringify(profile.board || []),
    JSON.stringify(incomingProgress),
    profile.createdAt || new Date().toISOString(),
    profile.updatedAt || new Date().toISOString()
  ];

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === profile.profileKey) {
      row[3] = JSON.stringify(mergeProofProgress(JSON.parse(values[i][3] || "{}"), incomingProgress));
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }

  sheet.appendRow(row);
}

function uploadProof(sheet, payload) {
  if (!PROOF_FOLDER_ID || PROOF_FOLDER_ID === "PASTE_FC_ADMIN_DRIVE_FOLDER_ID_HERE") {
    throw new Error("Proof folder is not configured.");
  }

  const profileKey = payload.profileKey;
  const cellIndex = payload.cellIndex;

  if (!profileKey || cellIndex === undefined || !payload.dataUrl) {
    throw new Error("Missing proof upload data.");
  }

  const match = String(payload.dataUrl).match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data.");
  }

  const mimeType = match[1];
  if (!/^image\//.test(mimeType)) {
    throw new Error("Proof must be an image.");
  }

  const bytes = Utilities.base64Decode(match[2]);
  const safeName = String(payload.fileName || "proof.png").replace(/[^\w.\- ]+/g, "_");
  const playerName = String(payload.playerName || "player").replace(/[^\w.\- ]+/g, "_");
  const fileName = `${playerName}-tile-${Number(cellIndex) + 1}-proof-${Date.now()}-${safeName}`;
  const file = DriveApp.getFolderById(PROOF_FOLDER_ID)
    .createFile(Utilities.newBlob(bytes, mimeType, fileName));

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  updateProofLink(sheet, profileKey, cellIndex, file.getUrl(), fileName);
}

function updateProofLink(sheet, profileKey, cellIndex, proofUrl, fileName) {
  const values = sheet.getDataRange().getValues();
  const proofKey = `proof-${cellIndex}`;
  const proofNameKey = `proofName-${cellIndex}`;

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === profileKey) {
      const progress = JSON.parse(values[i][3] || "{}");
      progress[proofKey] = proofUrl;
      progress[proofNameKey] = fileName;
      sheet.getRange(i + 1, 4).setValue(JSON.stringify(progress));
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
      return;
    }
  }

  throw new Error("Player profile was not found.");
}

function mergeProofProgress(existingProgress, incomingProgress) {
  const merged = Object.assign({}, incomingProgress);

  Object.keys(existingProgress || {}).forEach((key) => {
    const isProofKey = key.indexOf("proof-") === 0 || key.indexOf("proofName-") === 0;
    if (isProofKey && (!merged[key] || merged[key] === "Upload sent")) {
      merged[key] = existingProgress[key];
    }
  });

  return merged;
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAdmin(adminKey) {
  return Boolean(adminKey) && adminKey === ADMIN_KEY;
}

function testProofFolderAccess() {
  const folder = DriveApp.getFolderById(PROOF_FOLDER_ID);
  const file = folder.createFile(
    Utilities.newBlob("proof upload permission test", "text/plain", "wfct-proof-permission-test.txt")
  );
  Logger.log(`${folder.getName()} / ${file.getName()}`);
  file.setTrashed(true);
}
