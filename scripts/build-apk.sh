#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# build-apk.sh  —  Build the Android APK locally or in Google Colab
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="$PROJECT_ROOT/android"
GRADLE_VERSION="8.4"
ANDROID_API="34"
BUILD_TOOLS="34.0.0"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Mobile Web IDE — APK Builder           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Detect environment ──────────────────────────────────────────────────────
if [ -n "${COLAB_GPU:-}" ] || [ -d "/content" ]; then
  ENV="colab"
  echo "🌐 Environment: Google Colab"
else
  ENV="local"
  echo "💻 Environment: Local"
fi

# ── Java ────────────────────────────────────────────────────────────────────
JAVA_MAJOR="$(java -version 2>&1 | awk -F '[\".]' '/version/ {print $2}')"
if [ -z "$JAVA_MAJOR" ] || [ "$JAVA_MAJOR" -lt 17 ]; then
  echo "☕ Installing OpenJDK 17..."
  sudo apt-get update -qq
  sudo apt-get install -y openjdk-17-jdk -qq
fi
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
echo "☕ Java: $(java -version 2>&1 | head -1)"

# ── Android SDK ──────────────────────────────────────────────────────────────
if [ -z "${ANDROID_HOME:-}" ] || [ ! -d "$ANDROID_HOME" ]; then
  echo "🤖 Installing Android SDK..."
  export ANDROID_HOME="$HOME/android-sdk"
  mkdir -p "$ANDROID_HOME/cmdline-tools"

  cd /tmp
  SDK_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  SDK_TOOLS_ZIP="${ANDROID_CMDLINE_TOOLS_ZIP:-/tmp/cmdline-tools.zip}"

  if [ ! -f "$SDK_TOOLS_ZIP" ]; then
    echo "⬇️ Downloading Android command line tools..."
    if ! wget -q "$SDK_TOOLS_URL" -O "$SDK_TOOLS_ZIP"; then
      echo "❌ Failed to download Android command line tools from: $SDK_TOOLS_URL"
      echo "   If your environment blocks direct downloads, pre-download the ZIP and run:"
      echo "   ANDROID_CMDLINE_TOOLS_ZIP=/path/to/commandlinetools.zip bash scripts/build-apk.sh"
      exit 1
    fi
  else
    echo "✅ Using pre-downloaded Android tools ZIP: $SDK_TOOLS_ZIP"
  fi

  if ! unzip -tq "$SDK_TOOLS_ZIP" > /dev/null 2>&1; then
    echo "⚠️ Existing tools ZIP is invalid. Re-downloading..."
    if ! wget -q "$SDK_TOOLS_URL" -O "$SDK_TOOLS_ZIP"; then
      echo "❌ Failed to download a valid Android tools ZIP from: $SDK_TOOLS_URL"
      exit 1
    fi
  fi

  if [ "$SDK_TOOLS_ZIP" != "/tmp/cmdline-tools.zip" ]; then
    cp "$SDK_TOOLS_ZIP" /tmp/cmdline-tools.zip
  fi
  unzip -q /tmp/cmdline-tools.zip
  mv cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"

  export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

  # Accept licenses and install components
  yes | sdkmanager --licenses > /dev/null 2>&1 || true
  sdkmanager "platform-tools" "platforms;android-${ANDROID_API}" "build-tools;${BUILD_TOOLS}" --sdk_root="$ANDROID_HOME"
  echo "✅ Android SDK installed"
else
  export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
  echo "✅ Android SDK found at: $ANDROID_HOME"
fi

# ── Gradle ──────────────────────────────────────────────────────────────────
if ! command -v gradle &> /dev/null && [ ! -f "$ANDROID_DIR/gradlew" ]; then
  echo "🔧 Installing Gradle $GRADLE_VERSION..."
  cd /tmp
  wget -q "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" -O gradle.zip
  unzip -q gradle.zip
  sudo mv "gradle-${GRADLE_VERSION}" /opt/gradle
  export PATH="$PATH:/opt/gradle/bin"
  echo "✅ Gradle installed"

  # Generate wrapper
  cd "$ANDROID_DIR"
  gradle wrapper --gradle-version="$GRADLE_VERSION"
fi

# ── Debug keystore ────────────────────────────────────────────────────────────
if [ ! -f "$ANDROID_DIR/debug.keystore" ]; then
  echo "🔑 Generating debug keystore..."
  keytool -genkey -v \
    -keystore "$ANDROID_DIR/debug.keystore" \
    -alias androiddebugkey \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass android -keypass android \
    -dname "CN=Mobile Web IDE, OU=Dev, O=WebIDE, L=Unknown, S=Unknown, C=US" \
    > /dev/null 2>&1
  echo "✅ Debug keystore created"
fi

# ── Build ─────────────────────────────────────────────────────────────────────
cd "$ANDROID_DIR"
echo ""
echo "🔨 Building Debug APK..."
if [ -f "gradlew" ]; then
  chmod +x gradlew
  ./gradlew assembleDebug --no-daemon 2>&1 | tail -20
else
  gradle assembleDebug --no-daemon 2>&1 | tail -20
fi

echo ""
echo "🚀 Building Release APK..."
if [ -f "gradlew" ]; then
  ./gradlew assembleRelease --no-daemon 2>&1 | tail -10
else
  gradle assembleRelease --no-daemon 2>&1 | tail -10
fi

# ── Output ────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Build Successful!                   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "📦 APK files:"
find "$ANDROID_DIR/app/build/outputs/apk" -name "*.apk" | while read apk; do
  size=$(du -sh "$apk" | cut -f1)
  echo "  [$size] $apk"
done

# Copy to project root for easy access
find "$ANDROID_DIR/app/build/outputs/apk" -name "*.apk" -exec cp {} "$PROJECT_ROOT/" \;
echo ""
echo "📁 APKs copied to project root: $PROJECT_ROOT"
echo ""
echo "📲 To install on device:"
echo "   adb install $PROJECT_ROOT/app-debug.apk"
echo "   — or —"
echo "   Transfer APK to your device and install manually"
