# Gesture-Capture-and-Analysis

AR HAND Gesture Capture and Analysis

To download files from heroku server:
## On CMD:
Step 1: Login in heroku server via

`heroku login`

Step 2: open your app directory inside CMD:


`heroku run bash -a <appname>`

(current appname = hand-gesture-capture-analysis)

Step 3: To list out project directory:

`ls`

Step 4: Go to result directory:

`cd results/`

Step 5: Zip the directory:

`zip -r <zip-filename>.zip <directory-name>`

Step 6: Send zip file to transfer.sh server

`curl --upload-file mediapipe-zip-1.zip https://transfer.sh/mediapipe-zip-1.zip`

(caution: file would moved to transfer.sh)

Step 6 would result in url like this:

`https://transfer.sh/abcd/<zip-filename>.zip`

## Download via link:
paste generated link in step 6 to your pc's browser:

`https://transfer.sh/abcd/<zip-filename>.zip`

## Down via CMD:
Step 1: Change directory where you want to download your zip.

`cd D:`

Step 2: Download your zip file from transfer.sh srver

`curl https://transfer.sh/jxv25/<zip-filename>.zip -o <savefile-name>.zip`

(in most cases: savefile-name = zip-filename)
