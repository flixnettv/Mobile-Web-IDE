# 📱 Android APK Build Guide

## Methods to Build the APK

---

## ✅ Method 1: GitHub Actions (Easiest — Recommended)

**Automatic build on every push:**

1. Push your code to GitHub
2. Go to **Actions** tab → `Build Android APK` workflow
3. Wait ~5 minutes for the build
4. Download APK from **Artifacts** section

**Manual trigger:**
1. Go to **Actions** → `Build Android APK`
2. Click **Run workflow**
3. Download from Artifacts

---

## ✅ Method 2: Google Colab (No local setup needed)

1. Upload `Mobile-Web-IDE-Production.zip` to Google Colab
2. Run in a Colab cell:

```python
!unzip Mobile-Web-IDE-Production.zip
%cd ide
!bash scripts/setup-colab.sh
!bash scripts/build-apk.sh
```

3. Download `app-debug.apk` or `app-release.apk` from the files panel

---

## ✅ Method 3: Local Linux/Mac

**Prerequisites:** Java 17+, internet connection

```bash
cd /path/to/ide
bash scripts/build-apk.sh
```

The script auto-downloads Android SDK + Gradle if not installed.

---

## ✅ Method 4: Docker

```bash
docker run --rm \
  -v $(pwd)/android:/project/android \
  -v $(pwd)/scripts:/project/scripts \
  -w /project \
  mingc/android-build-box:latest \
  bash scripts/build-apk.sh
```

---

## 📲 Installing the APK

### On Emulator (Android Studio)
```bash
adb install app-debug.apk
```

### On Real Device
1. Transfer APK to device (USB, email, Google Drive)
2. Go to **Settings → Security → Install unknown apps**
3. Allow your file manager
4. Tap the APK to install

---

## 🔧 Configuring the Server URL

Edit `android/app/src/main/java/com/webide/MainActivity.kt`:

```kotlin
// Change this line:
private const val SERVER_URL = "http://10.0.2.2:3000"

// To your actual server:
private const val SERVER_URL = "https://your-server.com"
```

| Environment | URL |
|---|---|
| Android Emulator | `http://10.0.2.2:3000` |
| Same WiFi network | `http://192.168.x.x:3000` |
| Ngrok tunnel | `https://xxxx.ngrok.io` |
| Production server | `https://your-domain.com` |

---

## 📦 APK Output Locations

After build:
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`
- Copied to: project root (`app-debug.apk`, `app-release.apk`)

---

## 🔏 Release Signing (Production)

For Play Store distribution, set environment variables:

```bash
export KEYSTORE_FILE=my-release.keystore
export KEYSTORE_PASSWORD=your-password
export KEY_ALIAS=my-key-alias
export KEY_PASSWORD=your-key-password

bash scripts/build-apk.sh
```

Or add these as **GitHub Secrets** in your repository settings.
