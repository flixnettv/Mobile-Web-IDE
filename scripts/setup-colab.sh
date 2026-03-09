#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-colab.sh — Prepare Google Colab environment for APK build
# Usage in Colab: !bash scripts/setup-colab.sh && bash scripts/build-apk.sh
# ─────────────────────────────────────────────────────────────────────────────

echo "🌐 Setting up Google Colab for Android APK build..."

# Upload your project ZIP to Colab first, then run:
# !unzip Mobile-Web-IDE-Production.zip
# !cd ide && bash scripts/setup-colab.sh

apt-get update -qq
apt-get install -y openjdk-17-jdk unzip wget -qq

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc

echo "✅ Colab environment ready. Now run:"
echo "   bash scripts/build-apk.sh"
