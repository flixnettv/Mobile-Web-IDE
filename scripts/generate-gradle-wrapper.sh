#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# generate-gradle-wrapper.sh
# Run once to create the Gradle wrapper files needed for CI/CD
# ─────────────────────────────────────────────────────────────────────────────

set -e

GRADLE_VERSION="8.4"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$(dirname "$SCRIPT_DIR")/android"

echo "📦 Installing Gradle $GRADLE_VERSION..."

cd /tmp
wget -q "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" -O gradle.zip
unzip -q gradle.zip
sudo mv "gradle-${GRADLE_VERSION}" /opt/gradle-wrapper
export PATH=$PATH:/opt/gradle-wrapper/bin

echo "🔧 Generating Gradle wrapper in android/..."
cd "$ANDROID_DIR"
gradle wrapper --gradle-version="$GRADLE_VERSION" --distribution-type=bin

echo "✅ Gradle wrapper generated:"
ls -la gradlew gradlew.bat gradle/wrapper/
echo ""
echo "Now commit these files to your repo:"
echo "  git add android/gradlew android/gradlew.bat android/gradle/"
echo "  git commit -m 'chore: add Gradle wrapper'"
