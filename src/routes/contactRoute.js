var express = require('express');

var contactRouter = express.Router();
var c_router = function(appInfo, pageInfo, navMenu){
    contactRouter.route("/")
        .get(function(req, res){
            res
            .render(pageInfo.key, {
                // Template for Contact Page
                info: appInfo,
                title: appInfo.title + ' - ' + pageInfo.value,
                pHeader: "Contact Us",
                pDescription: "",
                menu: navMenu
            })
        });
        return contactRouter;
};

module.exports = c_router;