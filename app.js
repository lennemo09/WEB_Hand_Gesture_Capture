const bodyParser = require('body-parser');
const fs = require('fs');
const mkdirp = require('mkdirp');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

//site variables
const appInfo = {
    title: '3D Hand Gestures Analysis', 
    description:'WEB API for detecting hand gestures',
};

// All Page basic informations
// Note: Do not chnage this unless you know what you are doing, this is depended to many things. app might crash if you modify this!
const pageInfo = [
    {key: 'index', value: ''},
    {key: 'handpose', value: 'HandPose'},
    {key: 'mediapipe', value: 'MediaPipe'},
    {key: 'contact', value: 'Contact Us'},
];

const positionList = [
    "Select Range",
    "Select Lasso", 
    "Select Cluster", 
    "Select Single Point", 
    "Select Axis", 
    "Multi-Select", 
    "Zoom", 
    "Pan", 
    "Rotate", 
    "Filter", 
    "Highlight", 
    "Save View", 
    "Export Data"
];

function GetNavMenu(){
    menu = [];
    pageInfo.forEach(function(item){
        menu.push({
            href: '/' + item.key,
            text: item.value
        });
    });
    return menu;
};

//Path info (set)
app.use(express.static('public')); // static directory access to "public" directory (css, js, etc.).
app.set('views', './src/views/pages');
app.set('view engine', 'ejs');

app.use(bodyParser.text());
app.use(bodyParser.urlencoded({
  parameterLimit: 100000,
  limit: '50mb',
  extended: true
}));

// Start the server
app.listen(PORT, (err) => {
    console.log(`Web app running at http://localhost:${PORT}`)
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

//Routing using Express Router 
var handposeRouter = require('./src/routes/handposeRoute')(appInfo, pageInfo[1], GetNavMenu(), positionList);
var mediapipeRouter = require('./src/routes/mediapipeRoute')(appInfo, pageInfo[2], GetNavMenu(), positionList);
var contactRouter = require('./src/routes/contactRoute')(appInfo, pageInfo[3], GetNavMenu());

app.use('/' + pageInfo[1].key, handposeRouter);
app.use('/' + pageInfo[2].key, mediapipeRouter);
app.use('/' + pageInfo[3].key, contactRouter);

app.get('/', (req, res) => {
    res
    .status(200)
    .render(pageInfo[0].key, {
        info: appInfo,
        title: appInfo.title,
        description: appInfo.description,
        menu: GetNavMenu(),
        pHeader: "Hand gesture Projects",
        pDescription: ""
    });
});

app.post('/', (req, res) => {
    // nothig yet
});

app.post('/mediapipe', (req, res) => {
    try {
        saveFile(`results/mediapipe/${req.body.dirName}`, req.body.data, "mediapipe");
    } catch (error) {
        console.log(error);
    }
    res.end(); // end the response
});

app.post('/handpose', (req, res) => {
    try {
        custom_dir = req.body.dirName;
        saveFile(`results/handpose/${req.body.dirName.toString().trim()}`, req.body.data, "handpose");
    } catch (error) {
        console.log(error);
    }
    res.end(); // end the response
});

function JSONToCSVString(jsonData, isMediaPipeData) {
    sampleData = "";
    sampleData += "TIME";
    for (let i = 0; i < 21; i ++) {
        sampleData += `,JOINT_${i}_X, JOINT_${i}_Y, JOINT_${i}_Z`;
    }
    sampleData += "\n";
    for (let i = 0; i < jsonData.length; i++) {
        sampleData += `${jsonData[i].time}`;
        // console.log(`i: ${i}`);
        for (let j = 0; j < jsonData[i].keypoints.length; j++) {
            if (jsonData[i].keypoints.length == 21)
                if (isMediaPipeData)
                    sampleData += `,${jsonData[i].keypoints[j].x}, ${jsonData[i].keypoints[j].y}, ${'z' in jsonData[i].keypoints[j] ? jsonData[i].keypoints[j].z : '0'}`;
                else if (jsonData[i].keypoints[j].length == 3)
                    sampleData += `,${jsonData[i].keypoints[j][0]}, ${jsonData[i].keypoints[j][1]}, ${jsonData[i].keypoints[j][2]}`;
        }
        sampleData += "\n";
    }
    return sampleData;
}

function saveFile(dirPath, responseData, apiName) {
    const operation = responseData.opIndex.toString().trim() + "_" + responseData.operation.toString().trim();
    const datetime = responseData.datetime.toString().trim();
    
    if(!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }

    for (const [key, value] of Object.entries(responseData.handdata)) {
        const fileName = `${operation}#${key}#${datetime}.csv`;
        const filePath = `${dirPath}/${fileName}`;
        const csvData = JSONToCSVString(value, apiName.toLowerCase().includes("mediapipe"));
        fs.writeFile(filePath, csvData, {
            flag: "w"
            }, function(err) {
            if (err) {
                return console.log(err);
            }
            console.log("The new file was created: " + fileName);
        });
    }
}