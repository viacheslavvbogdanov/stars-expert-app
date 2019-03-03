###ionic cordova build android

when error "Cannot read property 'manifest' of undefined
hooks/lib/android/manifestWriter.js
line #21 change to
var pathToManifest = path.join(cordovaContext.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
