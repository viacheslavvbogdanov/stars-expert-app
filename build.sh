#!/bin/bash
# development build

#npm install
#ionic cordova prepare

. ./env-dev.sh


#echo --- Building Android app
ionic cordova build android
# copy debug apk to hosting
cp ./platforms/android/app/build/outputs/apk/debug/app-debug.apk ../webapp/www/starsexpert.apk
