"use strict"

var glm = require("gl-matrix")
var vec2 = glm.vec2
var vec3 = glm.vec3
var mat3 = glm.mat3
var mat4 = glm.mat4
var quat = glm.quat

function OrbitControl(position, target, fov, aspect, near, far) {
  // properties
  this.position = position !== undefined ? position : vec3.fromValues(0, 0, 10)
  this.target = position !== undefined ? position : vec3.create()
  this.up = vec3.fromValues(0, 1, 0)

  this.projectionMatrix = mat4.create()
  this.viewMatrix = mat4.create()

  this.autoRotate = false
  this.rotateSpeed = 1.0  

  this.scale = 1
  this.pan = vec3.create()

  // internals 
  this.rotateStart = vec2.create()
  this.rotateEnd = vec2.create()
  this.rotateDelta = vec2.create()

  this.offset = vec3.create()

  this.phiDelta = 0
  this.thetaDelta = 0
  
  // constants

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  var minPolarAngle = 0 
  var maxPolarAngle = Math.PI 

  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ]. 
  // radians
  var minAzimuthAngle = - Infinity 
  var maxAzimuthAngle = Infinity 

  // Limits to how far you can dolly in and out 
  var minDistance = 0
  var maxDistance = Infinity

  var fov = fov !== undefined ? fov : Math.PI/4
  var aspect = aspect !== undefined ? aspect : 1
  var near = near !== undefined ? near : 0.1
  var far = far !== undefined ? far : 2000

  var EPS = 0.000001

  mat4.perspective(this.projectionMatrix, fov, aspect, near, far)
  mat4.lookAt(this.viewMatrix, this.position, this.target, this.up)

  // methods
  this.update = function () {
    vec3.sub(this.offset, this.position, this.target)

    var offsetX = this.offset[0]
    var offsetY = this.offset[1]
    var offsetZ = this.offset[2]

    // angle from z-axis around y-axis
    var theta = Math.atan2(offsetX, offsetZ)

    // angle from y-axis
    var phi = Math.atan2(Math.sqrt(offsetX * offsetX + offsetZ * offsetZ), offsetY)

    if ( this.autoRotate ) {
      this.thetaDelta = 0.01
      this.phiDelta = 0.01
    }

    theta += this.thetaDelta
    phi += this.phiDelta

    // restrict theta to be between desired limits
    theta = Math.max(minAzimuthAngle, Math.min(maxAzimuthAngle, theta))

    // restrict phi to be between desired limits
    phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, phi))

    var radius = vec3.length(this.offset) * this.scale
    // restrict radius to be between desired limits
    radius = Math.max(minDistance, Math.min(maxDistance, radius))

    // restrict phi to be betwee EPS and PI-EPS
    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi))

    // move target to panned location
    // this.target.add( pan );

    this.offset[0] = radius * Math.sin(phi) * Math.sin(theta)
    this.offset[1] = radius * Math.cos(phi)
    this.offset[2] = radius * Math.sin(phi) * Math.cos(theta)  

    vec3.copy(this.position, this.target)
    vec3.add(this.position, this.position, this.offset)

    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up)

    this.thetaDelta = 0
    this.phiDelta = 0
    this.scale = 1
    vec3.set(this.pan, 0, 0, 0)
  }  

  this.initRotate = function(mouse) {
    vec2.copy(this.rotateStart, mouse)
  }

  // mouse coordinates as percentages of canvas size
  // (mouse.x / canvas.clientWidth, mouse.y / canvas.clientHeight)
  this.rotate = function(mouse) {    
    vec2.copy(this.rotateEnd, mouse)
    vec2.subtract(this.rotateDelta, this.rotateEnd, this.rotateStart)

    // rotating across whole screen goes 360 degrees around
    var rotateDeltaX = this.rotateDelta[0]
    var rotateLeft = 2 * Math.PI * rotateDeltaX * this.rotateSpeed 
    this.thetaDelta -= rotateLeft

    // rotating up and down along whole screen attempts to go 360, but limited to 180
    var rotateDeltaY = this.rotateDelta[1]
    var rotateUp = 2 * Math.PI * rotateDeltaY * this.rotateSpeed
    this.phiDelta -= rotateUp

    vec2.copy(this.rotateStart, this.rotateEnd)
  }
}

function createOrbitControl(position) {
  var orbitControl = new OrbitControl(position)
  return orbitControl
}

module.exports = createOrbitControl
