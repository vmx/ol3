goog.provide('ol.vec.Mat3');

goog.require('goog.vec.Mat3');


/**
 * Computes a 3x3 rotation matrix from the provided quaternion.
 * @param {goog.vec.Quaternion.Number} quaternion Quaternion.
 * @param {!goog.vec.Mat3.Number} result Mat3.
 * @return {!goog.vec.Mat3.Number} The matrix from the quaternion.
 */
ol.vec.Mat3.fromQuaternion = function(quaternion, result) {
  var x2 = quaternion[0] * quaternion[0];
  var xy = quaternion[0] * quaternion[1];
  var xz = quaternion[0] * quaternion[2];
  var xw = quaternion[0] * quaternion[3];
  var y2 = quaternion[1] * quaternion[1];
  var yz = quaternion[1] * quaternion[2];
  var yw = quaternion[1] * quaternion[3];
  var z2 = quaternion[2] * quaternion[2];
  var zw = quaternion[2] * quaternion[3];
  var w2 = quaternion[3] * quaternion[3];

  var m00 = x2 - y2 - z2 + w2;
  var m01 = 2.0 * (xy + zw);
  var m02 = 2.0 * (xz - yw);

  var m10 = 2.0 * (xy - zw);
  var m11 = -x2 + y2 - z2 + w2;
  var m12 = 2.0 * (yz + xw);

  var m20 = 2.0 * (xz + yw);
  var m21 = 2.0 * (yz - xw);
  var m22 = -x2 - y2 + z2 + w2;

  goog.vec.Mat3.setFromValues(result,
      m00, m10, m20,
      m01, m11, m21,
      m02, m12, m22);
  return result;
};
