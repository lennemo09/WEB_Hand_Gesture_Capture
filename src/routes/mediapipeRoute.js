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