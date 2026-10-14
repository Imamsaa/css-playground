# ICT Al Firdaus CSS Playground — JSON account backend

This folder contains the Google Apps Script API used by the **Akun & Progres** button. It stores student records in a single **private JSON file in the Google Drive account that deploys the script**. The JSON file is not published in this repository.

## One-time setup by the administrator

1. Open [Google Apps Script](https://script.google.com/home) and create a new standalone project.
2. Open `Code.gs` in this repository, copy its complete contents, and replace the starter code in the Apps Script editor.
3. Save the project. Select `setupDatabase` in the function dropdown and click **Run**. Approve the requested Google Drive permission. This creates the private JSON database file.
4. Click **Deploy → New deployment → Web app**.
5. Set **Execute as** to **Me**. Set **Who has access** to **Anyone** so students can create and restore accounts without signing in to Google.
6. Click **Deploy**, complete any required authorization, and copy the Web app URL ending in `/exec`.
7. In `index.html`, find `const ACCOUNT_API_URL = 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';` and replace the placeholder with the URL you copied. Commit that change to the repository. Until this URL is configured, the account buttons remain disabled and the playground continues to save locally.

After changing the Apps Script code later, use **Deploy → Manage deployments → Edit → New version → Deploy** so the live URL uses the updated script.

## How the account works

- A student clicks **Akun & Progres**, enters their name, and receives a code such as `ICT-ABCD2-FGHJK`.
- The account is saved in the JSON database with the student's name, CSS editor content by task, completed tasks, current task, and timestamps.
- On another device, the student clicks **Akun & Progres → Pulihkan progres dengan kode** and enters the same code.
- If a device already remembers an account, the playground attempts to load the latest remote state on startup.
- Editor changes are saved automatically after the student pauses typing. They can also choose **Simpan progres sekarang** from the account panel.
- The JSON file is stored privately in the owner's Drive. It does not need to be shared publicly.

## Important notes

- The account code works like a password. Anyone who has the code can read and overwrite that student's saved progress, so students should keep it private. There is no separate email or password recovery.
- The code only stores a display name and playground progress. Do not use full addresses, phone numbers, or other sensitive student information as the name.
- For predictable results, use an account on one device at a time. If two devices save at once, the most recent save wins for the current-task and completion state.
- The frontend uses a hidden HTML form target for the Apps Script request so the browser does not need to read a cross-origin `fetch()` response.
- The first script run creates the Drive file and requests authorization. Keep the JSON file in the deploying administrator's Drive and do not share it publicly.
- A static GitHub Pages site cannot safely write to a private JSON file by itself. This backend is the small server-side component required for cross-device persistence.
