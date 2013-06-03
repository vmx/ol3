goog.provide('ol.Ellipsoid');

goog.require('goog.math');
goog.require('goog.vec.Vec3');
goog.require('ol.Coordinate');



/**
 * @constructor
 * @param {number} x The radius in the x direction.
 * @param {number} y The radius in the y direction.
 * @param {number} z The radius in the z direction.
 * @param {number} flattening Flattening.
 */
ol.Ellipsoid = function(x, y, z, flattening) {

  /**
   * @type {number}
   */
  this.x = x;

  /**
   * @type {number}
   */
  this.y = y;

  /**
   * @type {number}
   */
  this.z = z;

  /**
   * @type {number}
   */
  this.a = x;

  /**
   * @type {number}
   */
  this.flattening = flattening;

  /**
   * @type {number}
   */
  this.b = this.x * (1 - this.flattening);

  this._radii = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(this._radii, x, y, z);

  this._radiiSquared = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(this._radiiSquared, x * x, y * y, z * z);

  this._radiiToTheFourth = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(this._radiiToTheFourth, x * x * x * x,
      y * y * y * y,
      z * z * z * z);

  this._oneOverRadii = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(this._oneOverRadii, x === 0.0 ? 0.0 : 1.0 / x,
      y === 0.0 ? 0.0 : 1.0 / y,
      z === 0.0 ? 0.0 : 1.0 / z);

  this._oneOverRadiiSquared = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(this._oneOverRadiiSquared,
      x === 0.0 ? 0.0 : 1.0 / (x * x),
      y === 0.0 ? 0.0 : 1.0 / (y * y),
      z === 0.0 ? 0.0 : 1.0 / (z * z));

  this._minimumRadius = Math.min(x, y, z);

  this._maximumRadius = Math.max(x, y, z);

  this._centerToleranceSquared = 0.1;

};


/**
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 1.
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {{distance: number, initialBearing: number, finalBearing: number}}
 *     Vincenty.
 */
ol.Ellipsoid.prototype.vincenty =
    function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var minDeltaLambda = goog.isDef(opt_minDeltaLambda) ?
      opt_minDeltaLambda : 1e-12;
  var maxIterations = goog.isDef(opt_maxIterations) ?
      opt_maxIterations : 100;
  var f = this.flattening;
  var lat1 = goog.math.toRadians(c1[1]);
  var lat2 = goog.math.toRadians(c2[1]);
  var deltaLon = goog.math.toRadians(c2[0] - c1[0]);
  var U1 = Math.atan((1 - f) * Math.tan(lat1));
  var cosU1 = Math.cos(U1);
  var sinU1 = Math.sin(U1);
  var U2 = Math.atan((1 - f) * Math.tan(lat2));
  var cosU2 = Math.cos(U2);
  var sinU2 = Math.sin(U2);
  var lambda = deltaLon;
  var cosSquaredAlpha, sinAlpha;
  var cosLambda, deltaLambda = Infinity, sinLambda;
  var cos2SigmaM, cosSigma, sigma, sinSigma;
  var i;
  for (i = maxIterations; i > 0; --i) {
    cosLambda = Math.cos(lambda);
    sinLambda = Math.sin(lambda);
    var x = cosU2 * sinLambda;
    var y = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;
    sinSigma = Math.sqrt(x * x + y * y);
    if (sinSigma === 0) {
      return {
        distance: 0,
        initialBearing: 0,
        finalBearing: 0
      };
    }
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSquaredAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSquaredAlpha;
    if (isNaN(cos2SigmaM)) {
      cos2SigmaM = 0;
    }
    var C = f / 16 * cosSquaredAlpha * (4 + f * (4 - 3 * cosSquaredAlpha));
    var lambdaPrime = deltaLon + (1 - C) * f * sinAlpha * (sigma +
        C * sinSigma * (cos2SigmaM +
        C * cosSigma * (2 * cos2SigmaM * cos2SigmaM - 1)));
    deltaLambda = Math.abs(lambdaPrime - lambda);
    lambda = lambdaPrime;
    if (deltaLambda < minDeltaLambda) {
      break;
    }
  }
  if (i === 0) {
    return {
      distance: NaN,
      finalBearing: NaN,
      initialBearing: NaN
    };
  }
  var aSquared = this.a * this.a;
  var bSquared = this.b * this.b;
  var uSquared = cosSquaredAlpha * (aSquared - bSquared) / bSquared;
  var A = 1 + uSquared / 16384 *
      (4096 + uSquared * (uSquared * (320 - 175 * uSquared) - 768));
  var B = uSquared / 1024 *
      (256 + uSquared * (uSquared * (74 - 47 * uSquared) - 128));
  var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 *
      (cosSigma * (2 * cos2SigmaM * cos2SigmaM - 1) -
       B / 6 * cos2SigmaM * (4 * sinSigma * sinSigma - 3) *
       (4 * cos2SigmaM * cos2SigmaM - 3)));
  cosLambda = Math.cos(lambda);
  sinLambda = Math.sin(lambda);
  var alpha1 = Math.atan2(cosU2 * sinLambda,
                          cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
  var alpha2 = Math.atan2(cosU1 * sinLambda,
                          cosU1 * sinU2 * cosLambda - sinU1 * cosU2);
  return {
    distance: this.b * A * (sigma - deltaSigma),
    initialBearing: goog.math.toDegrees(alpha1),
    finalBearing: goog.math.toDegrees(alpha2)
  };
};


/**
 * Returns the distance from c1 to c2 using Vincenty.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 1.
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {number} Vincenty distance.
 */
ol.Ellipsoid.prototype.vincentyDistance =
    function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var vincenty = this.vincenty(c1, c2, opt_minDeltaLambda, opt_maxIterations);
  return vincenty.distance;
};


/**
 * Returns the final bearing from c1 to c2 using Vincenty.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 1.
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {number} Initial bearing.
 */
ol.Ellipsoid.prototype.vincentyFinalBearing =
    function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var vincenty = this.vincenty(c1, c2, opt_minDeltaLambda, opt_maxIterations);
  return vincenty.finalBearing;
};


/**
 * Returns the initial bearing from c1 to c2 using Vincenty.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 1.
 * @param {number=} opt_minDeltaLambda Minimum delta lambda for convergence.
 * @param {number=} opt_maxIterations Maximum iterations.
 * @return {number} Initial bearing.
 */
ol.Ellipsoid.prototype.vincentyInitialBearing =
    function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var vincenty = this.vincenty(c1, c2, opt_minDeltaLambda, opt_maxIterations);
  return vincenty.initialBearing;
};


/**
 * Converts the provided cartesian to cartographic representation.
 * The cartesian is undefined at the center of the ellipsoid.
 * @param {null|ol.Coordinate|undefined} coordinate Coordinate.
 * @return {ol.Coordinate} Cartographic coordinate in radians.
 */
ol.Ellipsoid.prototype.cartesianToCartographic = function(coordinate) {
  //TODO put in global space or cache as a member to reduce cost of recreating.
  var cartesianToCartographicP = goog.vec.Vec3.createNumber();
  var point = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(point,
      coordinate[0], coordinate[1], coordinate[2]);

  var p = this._scaleToGeodeticSurface(point, cartesianToCartographicP);

  if (typeof p === 'undefined') {
    return null;
  }
  //TODO put in global space or cache as a member to reduce cost of recreating.
  var cartesianToCartographicN = goog.vec.Vec3.createNumber();
  var n = this.geodeticSurfaceNormal(p, cartesianToCartographicN);
  //TODO put in global space or cache as a member to reduce cost of recreating.
  var cartesianToCartographicH = goog.vec.Vec3.createNumber();
  var h = goog.vec.Vec3.subtract(point, p, cartesianToCartographicH);

  var longitude = Math.atan2(n[1], n[0]);
  var latitude = Math.asin(n[2]);
  var value = goog.vec.Vec3.dot(h, point);
  if (value > 0) {
    value = 1;
  } else if (value < 0) {
    value = -1;
  } else {
    value = 0;
  }
  var height = value * goog.vec.Vec3.magnitude(h);

  return [longitude, latitude, height];
};


/**
 * Scales the provided Cartesian position along the geodetic surface normal
 * so that it is on the surface of this ellipsoid.  If the position is
 * at the center of the ellipsoid, this function returns undefined.
 * @param {goog.vec.Vec3.AnyType} cartesian Cartesian position.
 * @param {goog.vec.Vec3.AnyType} result Result.
 * @return {goog.vec.Vec3.AnyType | undefined} Result.
 */
ol.Ellipsoid.prototype._scaleToGeodeticSurface = function(cartesian, result) {
  var positionX = cartesian[0];
  var positionY = cartesian[1];
  var positionZ = cartesian[2];

  var oneOverRadii = this._oneOverRadii;
  var oneOverRadiiX = oneOverRadii[0];
  var oneOverRadiiY = oneOverRadii[1];
  var oneOverRadiiZ = oneOverRadii[2];

  var x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
  var y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
  var z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;

  // Compute the squared ellipsoid norm.
  var squaredNorm = x2 + y2 + z2;
  var ratio = Math.sqrt(1.0 / squaredNorm);

  // As an initial approximation, assume that the radial intersection
  //is the projection point.

  //TODO make scaleToGeodeticSurfaceIntersection global to stop
  //re-creation of it.
  var scaleToGeodeticSurfaceIntersection = goog.vec.Vec3.createNumber();
  var intersection = goog.vec.Vec3.scale(cartesian, ratio,
      scaleToGeodeticSurfaceIntersection);

  //* If the position is near the center, the iteration will not converge.
  if (squaredNorm < this._centerToleranceSquared) {
    return !isFinite(ratio) ? undefined :
        goog.vec.Vec3.setFromArray(result, intersection);
  }

  var oneOverRadiiSquared = this._oneOverRadiiSquared;
  var oneOverRadiiSquaredX = oneOverRadiiSquared[0];
  var oneOverRadiiSquaredY = oneOverRadiiSquared[1];
  var oneOverRadiiSquaredZ = oneOverRadiiSquared[2];

  // Use the gradient at the intersection point in place of
  // the true unit normal. The difference in magnitude will
  // be absorbed in the multiplier.

  // TODO make scaleToGeodeticSurfaceGradient global to stop
  // re-creation of it.
  var gradient = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(gradient, intersection[0] *
          oneOverRadiiSquaredX * 2.0,
      intersection[1] * oneOverRadiiSquaredY * 2.0,
      intersection[2] * oneOverRadiiSquaredZ * 2.0);

  // Compute the initial guess at the normal vector multiplier,
  // lambda.
  var lambda = (1.0 - ratio) *
      goog.vec.Vec3.magnitude(cartesian) /
      (0.5 * goog.vec.Vec3.magnitude(gradient));
  var correction = 0.0;

  var func;
  var denominator;
  var xMultiplier;
  var yMultiplier;
  var zMultiplier;
  var xMultiplier2;
  var yMultiplier2;
  var zMultiplier2;
  var xMultiplier3;
  var yMultiplier3;
  var zMultiplier3;

  do {
    lambda -= correction;

    xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
    yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
    zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);

    xMultiplier2 = xMultiplier * xMultiplier;
    yMultiplier2 = yMultiplier * yMultiplier;
    zMultiplier2 = zMultiplier * zMultiplier;

    xMultiplier3 = xMultiplier2 * xMultiplier;
    yMultiplier3 = yMultiplier2 * yMultiplier;
    zMultiplier3 = zMultiplier2 * zMultiplier;

    func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;

    // "denominator" here refers to the use of this expression
    // in the velocity and acceleration computations in the sections to follow.
    denominator = x2 * xMultiplier3 * oneOverRadiiSquaredX + y2 * yMultiplier3 *
        oneOverRadiiSquaredY + z2 * zMultiplier3 * oneOverRadiiSquaredZ;

    var derivative = -2.0 * denominator;

    correction = func / derivative;
  } while (Math.abs(func) > 0.000000000001);//TODO make constant

  goog.vec.Vec3.setFromValues(result, positionX * xMultiplier,
      positionY * yMultiplier, positionZ * zMultiplier);
  return result;
};


/**
 * Computes the normal of the plane tangent to the surface of the ellipsoid
 * at the provided position.
 * @param {goog.vec.Vec3.AnyType} cartesian Cartesian position.
 * @param {goog.vec.Vec3.AnyType} result Result.
 * @return {goog.vec.Vec3.AnyType | undefined} Result.
 */
ol.Ellipsoid.prototype.geodeticSurfaceNormal = function(cartesian, result) {
  var oneOverRadiiSquared = this._oneOverRadiiSquared;
  goog.vec.Vec3.setFromValues(result, cartesian[0] * oneOverRadiiSquared[0],
      cartesian[1] * oneOverRadiiSquared[1],
      cartesian[2] * oneOverRadiiSquared[2]);
  return goog.vec.Vec3.normalize(result, result);
};


/**
 * Converts the provided cartographic to Cartesian representation.
 * @param {number} longitude Longitude.
 * @param {number} latitude Latitude.
 * @param {number} height height.
 * @return {ol.Coordinate|undefined} Cartesian coordinate.
 */
ol.Ellipsoid.prototype.cartographicToCartesian =
    function(longitude, latitude, height) {
  var n = this.geodeticSurfaceNormalCartographic(latitude, longitude);

  var k = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(k, this._radiiSquared[0] * n[0],
      this._radiiSquared[1] * n[1], this._radiiSquared[2] * n[2]);

  var gamma = Math.sqrt(goog.vec.Vec3.dot(n, k));
  goog.vec.Vec3.setFromValues(k, k[0] / gamma, k[1] / gamma, k[2] / gamma);
  goog.vec.Vec3.setFromValues(n, n[0] * height, n[1] * height, n[2] * height);

  var result = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.add(k, n, result);
  return [result[0], result[1], result[2]];
};


/**
 * @return {number} MaximumRadius.
 */
ol.Ellipsoid.prototype.getMaximumRadius =
    function() {
  return this._maximumRadius;
};


/**
 * Computes the normal of the plane tangent to the surface of the
 * ellipsoid at the provided position.
 * @param {number} latitude Latitude.
 * @param {number} longitude Longitude.
 * @return {goog.vec.Vec3.AnyType} Coordinate in cartographic radians.
 */
ol.Ellipsoid.prototype.geodeticSurfaceNormalCartographic =
    function(latitude, longitude) {
  var cosLatitude = Math.cos(latitude);

  var x = cosLatitude * Math.cos(longitude);
  var y = cosLatitude * Math.sin(longitude);
  var z = Math.sin(latitude);
  var vec3 = goog.vec.Vec3.createNumber();
  goog.vec.Vec3.setFromValues(vec3, x, y, z);
  return goog.vec.Vec3.normalize(vec3, vec3);
};
