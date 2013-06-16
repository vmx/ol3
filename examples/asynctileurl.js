goog.require('ol');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
goog.require('ol.source.ImageTileSource');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.ImageTileSource({
        projection: ol.proj.get('EPSG:3857'),
        tileUrlFunction: function(tileCoord, projection) {
          return function(cb) {
            window.setTimeout(function() {
              var finalTileUrl = 'http://tile.openstreetmap.org/2/2/1.png';
              cb(finalTileUrl);
            }, 1000);
          };
        },
        crossOrigin: 'anonymous'
      })
    })
  ],
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
