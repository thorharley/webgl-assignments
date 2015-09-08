"use strict";

var canvas;
var gl;

var DEGREES_PER_STEP = 10;
var DEFAULT_RADIUS = 0.6;
var DEFAULT_HEIGHT = 0.5;
var DEFAULT_X = 0;
var DEFAULT_Y = 0;
var DEFAULT_Z = 0;
var DEFAULT_X_ANGLE = 0;
var DEFAULT_Y_ANGLE = 0;
var DEFAULT_Z_ANGLE = 0;
var DEFAULT_DISTANCE = 4;
var DEFAULT_SPEED = 0.02;
var DEFAULT_AMBIENT = 20;
var DEFAULT_DIFFUSE = 50;
var DEFAULT_SPECULAR = 50;
var DEFAULT_X_CANVAS_ANGLE = 0;
var DEFAULT_Y_CANVAS_ANGLE = 0;
var DEFAULT_Z_CANVAS_ANGLE = 0;

var modelView, projection;
var viewerPos;
var program

var capPoints = [];
var conicPoints = [];
var circlePoints = [];
var sheetPoints = [];
var stripPoints = [];

var capNormalsArray = [];
var circleNormalsArray = [];
var stripNormalsArray = [];
var sheetNormalsArray = [];
var conicNormalsArray = [];

var capTexCoordsArray = [];
var stripTexCoordsArray = [];

var conicPointsCommitted = [];
var circlePointsCommitted = [];
var sheetPointsCommitted = [];

var selectedQuadric = 'sphere';
var radius = DEFAULT_RADIUS;
var height = DEFAULT_HEIGHT;
var xPos = DEFAULT_X;
var yPos = DEFAULT_Y;
var zPos = DEFAULT_Z;
var speed1 = DEFAULT_SPEED;
var speed2 = DEFAULT_SPEED;
var distance1 = DEFAULT_DISTANCE;
var distance2 = DEFAULT_DISTANCE;
var ambient = DEFAULT_AMBIENT;
var diffuse1 = DEFAULT_DIFFUSE;
var specular1 = DEFAULT_SPECULAR;
var diffuse2 = DEFAULT_DIFFUSE;
var specular2 = DEFAULT_SPECULAR;
var xAngle = DEFAULT_X_ANGLE;
var yAngle = DEFAULT_Y_ANGLE;
var zAngle = DEFAULT_Z_ANGLE;

var materialShininess = 50.0;

var lightAngle1 = 0;
var lightAngle2 = 0;

var lightPosition1 = vec4(distance1, 0.0, 0.0, 0.0 );
var lightPosition2 = vec4(0.0, distance2, 0.0, 0.0 );

var hasEditableQuadric = false;

var thetaLoc;
var vBuffer, nBuffer, tBuffer;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta = [20, -20, 20];

var tumble = false;
var lightOn1 = true;
var lightOn2 = true;
var orbit1 = true;
var orbit2 = true;

var texSize = 256;
var numChecks = 8;
var image1 = new Uint8Array(4*texSize*texSize);
var texture1;
var t1;
var c;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    initUi();
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    createNew();

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
 
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta");
    viewerPos = vec3(0.0, 0.0, -20.0 );
    projection = ortho(-1, 1, -1, 1, -100, 100);

    updateLighting();

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projection));

    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
   
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    var vTexCoord2 = gl.getAttribLocation( program, "vTexCoord2" );
    gl.vertexAttribPointer( vTexCoord2, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord2 );

    createCheckerboard();
    configureTexture();

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);

    render();
}

function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
}

function updateLighting() {

    var lightOn1Factor = lightOn1 ? 1.0 : 0.0;
    var lightOn2Factor = lightOn2 ? 1.0 : 0.0;

    var ambientFactor = ambient/100;
    var diffuseFactor1 = lightOn1Factor*diffuse1/100;
    var specularFactor1 = lightOn1Factor*specular1/100;
    var diffuseFactor2 = lightOn2Factor*diffuse2/100;
    var specularFactor2 = lightOn2Factor*specular2/100;

    var lightAmbient = vec4(ambientFactor*1.0, ambientFactor*1.0, ambientFactor*0.0, 1.0 );
    
    var lightDiffuse1 = vec4(diffuseFactor1*1.0, diffuseFactor1*0.5, diffuseFactor1*0.5, 1.0);
    var lightSpecular1 = vec4(specularFactor1*1.0, specularFactor1*0.5, specularFactor1*0.5, 1.0 );
    var lightDiffuse2 = vec4(diffuseFactor2*0.5, diffuseFactor2*0.5, diffuseFactor2*1.0, 1.0);
    var lightSpecular2 = vec4(specularFactor2*0.5, specularFactor2*0.5, specularFactor2*1.0, 1.0 );

    var materialAmbient = vec4( 0.3, 0.3, 0.3, 0.3 );
    var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct1 = mult(lightDiffuse1, materialDiffuse);
    var specularProduct1 = mult(lightSpecular1, materialSpecular);
    var diffuseProduct2 = mult(lightDiffuse2, materialDiffuse);
    var specularProduct2 = mult(lightSpecular2, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct1"), flatten(diffuseProduct1) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct1"), flatten(specularProduct1) );
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct2"), flatten(diffuseProduct2) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct2"), flatten(specularProduct2) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition1"), flatten(lightPosition1) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition2"), flatten(lightPosition2) );

    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
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

    $("#tumble").on("change", onTumbleChange);
    $("#lightOn1").on("change", onLightOn1Change);
    $("#lightOn2").on("change", onLightOn2Change);
    $("#orbit1").on("change", onOrbit1Change);
    $("#orbit2").on("change", onOrbit2Change);

    $("#ambientSlider").on("input", onAmbientChange);
    $("#speedSlider1").on("input", onSpeed1Change);
    $("#speedSlider2").on("input", onSpeed2Change);
    $("#distanceSlider1").on("input", onDistance1Change);
    $("#diffuseSlider1").on("input", onDiffuse1Change);
    $("#specularSlider1").on("input", onSpecular1Change);
    $("#distanceSlider2").on("input", onDistance2Change);
    $("#diffuseSlider2").on("input", onDiffuse2Change);
    $("#specularSlider2").on("input", onSpecular2Change);

    var option = $("#quadric")[0].selectedOptions[0].value;
    selectedQuadric = option;
}

function resetControls() {
    resetOrientation();
    resetDimensions();
    resetLighting();
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
    //theta = [DEFAULT_X_CANVAS_ANGLE, DEFAULT_Y_CANVAS_ANGLE, DEFAULT_Z_CANVAS_ANGLE];
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
    createNew();
}
var onTumbleChange = function(e) {
    var checked = e.target.checked;
    tumble = checked;
}
var onLightOn1Change = function(e) {
    var checked = e.target.checked;
    lightOn1 = checked;
    updateLighting();
}
var onLightOn2Change = function(e) {
    var checked = e.target.checked;
    lightOn2 = checked;
    updateLighting();
}
var onOrbit1Change = function(e) {
    var checked = e.target.checked;
    orbit1 = checked;
}
var onOrbit2Change = function(e) {
    var checked = e.target.checked;
    orbit2 = checked;
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
            xAngle = value;
            break;
        case 'ySlider':
            yAngle = value;
            break;
        case 'zSlider':
            zAngle = value;
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
var onSpeed1Change = function(e) {
    var value = e.target.value;
    speed1 = parseFloat(value);
    $(e.target).parent().find('#speed1')[0].innerHTML = value;
}
var onSpeed2Change = function(e) {
    var value = e.target.value;
    speed2 = parseFloat(value);
    $(e.target).parent().find('#speed2')[0].innerHTML = value;
}
var onDistance1Change = function(e) {
    var value = e.target.value;
    distance1 = parseFloat(value);
    $(e.target).parent().find('#distance1')[0].innerHTML = value;
    updateLighting();
}
var onDistance2Change = function(e) {
    var value = e.target.value;
    distance2 = parseFloat(value);
    $(e.target).parent().find('#distance2')[0].innerHTML = value;
    updateLighting();
}
var onAmbientChange = function(e) {
    var value = e.target.value;
    ambient = parseFloat(value);
    $(e.target).parent().find('#ambientPercent')[0].innerHTML = (value + '%');
    updateLighting();
}
var onDiffuse1Change = function(e) {
    var value = e.target.value;
    diffuse1 = parseFloat(value);
    $(e.target).parent().find('#diffusePercent1')[0].innerHTML = (value + '%');
    updateLighting();
}
var onSpecular1Change = function(e) {
    var value = e.target.value;
    specular1 = parseFloat(value);
    $(e.target).parent().find('#specularPercent1')[0].innerHTML = (value + '%');
    updateLighting();
}
var onDiffuse2Change = function(e) {
    var value = e.target.value;
    diffuse2 = parseFloat(value);
    $(e.target).parent().find('#diffusePercent2')[0].innerHTML = (value + '%');
    updateLighting();
}
var onSpecular2Change = function(e) {
    var value = e.target.value;
    specular2 = parseFloat(value);
    $(e.target).parent().find('#specularPercent2')[0].innerHTML = (value + '%');
    updateLighting();
}

function buildVertices() {
    if (!hasEditableQuadric) {
        return;
    }
    circleNormalsArray = [];
    capNormalsArray = [];
    stripNormalsArray = [];
    sheetNormalsArray = [];
    conicNormalsArray = [];
    capPoints = [];
    circlePoints = [];
    sheetPoints = [];
    stripPoints = [];
    conicPoints = [];
    capTexCoordsArray = [];
    stripTexCoordsArray = [];
    switch (selectedQuadric) {
        case 'cone':
            cone();
            break;
        case 'cylinder':
            cylinder();
            break;
        case 'sphere':
            sphere2();
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
    circle(0, true);
    conic();
}

function cylinder() {
    circle(-height/2, true);
    circle(height/2, false);
    sheet();
}

function sphere2() {
   circleCap2(-radius, 170);
   circleCap2(radius, 10);
    for (var i = 10; i < 170; i += DEGREES_PER_STEP) {
        circleStrip2(i, i + DEGREES_PER_STEP);
    }
}

function sphere() {
    circleCap(-radius, 170);
    circleCap(radius, 10);
    for (var i = 10; i < 170; i += DEGREES_PER_STEP) {
        circleStrip(i, i + DEGREES_PER_STEP);
    }
}

function circleCap(centreX, startLat) {
    var vertices = [];
    var normals = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;

        var polarAngle = startLat * 2 * Math.PI / 360;

        var x1 = radius * Math.cos(polarAngle);
        var x2 = x1;
        var x3 = centreX;

        var y1 = radius * Math.sin(angle1) * Math.sin(polarAngle);
        var y2 = radius * Math.sin(angle2) * Math.sin(polarAngle);
        var y3 = 0;

        var z1 = radius * Math.cos(angle1) * Math.sin(polarAngle);
        var z2 = radius * Math.cos(angle2) * Math.sin(polarAngle);
        var z3 = 0;

        var p1 = vec4(x1, y1, z1, 1.0);
        var p2 = vec4(x2, y2, z2, 1.0);
        var p3 = vec4(x3, y3, z3, 1.0);

        if(centreX > 0) {
            vertices.push(p1);
            normals.push(vec3(p1[0],p1[1],p1[2]));
            vertices.push(p2);
            normals.push(vec3(p2[0],p2[1],p2[2]));
            vertices.push(p3);
            normals.push(vec3(p3[0],p3[1],p3[2]));
        } else {
            vertices.push(p1);
            normals.push(vec3(p1[0],p1[1],p1[2]));
            vertices.push(p2);
            normals.push(vec3(p2[0],p2[1],p2[2]));
            vertices.push(p3);
            normals.push(vec3(p3[0],p3[1],p3[2]));
        }
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        capPoints.push(vertices[j]);
        capNormalsArray.push(normals[j]);
        capTexCoordsArray.push(getTexCoords(radius, vertices[j][1], vertices[j][0], vertices[j][2]));
    }
}

function circleCap2(centreY, startLat) {
    var vertices = [];
    var normals = [];
    for (var i = -180; i < 180; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;

        var polarAngle = startLat * 2 * Math.PI / 360;

        var y1 = radius * Math.cos(polarAngle);
        var y2 = y1;
        var y3 = centreY;

        var x1 = radius * Math.sin(angle1) * Math.sin(polarAngle);
        var x2 = radius * Math.sin(angle2) * Math.sin(polarAngle);
        var x3 = 0;

        var z1 = radius * Math.cos(angle1) * Math.sin(polarAngle);
        var z2 = radius * Math.cos(angle2) * Math.sin(polarAngle);
        var z3 = 0;

        var p1 = vec4(x1, y1, z1, 1.0);
        var p2 = vec4(x2, y2, z2, 1.0);
        var p3 = vec4(x3, y3, z3, 1.0);

        vertices.push(p1);
        normals.push(vec3(p1[0],p1[1],p1[2]));
        vertices.push(p2);
        normals.push(vec3(p2[0],p2[1],p2[2]));
        vertices.push(p3);
        normals.push(vec3(p3[0],p3[1],p3[2]));
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        capPoints.push(vertices[j]);
        capNormalsArray.push(normals[j]);
        capTexCoordsArray.push(getTexCoords(radius, vertices[j][0], vertices[j][1], vertices[j][2]));
    }
}

function circleStrip2(startLat, stopLat) {
    var vertices = [];
    var normals = [];
    var textures = [];
    for (var i = -180; i < 180; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;
        var polarAngle1 = startLat * 2 * Math.PI / 360;
        var polarAngle2 = stopLat * 2 * Math.PI / 360;
        var y1 = radius * Math.cos(polarAngle1);
        var y2 = y1;
        var y3 = radius * Math.cos(polarAngle2);
        var y4 = y3;

        var x1 = radius * Math.sin(angle1) * Math.sin(polarAngle1);
        var x2 = radius * Math.sin(angle2) * Math.sin(polarAngle1);
        var x3 = radius * Math.sin(angle2) * Math.sin(polarAngle2);
        var x4 = radius * Math.sin(angle1) * Math.sin(polarAngle2);

        var z1 = radius * Math.cos(angle1) * Math.sin(polarAngle1);
        var z2 = radius * Math.cos(angle2) * Math.sin(polarAngle1);
        var z3 = radius * Math.cos(angle2) * Math.sin(polarAngle2);
        var z4 = radius * Math.cos(angle1) * Math.sin(polarAngle2);

        var p1 = vec4(x1, y1, z1, 1.0);
        var p2 = vec4(x2, y2, z2, 1.0);
        var p3 = vec4(x3, y3, z3, 1.0);
        var p4 = vec4(x4, y4, z4, 1.0);

        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p2);
        var normal = normalize(vec3(cross(t1, t2)));

        vertices.push(p1);
        vertices.push(p4);
        vertices.push(p2);
        vertices.push(p3);
        vertices.push(p4);
        vertices.push(p2);
        normals.push(vec3(p1[0],p1[1],p1[2]));
        normals.push(vec3(p4[0],p4[1],p4[2]));
        normals.push(vec3(p2[0],p2[1],p2[2]));
        normals.push(vec3(p3[0],p3[1],p3[2]));
        normals.push(vec3(p4[0],p4[1],p4[2]));
        normals.push(vec3(p2[0],p2[1],p2[2]));
        textures.push(getTexCoords(radius, p1[0], p1[1], p1[2]));
        textures.push(getTexCoords(radius, p4[0], p4[1], p4[2]));
        textures.push(getTexCoords(radius, p2[0], p2[1], p2[2]));
        textures.push(getTexCoords(radius, p3[0], p3[1], p3[2]));
        textures.push(getTexCoords(radius, p4[0], p4[1], p4[2]));
        textures.push(getTexCoords(radius, p2[0], p2[1], p2[2]));

    };
    for (var j = 0; j < 6 * 360 / DEGREES_PER_STEP; ++j) {
        stripPoints.push(vertices[j]);
        stripNormalsArray.push(normals[j]);
        stripTexCoordsArray.push(textures[j]);
    }
}

function circleStrip(startLat, stopLat) {
    var vertices = [];
    var normals = [];
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

        var p1 = vec4(x1, y1, z1, 1.0);
        var p2 = vec4(x2, y2, z2, 1.0);
        var p3 = vec4(x3, y3, z3, 1.0);
        var p4 = vec4(x4, y4, z4, 1.0);

        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p2);
        var normal = normalize(vec3(cross(t1, t2)));

        vertices.push(p1);
        vertices.push(p4);
        vertices.push(p2);
        vertices.push(p3);
        vertices.push(p4);
        vertices.push(p2);
        normals.push(vec3(p1[0],p1[1],p1[2]));
        normals.push(vec3(p4[0],p4[1],p4[2]));
        normals.push(vec3(p2[0],p2[1],p2[2]));
        normals.push(vec3(p3[0],p3[1],p3[2]));
        normals.push(vec3(p4[0],p4[1],p4[2]));
        normals.push(vec3(p2[0],p2[1],p2[2]));

    };
    for (var j = 0; j < 6 * 360 / DEGREES_PER_STEP; ++j) {
        stripPoints.push(vertices[j]);
        stripNormalsArray.push(normals[j]);
        stripTexCoordsArray.push(getTexCoords(radius, vertices[j][0], vertices[j][1], vertices[j][2]));
    }
}

function circle(xOffset, isOutsidePosX) {
    var vertices = [];
    var normals = [];
    for (var i = 0; i < 360; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;

        var p1 = vec4(xOffset, 0, 0, 1.0);
        var p2 = vec4(xOffset, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0);
        var p3 = vec4(xOffset, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0);
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = isOutsidePosX ? normalize(vec3(cross(t2, t1))) : normalize(vec3(cross(t1, t2)));

        vertices.push(p1);
        normals.push(normal);
        vertices.push(p2);
        normals.push(normal);
        vertices.push(p3);
        normals.push(normal);
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        circlePoints.push(vertices[j]);
        circleNormalsArray.push(normals[j]);
    }
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
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(cross(t1, t2));

            vertices.push(p1);
            normals.push(vec3(p1[0],p1[1],p1[2]));
            vertices.push(p2);
            normals.push(vec3(p2[0],p2[1],p2[2]));
            vertices.push(p3);
            normals.push(vec3(p3[0],p3[1],p3[2]));
    };
    for (var j = 0; j < 3 * 360 / DEGREES_PER_STEP; ++j) {
        conicPoints.push(vertices[j]);
        conicNormalsArray.push(normals[j]);
    }
}

function sheet() {
    var vertices = [];
    var normals = [];
    for (var i = -180; i < 180; i += DEGREES_PER_STEP) {
        var angle1 = i * 2 * Math.PI / 360;
        var angle2 = (i + DEGREES_PER_STEP) * 2 * Math.PI / 360;

        var p1 = vec4(-height/2, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0);
        var p2 = vec4(-height/2, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0);
        var p3 = vec4(height/2, radius * Math.sin(angle1), radius * Math.cos(angle1), 1.0);
        var p4 = vec4(height/2, radius * Math.sin(angle2), radius * Math.cos(angle2), 1.0);
        
        var t1 = subtract(p2, p1);
        var t2 = subtract(p3, p1);
        var normal = normalize(vec3(cross(t1, t2)));

        vertices.push(p1);
        normals.push(vec3(0,p1[1],p1[2]));
        vertices.push(p2);
        normals.push(vec3(0,p2[1],p2[2]));
        vertices.push(p3);
        normals.push(vec3(0,p3[1],p3[2]));
        vertices.push(p1);
        normals.push(vec3(0,p1[1],p1[2]));
        vertices.push(p3);
        normals.push(vec3(0,p3[1],p3[2]));
        vertices.push(p4);
        normals.push(vec3(0,p4[1],p4[2]));
    };
    for (var j = 0; j < 6 * 360 / DEGREES_PER_STEP; ++j) {
        sheetPoints.push(vertices[j]);
        sheetNormalsArray.push(normals[j]);
    }
}

function _rotate(v) {
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

function getTexCoords(r, x, y, z) {
     x = Math.abs(x) > 0.000001 ? x : 0;
     y = Math.abs(y) > 0.000001 ? y : 0;
    var polar = Math.acos(y/r);
    var azimuthal = Math.atan2(z,x);
    var index1 = (polar/(Math.PI));
    var index2 = (azimuthal*0.5/(Math.PI)+0.5);
    //window.console.log(r+' '+x+' '+y+' '+z+' '+index1+' '+index2+' '+polar+' '+azimuthal);
    return vec2(index1, index2);
}

function getTexCoords2(r, x, y, z) {
    // x = Math.abs(x) > 0.000001 ? x : 0;
    // y = Math.abs(y) > 0.000001 ? y : 0;
    // var polar = Math.acos(y/r);
    // var azimuthal = Math.atan2(z,x) + Math.PI;
    // var index1 = Math.abs(polar/(Math.PI));
    // var index2 = Math.abs(azimuthal/(Math.PI));
    //window.console.log(r+' '+x+' '+y+' '+z+' '+index1+' '+index2);
    return vec4(r, x, y, z);
}

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function createCheckerboard() {
    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

}

function render() {
    if (!vBuffer) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (orbit1) {
        lightAngle1 += speed1;
    }
    lightPosition1 = vec4(0.0, distance1*Math.cos(lightAngle1), distance1*Math.sin(lightAngle1), 0.0 );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition1"), flatten(lightPosition1) );
    if (orbit2) {
        lightAngle2 += speed2;
    }
    lightPosition2 = vec4(distance2*Math.cos(lightAngle2), 0.0, distance2*Math.sin(lightAngle2), 0.0 );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition2"), flatten(lightPosition2) );
    
    modelView = mat4();
    if (tumble) {
        theta[0] += 0.2;
        theta[1] += 2.0;
        modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
        modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
        modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    } else {
        modelView = mult(modelView, rotate(xAngle, [1, 0, 0] ));
        modelView = mult(modelView, rotate(yAngle, [0, 1, 0] ));
        modelView = mult(modelView, rotate(zAngle, [0, 0, 1] ));
    }

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView) );

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(circleNormalsArray), gl.DYNAMIC_DRAW );
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circlePoints), gl.DYNAMIC_DRAW);
    for (var i = 0; i < circlePoints.length; i += 3) {
        gl.drawArrays(gl.TRIANGLE_FAN, i, 3);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sheetNormalsArray), gl.DYNAMIC_DRAW );
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sheetPoints), gl.DYNAMIC_DRAW);

    for (var i = 0; i < sheetPoints.length; i += 6) {
        gl.drawArrays(gl.TRIANGLES, i, 6);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(stripNormalsArray), gl.DYNAMIC_DRAW );
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(stripPoints), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(stripTexCoordsArray), gl.DYNAMIC_DRAW );

    for (var i = 0; i < stripPoints.length; i += 6) {
        gl.drawArrays(gl.TRIANGLES, i, 6);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(capNormalsArray), gl.DYNAMIC_DRAW );
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(capPoints), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(capTexCoordsArray), gl.DYNAMIC_DRAW );

    for (var i = 0; i < capPoints.length; i += 3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(conicNormalsArray), gl.DYNAMIC_DRAW );
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(conicPoints), gl.DYNAMIC_DRAW);

    for (var i = 0; i < conicPoints.length; i += 3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    requestAnimFrame(render);
}