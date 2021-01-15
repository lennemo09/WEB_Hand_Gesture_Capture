const dropDownElement = document.querySelector('#posOptions');
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 500;
const states = {
    IDLE: 'idle',
    RECORDING: 'recording'
}
let currentState = states.IDLE;
let initTimer = new Date();
let sampleData = "";
let predictionStack = [];
let recordDataStack = [];
let intervalID = null;
const months = ["JAN", "FEB", "MAR","APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
let buidInProcess = false;
let videoWidth, videoHeight, rafID, ctx, canvas, ANCHOR_POINTS,
    scatterGLHasInitialized = false, scatterGL, fingerLookupIndices = {
      thumb: [0, 1, 2, 3, 4],
      indexFinger: [0, 5, 6, 7, 8],
      middleFinger: [0, 9, 10, 11, 12],
      ringFinger: [0, 13, 14, 15, 16],
      pinky: [0, 17, 18, 19, 20]
};
const stats = new Stats();
let model;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function getFormattedDateTime(dt = Date){
    return dt.getDate() + "-" + 
        months[dt.getMonth()] + "-" + 
        dt.getFullYear() + " " + 
        dt.getHours() + "-" + 
        dt.getMinutes() + "-" + 
        dt.getSeconds();
}

function drawPoint(y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
}

function drawPath(points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }
  
    if (closePath) {
      region.closePath();
    }
    ctx.stroke(region);
}
  
function drawKeypoints(keypoints) {
    const keypointsArray = keypoints;
  
    for (let i = 0; i < keypointsArray.length; i++) {
      const y = keypointsArray[i][0];
      const x = keypointsArray[i][1];
      drawPoint(x - 2, y - 2, 3);
    }
  
    const fingers = Object.keys(fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
      const finger = fingers[i];
      const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
      drawPath(points, false);
    }
}

async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
}

async function setupCamera(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
        facingMode: 'user',
        // Only setting the video to a specified size in order to accommodate a
        // point cloud, so on mobile devices accept the default size.
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT
        },
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
        resolve(video);
        };
    });
}

// From MediaPipe API. Responsible for hand pose capture.
const landmarksRealTime = async (video) => {
    async function frameLandmarks() {
        ctx.drawImage(
            video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width,
            canvas.height);
        const predictions = await model.estimateHands(video);
        if (predictions.length > 0) {
            const result = predictions[0].landmarks;    
            // Saving recording results
            if (currentState == states.RECORDING) {
                const elapsedTime = (new Date() - initTimer);
                predictionStack.push([elapsedTime, isLeftHandUsed, predictions[0].landmarks]);
            }
            // Rest of the API code to draw the points on camera.
            drawKeypoints(result, predictions[0].annotations);
    
            if (scatterGL != null) {
                const pointsData = result.map(point => {
                    return [-point[0], -point[1], -point[2]];
                });
        
                const dataset = new ScatterGL.Dataset([...pointsData, ...ANCHOR_POINTS]);
        
                if (!scatterGLHasInitialized) {
                    scatterGL.render(dataset);
        
                    const fingers = Object.keys(fingerLookupIndices);
        
                    scatterGL.setSequences(fingers.map(finger => ({
                        indices: fingerLookupIndices[finger]
                    })));
                    scatterGL.setPointColorer((index) => {
                        if (index < pointsData.length) {
                            return 'steelblue';
                        }
                        return 'white';  // Hide.
                    });
                } else {
                    scatterGL.updateDataset(dataset);
                }
                scatterGLHasInitialized = true;
            }
        }
        rafID = requestAnimationFrame(frameLandmarks);
    };
    frameLandmarks();
};

async function startCamera() {
    // Prepare camera.
    tf.ENV.set("WEBGL_CPU_FORWARD", true);
    await tf.setBackend("webgl");
    model = await handpose.load();
    model.pipeline.maxHandsNumber = 2;
    let video;

    try {
        video = await loadVideo();
        if ($("#cameraAccess").css("display") == "block")
            $("#cameraAccess").css("display", "none");
    } catch (e) {
        alert("A camera device was not found. Please make sure you have a camera connected, then refresh the page.");
        throw e;
    }

    // Setup video and camera.
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    canvas = document.getElementById('output');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    video.width = videoWidth;
    video.height = videoHeight;

    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Show video.
    $("#loading").css("display", "none");
    if ($("#videoContent").css("display") == "none") {
        $("#record_status").text("Status: Not Recording (Press SPACEBAR to Start)");
        $("#videoContent").css("display", "block");
        $("#camBtn").css("display", "block");
    }
    // document.getElementById('canvas-wrapper').style.display = "inline-block";
    // document.getElementById("scatter-gl-container").style.display = "inline-block";

    // Start displaying.
    landmarksRealTime(video);
}

function toggleVideo(){
    if ($("#camBtn").hasClass("cam_button")){
        document.getElementById('video').srcObject.getTracks().forEach(track => track.stop());
        $("#camBtn").removeClass("cam_button");
        $("#camBtn").addClass("cam_button_reactivate");
        $("#camBtn").attr("value", "Start Camera");
        $("#record_status").text("Status: Reactivate camera to Start");
    } else {
        startCamera();
        $("#camBtn").addClass("cam_button");
        $("#camBtn").removeClass("cam_button_reactivate");
        $("#camBtn").attr("value", "Stop Camera");
        $("#record_status").text("Status: Not Recording (Press SPACEBAR to Start)");
    }
}

function showInstructionImage() {
    // References to directory and element.
    const instruction_dir = "/imgs/instructions/";
    const instruction_el = document.getElementById("instruction_img");
    let instructionIndex = parseInt($("#posOptions").val());
    instruction_el.src = instruction_dir + instructionIndex.toString() + ".gif";
}

function buildLog(actionName, actionPosition) {
    if (!buidInProcess) {
        buidInProcess = true;
        let data = {
            operation: actionName,
            opIndex: actionPosition,
            datetime: getFormattedDateTime(new Date()),
            handdata: {
                RHand: [],
                LHand: []
            }
        };
        for (let i = 0; i < predictionStack.length; i++) {
            if (predictionStack[i][1]) {
                data.handdata.LHand.push({
                    time: predictionStack[i][0],
                    keypoints: predictionStack[i][2]
                });
                data.handdata.RHand.push({
                    time: predictionStack[i][0],
                    keypoints: [NaN]
                });
            } else {
                data.handdata.RHand.push({
                    time: predictionStack[i][0],
                    keypoints: predictionStack[i][2]
                });
                data.handdata.LHand.push({
                    time: predictionStack[i][0],
                    keypoints: [NaN]
                });
            }
        }
        stopLog(data);
        predictionStack = [];
        buidInProcess = false;
    }
}

let isLeftHandUsed = false;
function startLog() {
    // Init time elapsed counter and data logging.
    initTimer = new Date();
    
    isLeftHandUsed = document.getElementById('lefthandchk').checked;
    // Disable the instruction dropdown.
    document.getElementById("posOptions").disabled = true;
}
  
function stopLog(data) {
    // Enable the next instruction dropdown.
    document.getElementById("posOptions").disabled = false;

    $.post(location.url, data);
}

function onKeyDownEvent(e) {
    if(e.keyCode == 32 && $("#camBtn").hasClass("cam_button")) {
        switch (currentState) {
            case states.IDLE:
                $("#camBtn").attr("disabled", "disabled");
                $("#record_status").text("Status: Recording (Press SPACEBAR to Stop)");
                $("#record_status").addClass("pressed");
                $("#note").text("Recording in process...! Press SPACEBAR again to finish logging.");
                startLog();
                currentState = states.RECORDING;
                break;
            case states.RECORDING:
                currentState = states.IDLE;
                buildLog($("#posOptions option:selected").text(), $("#posOptions").val());
                $("#record_status").text("Status: Not Recording (Press SPACEBAR to Start)");
                $("#record_status").removeClass("pressed");
                $("#note").text("When you are ready, press SPACEBAR to start logging your hand's movements.");
                $("#camBtn").removeAttr("disabled");
                break;
            case states.START_TEST:
                break;
        }
        e.preventDefault();
    }
}

async function main() {
    dropDownElement.addEventListener('change', showInstructionImage);
    window.addEventListener('keydown', onKeyDownEvent);
    $("#record_status").text("Status: Please Wait...");
    $("#cameraAccess").css("display", "block");
    $("#loading").css("display", "inline-block");
    showInstructionImage();

    await startCamera();
    document.getElementById("camBtn").addEventListener("click", toggleVideo);
    // These anchor points allow the hand pointcloud to resize according to its
    // position in the input.
    ANCHOR_POINTS = [
        [0, 0, 0], [0, -VIDEO_HEIGHT, 0], [-VIDEO_WIDTH, 0, 0],
        [-VIDEO_WIDTH, -VIDEO_HEIGHT, 0]
    ];
}

main();