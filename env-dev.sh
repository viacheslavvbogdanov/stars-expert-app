#!/bin/bash
# development environment

echo --- Switching to development environment ---

cp google-services-dev.json google-services.json
cp google-services.json platforms/android/app/
cp www/env-dev.js www/env.js

cordova-xml setId expert.stars.dev
cordova-xml setName 'Stars Dev'

