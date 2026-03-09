#!/bin/bash

echo "Building Android APK..."

cd android

# Build the APK using the system gradle
gradle assembleRelease

echo "Build complete. APK location: android/app/build/outputs/apk/release/app-release.apk"
