#!/bin/bash
# PRODUCTION build

#npm install
#ionic cordova prepare

. ./env-prod.sh


#echo --- Building Android app RELEASE
#ionic cordova build android --release --prod

#APKDir=platforms/android/app/build/outputs/apk/release
#jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore stars-release-key.jks ${APKDir}/app-release-unsigned.apk stars-alias
#rm ${APKDir}/starsexpert.apk
#zipalign -v 4 ${APKDir}/app-release-unsigned.apk ${APKDir}/starsexpert.apk
#apksigner verify ${APKDir}/starsexpert.apk
#aapt dump badging ${APKDir}/starsexpert.apk | grep version


#TODO upload to GPlay

echo --- Building Browser app RELEASE
ionic cordova build browser --release --prod
# copy favicon to override default cordova icon
cp www/favicon.ico platforms/browser/www
cp -r ./platforms/browser/www ../webapp
pushd ../webapp
firebase deploy --only hosting -P production
popd

