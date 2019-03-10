#!/bin/bash
# PRODUCTION build

#npm install
#ionic cordova prepare

. ./env-dev.sh


echo --- Running Android app DEV
ionic cordova run android
