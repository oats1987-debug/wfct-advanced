# Wonderous FC Tales

Interactive bingo-card version of the WFCT challenge site.

## What It Does

- Loads challenge data from the same published Google Sheet CSV as the original WFCT challenge page.
- Creates a randomized 5x5 card for each player, with a free center square.
- Stores each player's board and checkbox progress locally and syncs them through the configured Google Apps Script save endpoint.
- Treats player names as unique and case-insensitive, so `Oats` and `oats` resolve to the same board and the wrong password is rejected.
- Tracks normal clears, power-up clears, and completed bingo lines.
- Lets players upload one screenshot proof for each challenge tile.
- Provides a public info page explaining the event rules and raffle tiers.
- Provides an organizer admin page for viewing saved boards, clearing a player's password, and resetting a player.
- Provides a separate challenge companion page that lists every challenge and the players who currently have it.
- Provides a separate read-only leaderboard page that summarizes powered squares, total squares, and completed lines without changing player saves.

## Persistence Note

The live site is configured to sync player boards through the `REMOTE_SAVE_ENDPOINT` in `index.html`, which writes saves to the private Google Sheet backing WFCT Advanced. If that endpoint is removed or left blank, the app falls back to browser-only storage.

## Proof Uploads

Create a Google Drive folder in the FC admin account, share it with the Apps Script account as Editor, then paste that folder ID into `PROOF_FOLDER_ID` in Apps Script before deploying a new version.

## Files

- `index.html` contains the full interactive bingo app.
- `info.html` contains the public rules and raffle guide.
- `Leaderboard.html` contains the public read-only leaderboard.
- `challenges.html` contains the public challenge companion list.
- `admin.html` contains the organizer-only board viewer.
- `F95kIyFJBfnXUKrHOXWKssgA5Q.jpg` is the shared background image from the original site.
- `apps-script-save-api.js` contains the Google Apps Script save/load API code to paste into Apps Script.

Site: https://oats1987-debug.github.io/wfct-advanced/
Info: https://oats1987-debug.github.io/wfct-advanced/info.html
Leaderboard: https://oats1987-debug.github.io/wfct-advanced/Leaderboard.html
Challenges: https://oats1987-debug.github.io/wfct-advanced/challenges.html
Admin: https://oats1987-debug.github.io/wfct-advanced/admin.html
