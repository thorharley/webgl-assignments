"use strict";

var canvas;
var gl;
var fColor;

var BLACK = vec4(0.0, 0.0, 0.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var GREEN = vec4(0.4, 0.86, 0.4, 1.0);
var DEGREES_PER_STEP = 6;
var DEFAULT_RADIUS = 0.3;
var DEFAULT_HEIGHT = 0.5;
var DEFAULT_X = 0;
var DEFAULT_Y = 0;
var DEFAULT_Z = 0;
var DEFAULT_X_ANGLE = 0;
var DEFAULT_Y_ANGLE = 0;
var DEFAULT_Z_ANGLE = 0;
var DEFAULT_AMBIENT = 50;
var DEFAULT_DIFFUSE = 50;
var DEFAULT_SPECULAR = 50;
var DEFAULT_X_CANVAS_ANGLE = 0;
var DEFAULT_Y_CANVAS_ANGLE = -20;
var DEFAULT_Z_CANVAS_ANGLE = 0;

var conicPoints = [];
var circlePoints = [];
var sheetPoints = [];

var normalsArray = [];

var conicPointsCommitted = [];
var circlePointsCommitted = [];
var sheetPointsCommitted = [];

var selectedQuadric = 'sphere';
var theta = [DEFAULT_X_CANVAS_ANGLE, DEFAULT_Y_CANVAS_ANGLE, DEFAULT_Z_CANVAS_ANGLE];
var radius = DEFAULT_RADIUS;
var height = DEFAULT_HEIGHT;
var xPos = DEFAULT_X;
var yPos = DEFAULT_Y;
var zPos = DEFAULT_Z;
var ambient = DEFAULT_AMBIENT;
var diffuse = DEFAULT_DIFFUSE;
var specular = DEFAULT_SPECULAR;
var xAngle = DEFAULT_X_ANGLE;
var yAngle = DEFAULT_Y_ANGLE;
var zAngle = DEFAULT_Z_ANGLE;

var hasEditableQuadric = false;

var thetaLoc;
var vBuffer, nBuffer;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    initUi();
    initLighting();

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
 
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    fColor = gl.getUniformLocation(program, "fColor");
    thetaLoc = gl.getUniformLocation(program, "theta");

    render();
}

function initLighting() {
    var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
    var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
    var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

    var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
    var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
    var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
    var materialShininess = 100.0;
}

function initUi() {
    $("#quadric").on("change", onSelectChange);
    $("#xCanvasSlider").on("input", onCanvasAngleChange);
    $("#yCanvasSlider").on("input", onCanvasAngleChange);
    $("#zCanvasSlider").on("input", onCanvasAngleChange);
    $("#radiusSlider").on("input", onRadiusChange);
    $("#heightSlider").on("input", onHeightChange);
    $("#xPosSlider").on("input", onXPosChange);
    $("#yPosSlider").on("input", onYPosChange);
    $("#zPosSlider").on("input", onZPosChange);
    $("#xSlider").on("input", onAngleChange);
    $("#ySlider").on("input", onAngleChange);
    $("#zSlider").on("input", onAngleChange);

    $("#ambientSlider").on("input", onAmbientChange);
    $("#diffuseSlider").on("input", onDiffuseChange);
    $("#specularSlider").on("input", onSpecularChange);

    var option = $("#quadric")[0].selectedOptions[0].value;
    selectedQuadric = option;
}

function resetControls() {
    resetOrientation();
    resetDimensions();
    resetPosition();
    resetLighting();
    // resetCanvasOrientation();
}
var resetOrientation = function() {
    $("#xSlider").val(DEFAULT_X_ANGLE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_X_ANGLE + ' degrees');
    $("#ySlider").val(DEFAULT_Y_ANGLE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_Y_ANGLE + ' degrees');
    $("#zSlider").val(DEFAULT_Z_ANGLE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_Z_ANGLE + ' degrees');
    xAngle = DEFAULT_X_ANGLE;
    yAngle = DEFAULT_Y_ANGLE;
    zAngle = DEFAULT_Z_ANGLE;
    buildVertices();
}
var resetDimensions = function() {
    $("#radiusSlider").val(DEFAULT_RADIUS).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_RADIUS + ' units');
    $("#heightSlider").val(DEFAULT_HEIGHT).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_HEIGHT + ' units');
    radius = DEFAULT_RADIUS;
    height = DEFAULT_HEIGHT;
    buildVertices();
}
var resetPosition = function() {
    $("#xPosSlider").val(DEFAULT_X).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_X + ' units');
    $("#yPosSlider").val(DEFAULT_Y).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_Y + ' units');
    $("#zPosSlider").val(DEFAULT_Z).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_Z + ' units');
    xPos = DEFAULT_X;
    yPos = DEFAULT_Y;
    zPos = DEFAULT_Z;
    buildVertices();
}
var resetLighting = function() {
    $("#ambientSlider").val(DEFAULT_AMBIENT).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_AMBIENT + '%');
    $("#diffuseSlider").val(DEFAULT_DIFFUSE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_DIFFUSE + '%');
    $("#specularSlider").val(DEFAULT_SPECULAR).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_SPECULAR + '%');
    ambient = DEFAULT_AMBIENT;
    diffuse = DEFAULT_DIFFUSE;
    specular = DEFAULT_SPECULAR;
}
var resetCanvasOrientation = function() {
    $("#xCanvasSlider").val(DEFAULT_X_CANVAS_ANGLE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_X_CANVAS_ANGLE + ' degrees');
    $("#yCanvasSlider").val(DEFAULT_Y_CANVAS_ANGLE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_Y_CANVAS_ANGLE + ' degrees');
    $("#zCanvasSlider").val(DEFAULT_Z_CANVAS_ANGLE).parent().find('.dimension-value')[0].innerHTML = (DEFAULT_Z_CANVAS_ANGLE + ' degrees');
    theta = [DEFAULT_X_CANVAS_ANGLE, DEFAULT_Y_CANVAS_ANGLE, DEFAULT_Z_CANVAS_ANGLE];
    buildVertices();
}
var resetAll = function() {
    resetControls();
    buildVertices();
}
var createNew = function() {
    hasEditableQuadric = true;
    buildVertices();
}
var addQuadric = function() {
    conicPointsCommitted = conicPointsCommitted.concat(conicPoints);
    circlePointsCommitted = circlePointsCommitted.concat(circlePoints);
    sheetPointsCommitted = sheetPointsCommitted.concat(sheetPoints);
    hasEditableQuadric = false;
    resetControls();
}
var onSelectChange = function(e) {
    var option = e.target.selectedOptions[0].value;
    selectedQuadric = option;
}
var onCanvasAngleChange = function(e) {
    var value = e.target.value;
    var index;
    switch (e.target.id) {
        case 'xCanvasSlider':
            index = 0;
            break;
        case 'yCanvasSlider':
            index = 1;
            break;
        case 'zCanvasSlider':
            index = 2;
            break;
    }
    theta[index] = value;
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' degrees');
    buildVertices();
}
var onAngleChange = function(e) {
    var value = e.target.value;
    switch (e.target.id) {
        case 'xSlider':
            xAngle = 2 * Math.PI * value / 360;
            break;
        case 'ySlider':
            yAngle = 2 * Math.PI * value / 360;
            break;
        case 'zSlider':
            zAngle = 2 * Math.PI * value / 360;
            break;
    }
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' degrees');
    buildVertices();
}
var onRadiusChange = function(e) {
    var value = e.target.value;
    radius = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}
var onHeightChange = function(e) {
    var value = e.target.value;
    height = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}
var onXPosChange = function(e) {
    var value = e.target.value;
    xPos = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}
var onYPosChange = function(e) {
    var value = e.target.value;
    yPos = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}
var onZPosChange = function(e) {
    var value = e.target.value;
    zPos = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + ' units');
    buildVertices();
}
var onAmbientChange = function(e) {
    var value = e.target.value;
    ambient = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + '%');
}
var onDiffuseChange = function(e) {
    var value = e.target.value;
    diffuse = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + '%');
}
var onSpecularChange = function(e) {
    var value = e.target.value;
    specular = parseFloat(value);
    $(e.target).parent().find('.dimension-value')[0].innerHTML = (value + '%');
}

function buildVertices() {
    if (!hasEditableQuadric) {
        return;
    }
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

function tX(x) {
    return x + xPos;
}

function tY(y) {
    return y + yPos;
}

function tZ(z) {
    return z + zPos;
}

function cone() {
    circle(0);
    conic();
}

function cylinder() {
    circle(0);
    circle(height);
    sheet();
}

function sphere() {
    circleStrip(10, 20);
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

        vertices.push(translate(rotate(vec4(x1, y1, z1, 1.0))));
        vertices.push(translate(rotate(vec4(x2, y2, z2, 1.0))));
        vertices.push(translate(rotate(vec4(x3, y3, z3, 1.0))));
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

        vertices.push(translate(rotate(vec4(x1, y1, z1, 1.0))));
        vertices.push(translate(rotate(vec4(x2, y2, z2, 1.0))));
        vertices.push(translate(rotate(vec4(x3, y3, z3, 1.0))));
        vertices.push(translate(rotate(vec4(x4, y4, z4, 1.0))));
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
        vertices.push(translate(rotate(vec4(xOffset, 0, 0, 1.0))));
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        vertices.push(translate(rotate(vec4(xOffset, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0))));
        vertices.push(translate(rotate(vec4(xOffset, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0))));
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
    var normals = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {

        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;

        var p1 = vec4(height, 0, 0, 1.0);
        var p2 = vec4(0, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0);
        var p3 = vec4(0, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0);
        var t1 = subtract(p1, p2);
        var t2 = subtract(p1, p3);
        var normal = normalize(vec3(cross(t1, t2)));

        vertices.push(translate(rotate(p1)));
        vertices.push(translate(rotate(p2)));
        vertices.push(translate(rotate(p3)));
        normals.push(normal);
        normals.push(normal);
        normals.push(normal);

    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        var v1 = vertices[j];
        conicPoints.push(vertices[j]);
        normalsArray.push(normals[j]);
    }
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    conicPoints.push(vertices[3 * 360 / DEGREES_PER_STEP - 1]);
    normalsArray.push(normals[3 * 360 / DEGREES_PER_STEP - 1]);
    normalsArray.push(normals[3 * 360 / DEGREES_PER_STEP - 1]);
    normalsArray.push(normals[3 * 360 / DEGREES_PER_STEP - 1]);
}

function sheet() {
    var vertices = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        vertices.push(translate(rotate(vec4(0, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0))));
        vertices.push(translate(rotate(vec4(0, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0))));
        vertices.push(translate(rotate(vec4(height, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0))));
        vertices.push(translate(rotate(vec4(height, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0))));
    };
    for (var j = 0; j < 4 * 360 / DEGREES_PER_STEP; ++j) {
        sheetPoints.push(vertices[j]);
    }
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
    sheetPoints.push(vertices[4 * 360 / DEGREES_PER_STEP - 1]);
}

function rotate(v) {
    var x = v[0];
    var y = v[1];
    var z = v[2];
    // Rotate about x
    var x1 = x;
    var y1 = y * Math.cos(xAngle) - z * Math.sin(xAngle);
    var z1 = y * Math.sin(xAngle) + z * Math.cos(xAngle);
    // Then about y
    var x2 = z1 * Math.sin(yAngle) + x1 * Math.cos(yAngle);
    var y2 = y1;
    var z2 = z1 * Math.cos(yAngle) - x1 * Math.sin(yAngle);
    // Then about z
    var x3 = x2 * Math.cos(zAngle) - y2 * Math.sin(zAngle);
    var y3 = x2 * Math.sin(zAngle) + y2 * Math.cos(zAngle);
    var z3 = z2;

    return vec4(x3, y3, z3, v[3]);
}

function translate(v) {
    return vec4(tX(v[0]), tY(v[1]), tZ(v[2]), v[3]);
}

function render() {
    if (!vBuffer) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3fv(thetaLoc, theta);

    // Render current quadric

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.DYNAMIC_DRAW );


    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circlePoints), gl.DYNAMIC_DRAW);
    for (var i = 0; i < circlePoints.length; i += 3) {
        gl.uniform4fv(fColor, flatten(RED));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
        gl.uniform4fv(fColor, flatten(BLACK));
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sheetPoints), gl.DYNAMIC_DRAW);

    for (var i = 0; i < sheetPoints.length; i += 4) {
        gl.uniform4fv(fColor, flatten(RED));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        gl.uniform4fv(fColor, flatten(BLACK));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(conicPoints), gl.DYNAMIC_DRAW);

    for (var i = 0; i < conicPoints.length; i += 3) {
        gl.uniform4fv(fColor, flatten(RED));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
        gl.uniform4fv(fColor, flatten(BLACK));
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }

    // Render committed quadrics

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circlePointsCommitted), gl.DYNAMIC_DRAW);

    for (var i = 0; i < circlePointsCommitted.length; i += 3) {
        gl.uniform4fv(fColor, flatten(GREEN));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
        gl.uniform4fv(fColor, flatten(BLACK));
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sheetPointsCommitted), gl.DYNAMIC_DRAW);

    for (var i = 0; i < sheetPointsCommitted.length; i += 4) {
        gl.uniform4fv(fColor, flatten(GREEN));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        gl.uniform4fv(fColor, flatten(BLACK));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(conicPointsCommitted), gl.DYNAMIC_DRAW);

    for (var i = 0; i < conicPointsCommitted.length; i += 3) {
        gl.uniform4fv(fColor, flatten(GREEN));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
        gl.uniform4fv(fColor, flatten(BLACK));
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }

    requestAnimFrame(render);
}