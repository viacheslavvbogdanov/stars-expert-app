#!/bin/bash
# development build

#npm install
#ionic cordova prepare

. ./env-dev.sh


echo --- Building Browser app
ionic cordova build browser --release --prod

# copy favicon to override default cordova icon
cp www/favicon.ico platforms/browser/www
cp -r ./platforms/browser/www ../webapp
pushd ../webapp
firebase deploy --only hosting -P default
popd

