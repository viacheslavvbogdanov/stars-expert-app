#!/bin/bash
# PRODUCTION build

echo !!! Switching to PRODUCTION environment !!!
cp google-services-prod.json google-services.json
cp google-services.json platforms/android/app/
cp www/env-prod.js www/env.js

cordova-xml setId expert.stars
cordova-xml setName 'Stars'
