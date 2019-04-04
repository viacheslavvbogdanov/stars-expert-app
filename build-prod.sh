#!/bin/bash
# PRODUCTION build

# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

#npm install
#ionic cordova prepare

branch=$(git branch | grep \* | cut -d ' ' -f2)
echo Current git branch: $branch
if [ "$branch" == "master" ]
 then

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
exit 0

  else
       echo "ERROR: Will not publish from a branch other than master to production. Please merge your changes into master and try again."
       exit 1
  fi

