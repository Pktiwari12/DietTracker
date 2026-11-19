# InformedDiet Branding Folder

Replace any of the files in this folder to update the app name, colors, in-app logo, and Android launcher icons everywhere in one step — without editing any screen code.

## Files in This Folder

| File | Required Size / Format | Used For |
| --- | --- | --- |
| `logo.png` | `1024 x 1024 px`, PNG | In-app logo (Splash, Login, Welcome, About) and standard app icon |
| `app_icon_foreground.png` | `1024 x 1024 px`, PNG (transparent background, artwork inside central 66% safe zone) | Android adaptive launcher icon foreground |
| `app_icon_background.png` | `1024 x 1024 px`, PNG | Android adaptive launcher icon background |
| `brand.json` | JSON | App name (`appName`), package ID, and brand colors (`primaryColor`, `primaryDarkColor`, `accentColor`) |

## How to Apply Your Changes

1. Replace the image file(s) and/or edit `branding/brand.json`.
2. Open a terminal in `DietTracker/mobile` and run:
   ```bash
   npm run apply-branding
   ```
   *(Or run `node branding/apply_branding.js` from the `DietTracker` root folder.)*
3. Restart Expo (`npx expo start -c`) or rebuild your Android APK/AAB.

The script automatically checks WCAG AA contrast (4.5:1) for white text on `primaryColor` and warns you if your chosen color is too light.
