"use strict";

var canvas;
var gl;

var NumVertices  = 2*362+1;//36;

var points = [];
var colors = [];

var axis = 0;
var theta = [ 0, 45, 0 ];
var radius = 0.5;
var length = 0.5;

var thetaLoc;

var vBuffer;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    initUi();

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    buildVertices();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

    render();
}

function initUi() {
    $("#xSlider").on("input", onAngleChange);
    $("#ySlider").on("input", onAngleChange);
    $("#zSlider").on("input", onAngleChange);
    $("#radiusSlider").on("input", onRadiusChange);
    $("#lengthSlider").on("input", onLengthChange);
}
var onAngleChange = function(e) {
    var value = e.target.value;
    var index;
    switch(e.target.id) {
        case 'xSlider': index = 0; break;
        case 'ySlider': index = 1; break;
        case 'zSlider': index = 2; break;
    }
    theta[index] = value;
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value+' degrees');
}
var onRadiusChange = function(e) {
    var value = e.target.value;
    radius = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value+' units');
    buildVertices();
}
var onLengthChange = function(e) {
    var value = e.target.value;
    length = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value+' units');
    buildVertices();
}


function buildVertices() {
    //colorCube();
    cone();
}

function cone() {
    points = [];
    circle();
    conic()
    if (!vBuffer) return;
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );   
}

function triangle() {
    var v = length/2;
    var vertices = [
        vec4( -v, -v,  v, 1.0 ),
        vec4( -v,  v,  v, 1.0 ),
        vec4(  v,  v,  v, 1.0 )
    ];
}

function circle() {
    var r = radius;
    var vertices = [
        vec4( 0, 0, 0, 1.0 )
    ];

    for (var i = 0; i < 361; i++) {
        //console.log(i+'  '+r*Math.sin(i*2*Math.PI/360)+'  '+r*Math.cos(i*2*Math.PI/360));
        var angle = i*2*Math.PI/360;
        vertices.push(vec4( 0,  radius*Math.sin(angle), radius*Math.cos(angle), 1.0 ));
    };
   
    for ( var j = 0; j < 362; ++j ) {
        points.push(vertices[j] );
        colors.push([ 1.0, 0.0, 0.0, 1.0 ]);
    }
            points.push(vertices[361] );
            colors.push([ 1.0, 0.0, 0.0, 1.0 ]);

}

function conic() {
    var r = radius;
    var vertices = [
        vec4( length, 0, 0, 1.0 )
    ];

    for (var i = 0; i < 361; i++) {
        //console.log(i+'  '+r*Math.sin(i*2*Math.PI/360)+'  '+r*Math.cos(i*2*Math.PI/360));
        var angle = i*2*Math.PI/360;
        vertices.push(vec4( 0,  r*Math.sin(angle), r*Math.cos(angle), 1.0 ));
    };
   
    for ( var j = 0; j < 362; ++j ) {
        points.push(vertices[j] );
        colors.push([ 0.0, 1.0, 0.0, 1.0 ]);
    }
}

function colorCube() {
    points = [];
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
    if (!vBuffer) return;
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );   
}

function quad(a, b, c, d)
{
    var v = length/2;
    var vertices = [
        vec4( -v, -v,  v, 1.0 ),
        vec4( -v,  v,  v, 1.0 ),
        vec4(  v,  v,  v, 1.0 ),
        vec4(  v, -v,  v, 1.0 ),
        vec4( -v, -v, -v, 1.0 ),
        vec4( -v,  v, -v, 1.0 ),
        vec4(  v,  v, -v, 1.0 ),
        vec4(  v, -v, -v, 1.0 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3fv(thetaLoc, theta);

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 363 );
    gl.drawArrays( gl.TRIANGLE_FAN, 363, 362 );

    requestAnimFrame( render );
}

// var maxVertices = 1000000;
// var index = 0;
// var bufferId;
// var shouldDraw = false;

// window.onload = function init() {

//     $(".slider").on("input", onChange);

//     canvas = document.getElementById('gl-canvas');
//     gl = WebGLUtils.setupWebGL(canvas);
//     if (!gl) {
//         alert('WebGL isn\'t available');
//     }
//     // Configure WebGL
//     gl.viewport(0, 0, canvas.width, canvas.height);
//     gl.clearColor(0.0, 0.0, 0.0, 1.0);

//     // Load shaders and initialise attribute buffers
//     var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
//     gl.useProgram(program);

//     // Load the data into the GPU
//     bufferId = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
//     gl.bufferData(gl.ARRAY_BUFFER, 8*maxVertices, gl.DYNAMIC_DRAW);

//     // Associate shader variables with variables in JS file
//     var vPosition = gl.getAttribLocation(program, 'vPosition');
//     gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(vPosition);

//     canvas.addEventListener("mousemove", mouseMove);
//     canvas.addEventListener("mousedown", mouseDown);
//     canvas.addEventListener("mouseup", mouseUp);
//     canvas.addEventListener("mouseenter", mouseEnter);
//     canvas.addEventListener("mouseout", mouseOut);
//     render();
// };

// function mouseMove(event) {
//     if (shouldDraw === true) {
//         addPoint(event);
//         index++;
//     }
// }

// function mouseUp(event) {
//     shouldDraw = false;
//     addPoint(event);
//     addPoint(event);
//     index++;
// }

// function mouseEnter(event) {
//     if (event.buttons !== 0) {
//         mouseDown(event);
//     }
// }

// function mouseOut(event) {
//     if (event.buttons !== 0) {
//         mouseUp(event);
//     }
// }

// function mouseDown(event) {
//     shouldDraw = true;
//     addPoint(event);
//     addPoint(event);
//     index++;
// }

// var clearCanvas = function() {
//     shouldDraw = false;
//     index = 0;
//     gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
//     gl.bufferData(gl.ARRAY_BUFFER, 8*maxVertices, gl.DYNAMIC_DRAW);
// };

// var addCylinder = function() {

// }
// var onChange = function(e) {
//     var value = e.target.value;
//     $('#cylinderlength').html(value);
// }

// function addPoint(event) {

//     var rect = canvas.getBoundingClientRect();
//     var x = event.clientX - rect.left;
//     var y = event.clientY - rect.top;

//     var point = vec2(2*x/canvas.width-1, 2*(canvas.height-y)/canvas.height-1);
//     gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
//     gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(point));
// }

// function render() {
//     gl.clear(gl.COLOR_BUFFER_BIT);
//     gl.drawArrays(gl.LINES, 0, index);
//     window.requestAnimFrame(render);
// }