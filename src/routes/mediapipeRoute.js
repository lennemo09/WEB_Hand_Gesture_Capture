/*
Author:
Vivekkumar Chaudhari (vcha0018@student.monash.edu) 
    Student - Master of Information Technology
    Monash University, Clayton, Australia

Purpose:
Developed under Summer Project 'AR Hand Gesture Capture and Analysis'

Supervisors: 
Barrett Ens (barrett.ens@monash.edu)
    Monash University, Clayton, Australia
 Max Cordeil (max.cordeil@monash.edu)
    Monash University, Clayton, Australia

About File:
MediaPipe page route file. It accept custom template.
*/

var express = require('express');

var mediapipeRouter = express.Router();
var m_router = function(appInfo, pageInfo, navMenu, positionList){
    mediapipeRouter.route("/")
        .get(function(req, res){
            res
            .render(pageInfo.key, {
                // Template for MediaPipe Page
                info: appInfo,
                title: appInfo.title + ' - ' + pageInfo.value,
                pHeader: "MediaPipe Project",
                pDescription: "",
                menu: navMenu,
                posList: positionList,
            })
        });
        return mediapipeRouter;
};

module.exports = m_router;