#!/bin/bash
# development build

#npm install
#ionic cordova prepare

. ./env-dev.sh


#echo --- Building Android app
ionic cordova build android
# copy debug apk to hosting
cp ./platforms/android/app/build/outputs/apk/debug/app-debug.apk ../webapp/www/starsexpert.apk

echo --- Building Browser app
ionic cordova build browser --prodgit

# copy favicon to override default cordova icon
cp www/favicon.ico platforms/browser/www
cp -r ./platforms/browser/www ../webapp
pushd ../webapp
firebase deploy --only hosting -P default
popd

