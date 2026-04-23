# Wonderous FC Tales

Interactive bingo-card version of the WFCT challenge site.

## What It Does

- Loads challenge data from the same published Google Sheet CSV as the original WFCT challenge page.
- Creates a randomized 5x5 card for each player, with a free center square.
- Stores each player's board and checkbox progress in browser storage using their name plus optional password as the profile key.
- Tracks normal clears, power-up clears, and completed bingo lines.
- Lets players upload one screenshot proof for each challenge tile.
- Provides an organizer admin page for viewing saved boards and resetting a player.

## Persistence Note

This first version is static-site safe: saves persist in the same browser. For the same board to follow a player across devices, the `REMOTE_SAVE_ENDPOINT` hook in `index.html` can be connected to a small Google Apps Script or another backend that writes profile data to a private sheet.

## Proof Uploads

Create a Google Drive folder in the FC admin account, share it with the Apps Script account as Editor, then paste that folder ID into `PROOF_FOLDER_ID` in Apps Script before deploying a new version.

## Files

- `index.html` contains the full interactive bingo app.
- `admin.html` contains the organizer-only board viewer.
- `F95kIyFJBfnXUKrHOXWKssgA5Q.jpg` is the shared background image from the original site.
- `apps-script-save-api.js` contains the Google Apps Script save/load API code to paste into Apps Script.

Site: https://oats1987-debug.github.io/wfct-advanced/
Admin: https://oats1987-debug.github.io/wfct-advanced/admin.html
