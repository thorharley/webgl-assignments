"use strict";

var canvas;
var gl;
var fColor;

var black = vec4(0.0, 0.0, 0.0, 1.0);
var red = vec4(1.0, 0.0, 0.0, 1.0);
var DEGREES_PER_STEP = 6;

//var NumVertices = 2*3*360/DEGREES_PER_STEP + 1;//2 * 362 + 1;

var conicPoints = [];
var circlePoints = [];
var sheetPoints = [];

var selectedQuadric = 'sphere';
var axis = 0;
var theta = [0, -18, 0];
var radius = 0.3;
var length = 0.5;

var thetaLoc;
var vBuffer;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    initUi();

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    buildVertices();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circlePoints), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    fColor = gl.getUniformLocation(program, "fColor");
    thetaLoc = gl.getUniformLocation(program, "theta");

    render();
}

function initUi() {
    $("#quadric").on("change", onSelectChange);
    $("#xSlider").on("input", onAngleChange);
    $("#ySlider").on("input", onAngleChange);
    $("#zSlider").on("input", onAngleChange);
    $("#radiusSlider").on("input", onRadiusChange);
    $("#lengthSlider").on("input", onLengthChange);
}
var onSelectChange = function(e) {
    var option = e.target.selectedOptions[0].value;
    selectedQuadric = option;
    buildVertices();
}
var onAngleChange = function(e) {
    var value = e.target.value;
    var index;
    switch (e.target.id) {
        case 'xSlider':
            index = 0;
            break;
        case 'ySlider':
            index = 1;
            break;
        case 'zSlider':
            index = 2;
            break;
    }
    theta[index] = value;
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' degrees');
}
var onRadiusChange = function(e) {
    var value = e.target.value;
    radius = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}
var onLengthChange = function(e) {
    var value = e.target.value;
    length = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}

function buildVertices() {
    circlePoints = [];
    sheetPoints = [];
    conicPoints = [];
    switch (selectedQuadric) {
        case 'cone':
            cone();
            break;
        case 'cylinder':
            cylinder();
            break;
        case 'sphere':
            sphere();
            break;
    }
}

function cone() {
    circle(0);
    conic()
}

function cylinder() {
    circle(0);
    circle(length);
    sheet();
}

function sphere() {
    circleStrip(10,20);
    circleStrip(20, 30);
    circleStrip(30, 40);
    circleStrip(40, 50);
    circleStrip(50, 60);
    circleStrip(60, 70);
    circleStrip(70, 80);
    circleStrip(80, 90);
    circleStrip(90, 100);
    circleStrip(100, 110);
    circleStrip(110, 120);
    circleStrip(120, 130);
    circleStrip(130, 140);
    circleStrip(140, 150);
    circleStrip(150, 160);
    circleStrip(160, 170);
    circleCap(radius, 10);
    circleCap(-radius, 170);
}

function circleCap(x, startLat) {
    var vertices = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;

        var polarAngle = startLat * 2 * Math.PI / 360;
        
        var x1 = radius * Math.cos(polarAngle);
        var x2 = x1;
        var x3 = x;

        var y1 = radius * Math.sin(angle1) * Math.sin(polarAngle);
        var y2 = radius * Math.sin(angle2) * Math.sin(polarAngle);
        var y3 = 0;

        var z1 = radius * Math.cos(angle1) * Math.sin(polarAngle);
        var z2 = radius * Math.cos(angle2) * Math.sin(polarAngle);
        var z3 = 0;

        vertices.push(vec4(x1, y1, z1, 1.0));
        vertices.push(vec4(x2, y2, z2, 1.0));
        vertices.push(vec4(x3, y3, z3, 1.0));
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        conicPoints.push(vertices[j]);
    }
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
}

function circleStrip(startLat, stopLat) {
    var vertices = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        var polarAngle1 = startLat * 2 * Math.PI / 360;
        var polarAngle2 = stopLat * 2 * Math.PI / 360;
        var x1 = radius * Math.cos(polarAngle1);
        var x2 = x1;
        var x3 = radius * Math.cos(polarAngle2);
        var x4 = x3;

        var y1 = radius * Math.sin(angle1) * Math.sin(polarAngle1);
        var y2 = radius * Math.sin(angle2) * Math.sin(polarAngle1);
        var y3 = radius * Math.sin(angle2) * Math.sin(polarAngle2);
        var y4 = radius * Math.sin(angle1) * Math.sin(polarAngle2);

        var z1 = radius * Math.cos(angle1) * Math.sin(polarAngle1);
        var z2 = radius * Math.cos(angle2) * Math.sin(polarAngle1);
        var z3 = radius * Math.cos(angle2) * Math.sin(polarAngle2);
        var z4 = radius * Math.cos(angle1) * Math.sin(polarAngle2);

        vertices.push(vec4(x1, y1, z1, 1.0));
        vertices.push(vec4(x2, y2, z2, 1.0));
        vertices.push(vec4(x3, y3, z3, 1.0));
        vertices.push(vec4(x4, y4, z4, 1.0));
    };
    for (var j = 0; j < 4 * 360 / DEGREES_PER_STEP; ++j) {
        sheetPoints.push(vertices[j]);
    }
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
}

function circle(xOffset) {
    var vertices = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        vertices.push(vec4(xOffset, 0, 0, 1.0));
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        vertices.push(vec4(xOffset, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0));
        vertices.push(vec4(xOffset, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0));
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        circlePoints.push(vertices[j]);
    }
    circlePoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    circlePoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    circlePoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
}

function conic() {
    var vertices = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        vertices.push(vec4(length, 0, 0, 1.0));
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        vertices.push(vec4(0, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0));
        vertices.push(vec4(0, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0));
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        conicPoints.push(vertices[j]);
    }
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
}

function sheet() {
    var vertices = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        vertices.push(vec4(0, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0));
        vertices.push(vec4(0, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0));
        vertices.push(vec4(length, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0));
        vertices.push(vec4(length, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0));
    };
    for (var j = 0; j < 4 * 360 / DEGREES_PER_STEP; ++j) {
        sheetPoints.push(vertices[j]);
    }
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
}

function render() {
    if (!vBuffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circlePoints), gl.DYNAMIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3fv(thetaLoc, theta);

    for (var i = 0; i < circlePoints.length; i += 3) {
        gl.uniform4fv(fColor, flatten(red));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sheetPoints), gl.DYNAMIC_DRAW);

    for (var i = 0; i < sheetPoints.length; i += 4) {
        gl.uniform4fv(fColor, flatten(red));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(conicPoints), gl.DYNAMIC_DRAW);

    for (var i = 0; i < conicPoints.length; i += 3) {
        gl.uniform4fv(fColor, flatten(red));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }

    requestAnimFrame(render);
}