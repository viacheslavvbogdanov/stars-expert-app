#!/bin/bash
# PRODUCTION build


# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command completed with exit code $?."' EXIT


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

echo "SUCCESS"


  else
   echo "ERROR: Will not publish from a branch other than master to production. Please merge your changes into master and try again."
   exit 1

  fi

