//import * as THREE from 'three';
//import { MeshLine, MeshLineMaterial, MeshLineRaycast } from './THREE.MeshLine';
'use strict'

var container = document.getElementById( 'dataOverlay' );

// Global constants
var plotRange = 15;
var scaleMax = 2.25;
var scaleMin = 0.5;
var frustumSize = 1000;
var axisThickness = 10;
var axisColors = [0x00ff00, 0x0000ff, 0xff0000] // x, y ,z
var axisConeRadius = .15
var axisConeHeight = .5

// Global variables
let scaleSpeed = .005;

// Scene and camera initialisation
var scene = new THREE.Scene();
var dataCamera = new THREE.PerspectiveCamera( 55, $(container).width() / $(container).height(), .1, 1000 );
dataCamera.position.set( 0, 20, 20 );
var resolution = new THREE.Vector2( $(container).width(), $(container).height() );

// Renderer initialisation
var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
renderer.setSize($(container).width(), $(container).height());
renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );
container.style.pointerEvents = "none"; // Disable mouse control - Enable for debugging only

// Camera orbit and mouse control
var controls = new THREE.OrbitControls( dataCamera, renderer.domElement );

// Global gometry groups
var axesGroup;
var modelPivot = new THREE.Group();
var dataPivot = new THREE.Group();
var dataGeometries = new THREE.Group();

addLights(); // Add lighting to scene
init();

/**
 * Function to draw a line between the points given with assigned color and thickness.
 * @param {List} points A list of floats which every 3 floats being a point in space.
 * @param {HexNumber} color Hex value for color for the line.
 * @param {Float} thickness Thickness for the line.
 * @returns The Mesh() object of the line drawn.
 */
function drawLine(points, color, thickness=10) {
    const line = new MeshLine();
    line.setPoints(points);

    var material = new MeshLineMaterial( {
		useMap: false,
		color: new THREE.Color( color ),
		opacity: 1,
		resolution: resolution,
		sizeAttenuation: false,
		lineWidth: thickness,
    });
    
    const lineMesh = new THREE.Mesh(line, material);

    return lineMesh;
}

/**
 * Plots a point (with a Sphere geometry) in space using given coordinates.
 * @param {Float} x Default is 0.
 * @param {Float} y Default is 0.
 * @param {Float} z Default is 0.
 * @param {Float} radius Radius/size for the point mesh. Default is 0.3.
 * @param {HexNumber} color Hex value for color for the point. Default is black.
 * @returns The Mesh() object of the point.
 */
function plotPoint(x=0, y=0, z=0, radius = 0.3, color = 0x000000) {
    const geometry = new THREE.SphereGeometry( radius, 32, 32 );
    const material = new THREE.MeshBasicMaterial( {color: color} );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = x;
    sphere.position.y = y;
    sphere.position.z = z;
    dataGeometries.add( sphere );

    return sphere
}

function addLights() {
    scene.add( new THREE.AmbientLight( 0xffffff, 0.65 ) );

    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set( 1, 1, 1 );
    light.castShadow = true;
    light.shadow.radius = 8;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    const d = 10;

    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.far = 1000;

    scene.add( light );

}

function plotOutlinedPoint(x=0, y=0, z=0, radius = 0.3, color = 0xffffff, outlineColor = 0x000000) {
    const outlinedPoint = new THREE.Group();

    const geometry = new THREE.SphereGeometry( radius, 32, 32 );
    const material = new THREE.MeshStandardMaterial( {color: color} );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = x;
    sphere.position.y = y;
    sphere.position.z = z;
    outlinedPoint.add( sphere );

    //Create outline object
    var outlineGeometry = new THREE.SphereGeometry( radius, 32, 32 );
    //Notice the second parameter of the material
    var outlineMaterial = new THREE.MeshBasicMaterial({color : outlineColor, side: THREE.BackSide});
    var outline = new THREE.Mesh(outlineGeometry, outlineMaterial);

    outline.position.x = x;
    outline.position.y = y;
    outline.position.z = z;

    //Scale the object up to have an outline (as discussed in previous answer)
    outline.scale.multiplyScalar(1.2);
    outlinedPoint.add(outline);
    
    dataGeometries.add( outlinedPoint );

    return outlinedPoint
}

/**
 * Draws the Cartesian R3 axes.
 * @param {Float} axisLength Length of the axis. Default is the range of the plot.
 * @param {Boolean} axisArrow Enable axis arrowheads. Default is false.
 * @returns {THREE.Group} The THREE.Group() geometry group containing the axes.
 */
function drawCartesianAxes(axisLength = plotRange, axisArrow = false) {
    let xAxisPoints = [axisLength,0,0,0,0,0];
    let xAxis = drawLine(xAxisPoints,axisColors[0],axisThickness);

    let yAxisPoints = [0,axisLength,0,0,0,0];
    let yAxis = drawLine(yAxisPoints,axisColors[1],axisThickness);

    let zAxisPoints = [0,0,axisLength,0,0,0];
    let zAxis = drawLine(zAxisPoints,axisColors[2],axisThickness);

    axesGroup = new THREE.Group();
    axesGroup.add(xAxis);
    axesGroup.add(yAxis);
    axesGroup.add(zAxis);

    if (axisArrow) {
        const xAxisArrowGeometry = new THREE.ConeGeometry( axisConeRadius, axisConeHeight, 16 );
        const xAxisArrowMaterial = new THREE.MeshBasicMaterial( {color: axisColors[0]} );
        const xAxisArrowMesh = new THREE.Mesh( xAxisArrowGeometry, xAxisArrowMaterial );
        xAxisArrowMesh.position.set(axisLength,0,0);
        xAxisArrowMesh.rotation.z = -Math.PI/2;

        const yAxisArrowGeometry = new THREE.ConeGeometry( axisConeRadius, axisConeHeight, 16 );
        const yAxisArrowMaterial = new THREE.MeshBasicMaterial( {color: axisColors[1]} );
        const yAxisArrowMesh = new THREE.Mesh( yAxisArrowGeometry, yAxisArrowMaterial );
        yAxisArrowMesh.position.set(0,axisLength,0);

        const zAxisArrowGeometry = new THREE.ConeGeometry( axisConeRadius, axisConeHeight, 16 );
        const zAxisArrowMaterial = new THREE.MeshBasicMaterial( {color: axisColors[2]} );
        const zAxisArrowMesh = new THREE.Mesh( zAxisArrowGeometry, zAxisArrowMaterial );
        zAxisArrowMesh.position.set(0,0,axisLength);
        zAxisArrowMesh.rotation.x = Math.PI/2;

        axesGroup.add(xAxisArrowMesh);
        axesGroup.add(yAxisArrowMesh);
        axesGroup.add(zAxisArrowMesh);
    }

    scene.add(axesGroup);
    return axesGroup;
}

/**
 * Generates and renders random points within the range given.
 * If color is not set: Each point will have its color's RGB value based on its x,y,z coordinates.
 * @param {Number} count Number of points to draw. Default is 10.
 * @param {Float} min Lower bound of x,y coordinates for the points. Default is 0.
 * @param {Float} max Upper bound of x,y coordinates for the points. Default is plotRange.
 * @param {HexNumber} color Color for the points. If null: Points colored based on its coordinates. Default is null.
 * @param {Float} size Size of the point. Default is 0.2.
 * @returns {THREE.Group} The THREE.Group() geometry group containing the points.
 */
function drawRandomPoints(count=10,min=0,max=plotRange,color=null,size=0.2,outlined=false) {
    let randomColor = false;
    if (color === null) {
        randomColor = true;
    }
    var randomPointsGroup = new THREE.Group();
    for (let i = 0; i < count; i ++) {
        var randomX = Math.random() * (max - min) + min;
        var randomY = Math.random() * (max - min) + min;
        var randomZ = Math.random() * (max - min) + min;
        console.log(randomX,randomY,randomZ);
        if (randomColor) {
            var greenValue = parseInt((randomX / max) * 255);
            var blueValue = parseInt((randomY / max) * 255);
            var redValue = parseInt((randomZ / max) * 255);
            color = "#" + ((1 << 24) + (redValue << 16) + (greenValue << 8) + blueValue).toString(16).slice(1);
        }
        if (outlined) {
            var newPoint = plotOutlinedPoint(randomX, randomY, randomZ, size, color);
        } else {
            var newPoint = plotPoint(randomX, randomY, randomZ, size, color);
        }
        
        randomPointsGroup.add(newPoint);
    }

    dataGeometries.add(randomPointsGroup);
    return randomPointsGroup;
}

/**
 * Initialise the scene.
 * Draws the axes and data here.
 * IMPORTANT: Add the model and data into their Pivot groups for animation.
 */
function init() {
    axesGroup = drawCartesianAxes(plotRange,true);
    let randomPoints = drawRandomPoints(40,0,plotRange,0xffffff,0.3,true);

    scene.add(modelPivot);
    scene.add(dataPivot);

    // Resets rotation pivot to center of the entire group instead of 0,0,0
    modelPivot.add(dataGeometries);
    dataPivot.add(dataGeometries);
    modelPivot.add(axesGroup);
    axesGroup.position.set(-plotRange/2,-plotRange/2,-plotRange/2);
    dataGeometries.position.set(-plotRange/2,-plotRange/2,-plotRange/2);
    
    animate();
}

onWindowResize();

/**
 * Handles resizing window.
 * Not too important based on use cases.
 */
function onWindowResize() {

	var w = container.clientWidth;
	var h = container.clientHeight;

	var aspect = w / h;

	dataCamera.left   = - frustumSize * aspect / 2;
	dataCamera.right  =   frustumSize * aspect / 2;
	dataCamera.top    =   frustumSize / 2;
	dataCamera.bottom = - frustumSize / 2;

	dataCamera.updateProjectionMatrix();

	renderer.setSize( w, h );

	resolution.set( w, h );
}

/**
 * Animate: Rotates the model on the Y axis.
 * @param {Float} speed Rotation speed. Default is 0.2.
 */
function rotateModel(speed=.02) {
    modelPivot.rotation.y += speed;
    dataPivot.rotation.y += speed;
}

/**
 * Animate: Rotates the data only on the Y axis.
 * @param {Float} speed Rotation speed. Default is 0.2.
 */
function rotateData(speed=.02) {
    dataPivot.rotation.y += speed;
}

/**
 * Animate: Scales the data uniformly in all direction.
 * @param {Float} speed Scaling speed. Default is -0.01.
 */
function scaleData(speed=-.01) {
    dataPivot.scale.x += speed;
    dataPivot.scale.y += speed;
    dataPivot.scale.z += speed;
}

/**
 * Demonstration purpose: Scales the data up to a max size and then down to a minimum size and repeat.
 */
function scaleShowcase() {
    if (dataPivot.scale.x >= scaleMax || dataPivot.scale.x <= scaleMin) {
        scaleSpeed *= -1;
        scaleData(scaleSpeed);
    } else {
        scaleData(scaleSpeed);
    }
}

//window.addEventListener( 'resize', onWindowResize );
function animate() {

    requestAnimationFrame( animate );
    //rotateData();
    //rotateModel(.01);
    //scaleShowcase();
    controls.update();

	renderer.render( scene, dataCamera );

}