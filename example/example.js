"use strict"

var createOrbitControl = require("../orbit.js")

var glm = require("gl-matrix")
var vec2 = glm.vec2
var vec3 = glm.vec3
var mat4 = glm.mat4

var raf = require('raf')

var camera = createOrbitControl()

var gl;

var vPyramid;
var cPyramid;

var vPyramidWire;
var cPyramidWire;

var modelView;
var projection;
var vPosition;
var vColor;

var canvas;
var rotating;

// mouse location as a percentage of canvas size
var mouse = vec2.create();

window.onload = function init()
{
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 2.0);  

  // load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  modelView = gl.getUniformLocation(program, "modelView");
  projection = gl.getUniformLocation(program, "projection");

  gl.uniformMatrix4fv(projection, false, camera.projectionMatrix);

  vPosition = gl.getAttribLocation(program, "vPosition");    
  gl.enableVertexAttribArray(vPosition);

  vColor = gl.getAttribLocation(program, "vColor");    
  gl.enableVertexAttribArray(vColor);    
  
  canvas.addEventListener('mousemove', onMouseMove, false);

  canvas.addEventListener('mousedown', function(event) { 
    rotating = true; 
    setMouse(event);
    camera.initRotate(mouse);
  });

  canvas.addEventListener('mouseup', function() { rotating = false; });

  createPyramid();
  render();  
};

function setMouse(event) {
  vec2.set(mouse, event.clientX / canvas.width, event.clientY / canvas.height);
}

function onMouseMove(event) {
  // rotation mode is on
  if (!rotating) return;

  event.preventDefault();
  
  setMouse(event);
  camera.rotate(mouse);
}

function createPyramid() {
  var colors = [];
  var i = 0;

  // First, initialize the corners of our gasket with three points.
  var vertices = [
    // Front face
     0.0,  1.0,  0.0,
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,

    // Right face
     0.0,  1.0,  0.0,
     1.0, -1.0,  1.0,
     1.0, -1.0, -1.0,

    // Back face
     0.0,  1.0,  0.0,
     1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,

    // Left face
     0.0,  1.0,  0.0,
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,

    // Bottom face 1
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0, -1.0,

    // Bottom face 2
     1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,
     1.0, -1.0,  1.0    
  ];    

  vPyramid = gl.createBuffer();
  vPyramid.itemSize = 3;
  vPyramid.numItems = 18;        

  // Load the data into the GPU
  gl.bindBuffer(gl.ARRAY_BUFFER, vPyramid);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  colors = [];
  for (i = 0; i < vPyramid.numItems; i++) {
    colors = colors.concat([1.0, 0.0, 0.0, 1.0]);
  }   

  cPyramid = gl.createBuffer();
  cPyramid.itemSize = 4;
  cPyramid.numItems = vPyramid.numItems;

  gl.bindBuffer(gl.ARRAY_BUFFER, cPyramid);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);  

  var verticesWire = [
    // Front face
     0.0,  1.0,  0.0,
    -1.0, -1.0,  1.0,

     0.0,  1.0,  0.0,
     1.0, -1.0,  1.0,

    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,

    // Right face
     0.0,  1.0,  0.0,
     1.0, -1.0,  1.0,

     0.0,  1.0,  0.0,
     1.0, -1.0, -1.0,

     1.0, -1.0,  1.0,
     1.0, -1.0, -1.0,

    // Back face
     0.0,  1.0,  0.0,
     1.0, -1.0, -1.0,

     0.0,  1.0,  0.0,
    -1.0, -1.0, -1.0,

     1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,

    // Left face
     0.0,  1.0,  0.0,
    -1.0, -1.0, -1.0,

     0.0,  1.0,  0.0,
    -1.0, -1.0,  1.0,

    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0    
  ];        

  vPyramidWire = gl.createBuffer();
  vPyramidWire.itemSize = 3;
  vPyramidWire.numItems = 24;   

  // Load the wireframe data into the GPU
  gl.bindBuffer(gl.ARRAY_BUFFER, vPyramidWire);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesWire), gl.STATIC_DRAW);   

  colors = [];
  for (i = 0; i < vPyramidWire.numItems; i++) {
    colors = colors.concat([0.0, 0.0, 0.0, 1.0]);
  }   

  cPyramidWire = gl.createBuffer();
  cPyramidWire.itemSize = 4;
  cPyramidWire.numItems = vPyramidWire.numItems;

  gl.bindBuffer(gl.ARRAY_BUFFER, cPyramidWire);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT );

  camera.update();

  gl.uniformMatrix4fv(modelView, false, camera.viewMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vPyramid);
  gl.vertexAttribPointer(vPosition, vPyramid.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cPyramid);
  gl.vertexAttribPointer(vColor, cPyramid.itemSize, gl.FLOAT, false, 0, 0);  

  gl.drawArrays(gl.TRIANGLES, 0, vPyramid.numItems);


  gl.bindBuffer(gl.ARRAY_BUFFER, vPyramidWire);
  gl.vertexAttribPointer(vPosition, vPyramidWire.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cPyramidWire);
  gl.vertexAttribPointer(vColor, cPyramidWire.itemSize, gl.FLOAT, false, 0, 0);  

  gl.drawArrays(gl.LINES, 0, vPyramidWire.numItems);

  raf(render)
}