#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# build-apk.sh  —  Build the Android APK locally or in Google Colab
# ─────────────────────────────────────────────────────────────────────────────
set -e

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
if [ -n "$COLAB_GPU" ] || [ -d "/content" ]; then
  ENV="colab"
  echo "🌐 Environment: Google Colab"
else
  ENV="local"
  echo "💻 Environment: Local"
fi

# ── Java ────────────────────────────────────────────────────────────────────
if ! java -version 2>&1 | grep -q "17\|18\|19\|20\|21"; then
  echo "☕ Installing OpenJDK 17..."
  sudo apt-get update -qq
  sudo apt-get install -y openjdk-17-jdk -qq
fi
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
echo "☕ Java: $(java -version 2>&1 | head -1)"

# ── Android SDK ──────────────────────────────────────────────────────────────
if [ -z "$ANDROID_HOME" ] || [ ! -d "$ANDROID_HOME" ]; then
  echo "🤖 Installing Android SDK..."
  export ANDROID_HOME="$HOME/android-sdk"
  mkdir -p "$ANDROID_HOME/cmdline-tools"

  cd /tmp
  wget -q "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -O cmdline-tools.zip
  unzip -q cmdline-tools.zip
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
