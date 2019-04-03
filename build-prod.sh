#!/bin/bash
# PRODUCTION build

#npm install
#ionic cordova prepare

. ./env-prod.sh


echo --- Building Android app RELEASE
ionic cordova build android --release --prod

APKDir=platforms/android/app/build/outputs/apk/release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore stars-release-key.jks ${APKDir}/app-release-unsigned.apk stars-alias
rm ${APKDir}/starsexpert.apk
zipalign -v 4 ${APKDir}/app-release-unsigned.apk ${APKDir}/starsexpert.apk
apksigner verify ${APKDir}/starsexpert.apk
aapt dump badging ${APKDir}/starsexpert.apk | grep version

. ./env-dev.sh

#TODO upload to GPlay

