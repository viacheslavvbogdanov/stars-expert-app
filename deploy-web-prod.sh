#!/bin/bash
# PRODUCTION build

#npm install
#ionic cordova prepare

branch=$(git branch | grep \* | cut -d ' ' -f2)
echo Current git branch: $branch
if [ "$branch" == "master" ]
 then

. ./env-prod.sh

# build Android app
#. ./build-prod.sh
#TODO upload to GPlay

echo --- Building Browser app RELEASE
ionic cordova build browser --release --prod
# copy favicon to override default cordova icon
cp www/favicon.ico platforms/browser/www
cp -r ./platforms/browser/www ../webapp
pushd ../webapp
firebase deploy --only hosting -P production
popd

. ./env-dev.sh

  else
   echo "Will not publish from a branch other than master to production.\nPlease merge your changes into master and try again.\n\n"
  fi

