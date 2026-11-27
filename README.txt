IELTS TRACKER — START HERE

WHAT'S INCLUDED
- Responsive IELTS practice tracker for desktop and iPad.
- Listening and Academic Reading: enter wrong answers (0–40); the app estimates the band.
- You can save only one section, or just a Speaking/Writing practice day.
- Daily Speaking checkbox plus separate Writing Task 1 and Task 2 tracking, question-type selectors, and optional topic notes.
- History table and a simple score trend chart.
- Export/import JSON backup.
- PWA manifest and service worker for installability/offline caching.

IMPORTANT DATA NOTE
This first version saves data in the browser on the device you use (localStorage).
It does NOT automatically sync between your iPad and computer. Use Export backup on one device
and Import backup on the other to transfer records. Do not clear browser site data unless you
have exported a backup. Cloud sync can be added in a later version.

RUN LOCALLY
The easiest way is to publish the folder using GitHub Pages (instructions below).
For local testing, open index.html in a browser. Some PWA features require HTTPS or localhost.

PUBLISH WITH GITHUB PAGES (FREE)
1. Sign in to GitHub and create a new public repository, e.g. ielts-tracker.
2. Upload ALL files in this folder to the repository's root (not the zip file).
3. Open the repository Settings > Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Select branch main and folder /(root), then Save.
6. Wait for the published URL shown on the Pages screen.
7. Open that HTTPS URL on your computer and iPad.

ADD TO IPAD HOME SCREEN
1. Open the published URL in Safari.
2. Tap Share.
3. Choose Add to Home Screen.
4. Confirm Add.

USE
- Enter the number of wrong answers, not correct answers.
- Leave Listening or Reading blank if you did not do that section.
- Save the record. The latest score cards update automatically.
- Export backup regularly. Import the JSON backup on another device to copy records.

SCORING
This uses common approximate IELTS Academic Listening and Reading raw-score conversion tables.
Exact band boundaries can vary slightly by test. General Training Reading uses a different
conversion table and is not implemented in this version.

NEXT DEVELOPMENT IDEAS
- Cloud sync between devices (requires a backend and account/security setup).
- Separate General Training Reading mode.
- Speaking/Writing notes and task types.
- Weekly calendar and target progress.
