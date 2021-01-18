var worker = new Worker('js/worker.js');
const dropDownElement = document.querySelector('#posOptions');
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
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

function getFormattedDateTime(dt = Date){
    return dt.getDate() + "-" + 
        months[dt.getMonth()] + "-" + 
        dt.getFullYear() + " " + 
        dt.getHours() + "-" + 
        dt.getMinutes() + "-" + 
        dt.getSeconds();
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
}});
hands.setOptions({
    maxNumHands: 2,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
const camera =  new Camera(videoElement, {
    onFrame: async () => {
        if ($("#cameraAccess").css("display") == "block")
            $("#cameraAccess").css("display", "none");
        await hands.send({image: videoElement});
        $("#loading").css("display", "none");
        if ($("#videoContent").css("display") == "none") {
            $("#record_status").text("Status: Not Recording (Press SPACEBAR to Start)");
            $("#videoContent").css("display", "block");
            $("#camBtn").css("display", "block");
        }
    },
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT
});

function onResults(results) {
    // console.log(results);
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
        // Saving recording results
        if (currentState == states.RECORDING) {
            const elapsedTime = (new Date() - initTimer);
            predictionStack.push([elapsedTime, results.multiHandedness, results.multiHandLandmarks]);
        }
        // drawing points on hand
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                            {color: '#00FF00', lineWidth: 5});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
        }
    }
    canvasCtx.restore();
}

function toggleVideo(){
    if ($("#camBtn").hasClass("cam_button")){
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    
        $("#camBtn").removeClass("cam_button");
        $("#camBtn").addClass("cam_button_reactivate");
        $("#camBtn").attr("value", "Start Camera");
        $("#record_status").text("Status: Reactivate camera to Start");
    } else {
        camera.start();
        
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
            if (predictionStack[i][1].length == 2 && predictionStack[i][2].length == 2) {
                // swaped hand indexes due to mirrored canvas projection.
                const lindex = (predictionStack[i][1][0].label == "Left") ? 1 : 0;
                const rindex = (predictionStack[i][1][0].label == "Right") ? 1 : 0;
                data.handdata.LHand.push({
                    time: predictionStack[i][0],
                    keypoints: predictionStack[i][2][lindex]
                });
                data.handdata.RHand.push({
                    time: predictionStack[i][0],
                    keypoints: predictionStack[i][2][rindex]
                });
            } else if (predictionStack[i][1].length == 1 && predictionStack[i][2].length == 1) {
                if (predictionStack[i][1][0].label == "Left") {
                    // swaped hand data due to mirrored canvas projection.
                    data.handdata.RHand.push({
                        time: predictionStack[i][0],
                        keypoints: predictionStack[i][2][0]
                    });
                    data.handdata.LHand.push({
                        time: predictionStack[i][0],
                        keypoints: [NaN]
                    });
                } else if (predictionStack[i][1][0].label == "Right") {
                    // swaped hand data due to mirrored canvas projection.
                    data.handdata.RHand.push({
                        time: predictionStack[i][0],
                        keypoints: [NaN]
                    });
                    data.handdata.LHand.push({
                    time: predictionStack[i][0],
                    keypoints: predictionStack[i][2][0]
                });
                }
            }
        }
        stopLog(data);
        predictionStack = [];
        buidInProcess = false;
    }
}

function startLog() {
    // Init time elapsed counter and data logging.
    initTimer = new Date();
    
    // Disable the instruction dropdown.
    document.getElementById("posOptions").disabled = true;

    $('#responseStatus').text('');
}
  
function stopLog(parsedData) {
    // Enable the next instruction dropdown. 
    document.getElementById("posOptions").disabled = false;

    if (parsedData.handdata.LHand.length <= 0 && parsedData.handdata.RHand.length <= 0) {
        $('#responseStatus').css('display', 'inline-block');
        $('#responseStatus').css('color', 'salmon');
        $('#responseStatus').text('There are no data in recorded clip to save!');
        $('#responseStatus').fadeOut(6600);
        return;
    }

    if(document.getElementById('parserchk').checked)
        worker.postMessage(["mediapipe", parsedData]);
    else {
        $.post(location.url, {dirName: $('#dirNameDiv input').val().trim(), data: parsedData}, function (data, status, jqXHR) {
            $('#responseStatus').css('display', 'inline-block');
            if (status == 'success') {
                $('#responseStatus').css('color', 'green');
                $('#responseStatus').text(`"${$("#posOptions option:selected").text().trim()}" gesture's files saved to server Successfully!`);
            } else {
                $('#responseStatus').css('color', 'red');
                $('#responseStatus').text('There was an error while saving file on server!');
            }
            $('#responseStatus').fadeOut(6600);
        });
    }
}

worker.onmessage = function (e) {
    e.data.forEach(csvData => {
        download(csvData[0], csvData[1]);
    });
}

function download(filename, data) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function onKeyDownEvent(e) {
    if ($('#dirNameDiv input').is(':focus'))
        return;
    if(e.keyCode == 32 && $("#camBtn").hasClass("cam_button")) {
        if (!$('#parserchk')[0].checked && $('#dirNameDiv input').val().trim() == "") {
            alert('Please provide server side directory name, to upload your gesture files under that directory! or use client-side download option');
            e.preventDefault();
            return;
        }
        switch (currentState) {
            case states.IDLE:
                $("#camBtn").attr("disabled", "disabled");
                $("#record_status").text("Status: Recording (Press SPACEBAR to Stop)");
                $("#record_status").addClass("pressed");
                $("#note").text("Recording in process...! Press SPACEBAR again to finish logging.");
                camera.start();
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

function fileChkClicked(e) {
    $('#dirNameDiv').css('display', (e.checked) ? 'none' : 'block');
}

function main(){
    dropDownElement.addEventListener('change', showInstructionImage);
    window.addEventListener('keydown', onKeyDownEvent);
    $("#record_status").text("Status: Please Wait...");
    $("#cameraAccess").css("display", "block");
    $("#loading").css("display", "inline-block");
    showInstructionImage();
    camera.start();
    hands.onResults(onResults);
    document.getElementById("camBtn").addEventListener("click", toggleVideo);
}

main();