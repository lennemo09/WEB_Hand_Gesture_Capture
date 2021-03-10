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
Handpose page route file. It accept custom template.
*/

var express = require('express');

var handposeRouter = express.Router();
var h_router = function(appInfo, pageInfo, navMenu, positionList){
    handposeRouter.route("/")
        .get(function(req, res){
            res
            .render(pageInfo.key, {
                // Template for HanPose Page
                info: appInfo,
                title: appInfo.title + ' - ' + pageInfo.value,
                pHeader: "HandPose Project",
                pDescription: "",
                menu: navMenu,
                posList: positionList,
            })
        });
        return handposeRouter;
};

module.exports = h_router;