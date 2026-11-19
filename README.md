# InformedDiet (`DietTracker/` Workspace)

## 1. Folder & File Placement (`DietTracker/`)

Extract the provided zip archive directly into your existing `DietTracker` folder so it has the following structure:

| Path inside `DietTracker/` | Purpose |
| --- | --- |
| `README.md` | Quick-start guide (this file) |
| `branding/logo.png` |1024×1024 InformedDiet logo |
| `branding/app_icon_foreground.png` | Android adaptive launcher icon foreground (66% safe zone) |
| `branding/app_icon_background.png` | Android adaptive launcher icon background (`#2E7D32`) |
| `branding/brand.json` | Single source of truth for app name (`InformedDiet`) and brand colors |
| `branding/apply_branding.js` | Automation script (`npm run apply-branding`) with WCAG contrast check |
| `mobile/` | Complete React Native + Expo (TypeScript) Android app |
| `mobile/App.tsx` | Root app entrypoint |
| `mobile/app.json` | Expo Android config (auto-updated by `apply-branding`) |
| `mobile/package.json` | Dependencies (`expo`, `expo-camera`, `expo-image-picker`, `expo-print`, `react-native-svg`, etc.) |
| `mobile/src/config/brand.ts` | Auto-generated from `branding/brand.json` |
| `mobile/src/config/api.ts` | Backend REST client (`API_BASE_URL`) + built-in offline YOLO demo fallback |
| `mobile/src/context/AppContext.tsx` | State management, AsyncStorage persistence, offline photo queue, streaks, reminders |
| `mobile/src/i18n/` | Full English (`en`) and Hindi (`hi`) localization |
| `mobile/src/theme/ThemeContext.tsx` | System, Light, and Dark Mode themes |
| `mobile/src/utils/` | Mifflin-St Jeor target calculator, IFCT+USDA bilingual food DB, What-To-Eat-Next engine, unit converter, PDF exporter |
| `mobile/src/components/` | `CalorieRing`, `MacroBar`, `Charts` (4 pure-SVG charts), `BoundingBoxOverlay`, `CommonUI` |
| `mobile/src/navigation/AppNavigator.tsx` | Auth → Onboarding → 5-Tab Bar (`Home`, `Food`, central Camera button, `Exercise`, `History`, `Reports`) |
| `mobile/src/screens/` |(`Splash`, `Welcome`, `Login`, `Register`, `Otp`, `ForgotPassword`, `Onboarding`, `GoalSummary`, `Home`, `Food`, `Camera`, `Analyzing`, `ReviewMeal`, `ManualSearch`, `Water`, `Weight`, `Exercise`, `History`, `Reports`, `Micronutrients`, `ProfileSettings`) |
| `backend/` | Python FastAPI server + SQLite/PostgreSQL models + YOLO service + Admin Panel |
| `backend/app/main.py` | FastAPI server entrypoint |
| `backend/app/models.py` | All 14+ database tables |
| `backend/app/routers/api_v1.py` | All `/v1/...` REST API endpoints (Section 10) |
| `backend/app/routers/admin.py` | Section 12 Admin Panel backend & HTML dashboard (`/admin`) |
| `backend/app/services/` | `target_calculator.py`, `nutrition_seed.py`, `yolo_service.py`, `suggestion_engine.py`, `pdf_exporter.py` |
| `backend/yolo_training/train_yolo.py` | Ultralytics YOLO fine-tuning & ONNX export script |
| `backend/tests/test_core.py` | Pytest unit test suite for formulas, safe limits, METs, and allergy-safe suggestions |

---

## 2. Step-by-Step: Preview the Mobile App on Android (Expo Go)

### Prerequisites
1. Install **Node.js (LTS v20+)** on your computer.
2. Install the **Expo Go** app from the Google Play Store on your Android phone.
3. Make sure your computer and Android phone are on the **same Wi-Fi network**.

### Run the App
Open a terminal in your `DietTracker/mobile` folder and run:

```bash
cd DietTracker/mobile
npm install
npm run apply-branding
npx expo start
```

1. A QR code will appear in your terminal.
2. Open **Expo Go** on your Android phone and tap **Scan QR code**.
3. **InformedDiet** will load immediately on your phone!

> **Works immediately even without starting the backend:** The mobile app includes the full offline IFCT+USDA food database, Mifflin-St Jeor target calculator, suggestion engine, PDF export, and a smart photo recognition fallback so you can test every single screen (including Camera → Analyzing → Review with bounding boxes & allergy alerts) right away.

---

## 3. Step-by-Step: Run the FastAPI Backend & Admin Panel (Optional for Local Testing, Required for Server YOLO)

### Prerequisites
- Install **Python 3.11+**.

### Start the Server
Open a second terminal in `DietTracker/backend`:

```bash
cd DietTracker/backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **OpenAPI / Swagger Docs**: Open `http://localhost:8000/docs` in your browser.
- **Admin Panel**: Open `http://localhost:8000/admin` (default login: `admin` / `changeme123`, configurable in `.env`).
- **Run Unit Tests**: Run `pytest` inside `DietTracker/backend`.

### Connect Your Android Phone to the Local Backend
1. Find your computer's local Wi-Fi IP address (`ipconfig` on Windows, `ifconfig` on macOS/Linux — e.g. `192.168.1.15`).
2. Open `DietTracker/mobile/src/config/api.ts` and update:
   ```ts
   export const API_BASE_URL = 'http://192.168.1.15:8000';
   ```
3. Reload Expo Go on your phone.

---
