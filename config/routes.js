'use strict';

var main = require('../app/controllers/main');
var api = require('../app/controllers/api');
var image = require('../app/controllers/image');

module.exports = function(app,config){

    app.get('/api/search', api.toSearch);
    app.get('/api/kinsan', api.staticMap);
    app.post('/image/upload', image.upload);
    app.get('/image/exposure', image.exposure);
    app.get('/u/images/:filename', image.handle);

    app.get('/',main.index);

};
