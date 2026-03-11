#!/bin/bash

echo "Setting up Google Colab environment for WebIDE build..."

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install OpenJDK 17
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# Install Android SDK
export ANDROID_HOME=$HOME/android-sdk
mkdir -p $ANDROID_HOME
cd $ANDROID_HOME
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-*.zip
rm commandlinetools-linux-*.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null

# Set PATH
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses
yes | sdkmanager --licenses

# Install build tools and platform
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"

# Install Gradle
wget https://services.gradle.org/distributions/gradle-8.1.1-bin.zip
sudo mkdir -p /opt/gradle
sudo unzip -d /opt/gradle gradle-8.1.1-bin.zip
rm gradle-8.1.1-bin.zip
export PATH=$PATH:/opt/gradle/gradle-8.1.1/bin

echo "Setup complete. You can now run scripts/build-apk.sh"
