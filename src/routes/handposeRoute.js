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