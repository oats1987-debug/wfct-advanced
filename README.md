# WFCT Advanced

Interactive bingo-card version of the WFCT challenge site.

## What It Does

- Loads challenge data from the same published Google Sheet CSV as the original WFCT challenge page.
- Creates a randomized 5x5 card for each player, with a free center square.
- Stores each player's board and checkbox progress in browser storage using their name plus optional password as the profile key.
- Tracks normal clears, power-up clears, and completed bingo lines.

## Persistence Note

This first version is static-site safe: saves persist in the same browser. For the same board to follow a player across devices, the `REMOTE_SAVE_ENDPOINT` hook in `index.html` can be connected to a small Google Apps Script or another backend that writes profile data to a private sheet.

## Files

- `index.html` contains the full interactive bingo app.
- `F95kIyFJBfnXUKrHOXWKssgA5Q.jpg` is the shared background image from the original site.
Site: https://oats1987-debug.github.io/wfct-advanced/
