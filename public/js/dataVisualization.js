//import * as THREE from 'three';
//import { MeshLine, MeshLineMaterial, MeshLineRaycast } from './THREE.MeshLine';
'use strict'

var container = document.getElementById( '3d_data' );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, .1, 1000 );
camera.position.set( 0, 0, 20 );

var frustumSize = 1000;
var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );

var controls = new THREE.OrbitControls( camera, renderer.domElement );

var clock = new THREE.Clock();
var axesGroup;

init();

function drawLine(points, color=0x000000, thickness=10) {
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
    scene.add(lineMesh)
    return lineMesh;
}

function plotPoint(x=0, y=0, z=0, radius = 0.3, color = 0x000000) {
    const geometry = new THREE.SphereGeometry( radius, 32, 32 );
    const material = new THREE.MeshBasicMaterial( {color: color} );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = x;
    sphere.position.y = y;
    sphere.position.z = z;
    scene.add( sphere );

    return sphere;
}

function drawCartesianAxes(axisLength = 4) {
    let xAxisPoints = [axisLength,0,0,0,0,0];
    let xAxis = drawLine(xAxisPoints,0x00ff00,5);

    let yAxisPoints = [0,axisLength,0,0,0,0];
    let yAxis = drawLine(yAxisPoints,0x0000ff,5);

    let zAxisPoints = [0,0,axisLength,0,0,0];
    let zAxis = drawLine(zAxisPoints,0xff0000,5);

    axesGroup = new THREE.Group();
    axesGroup.add(xAxis);
    axesGroup.add(yAxis);
    axesGroup.add(zAxis);

    scene.add(axesGroup);
    return axesGroup;
}

function init() {
    axesGroup = drawCartesianAxes(10);
    plotPoint(5,5,5,0.2,0x257EA8);
    plotPoint(3,3,1,0.2,0x67C7F5);
    drawLine([5,5,5,3,3,1],0xF5B567);
    plotPoint(7,6,2,0.2,0xFFB860);
    drawLine([7,6,2,5,5,5],0xAB7432);
    render();
}

onWindowResize();

function onWindowResize() {

	var w = container.clientWidth;
	var h = container.clientHeight;

	var aspect = w / h;

	camera.left   = - frustumSize * aspect / 2;
	camera.right  =   frustumSize * aspect / 2;
	camera.top    =   frustumSize / 2;
	camera.bottom = - frustumSize / 2;

	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

	resolution.set( w, h );

}

window.addEventListener( 'resize', onWindowResize );

function render() {

    requestAnimationFrame( render );
    controls.update();

	renderer.render( scene, camera );

}