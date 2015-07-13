var points = [];
var ITERATIONS;
var THETA;
var canvas;
var iterationsInput;
var twistInput;

window.onload = function init() {
    iterationsInput = document.getElementById('iterations');
    twistInput = document.getElementById('twist');
    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert('WebGL isn\'t available');
    }
    refresh();
};

/* Display one triangle */
function triangle(a, b, c) {
    points.push(twist(a), twist(b), twist(c));
}

function divideTriangle(a, b, c, count) {
    // check for end of recursion
    if (count === 0) {
        triangle(a, b, c);
    } else {
        // bisect the sides
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        --count;

        // three new triangles
        divideTriangle(a, ab, ac, count);
        divideTriangle(c, ac, bc, count);
        divideTriangle(b, bc, ab, count);
    }
}

function twist(point) {
    var newAngle = thetaPrime(point[0], point[1], THETA);
    return vec2(xPrime(point[0], point[1], newAngle), yPrime(point[0], point[1], newAngle));
}

function thetaPrime(x, y, theta) {
    return Math.sqrt(x*x + y*y) * theta;
}

function xPrime(x, y, theta) {
    return x*Math.cos(theta) - y*Math.sin(theta);
}

function yPrime(x, y, theta) {
    return x*Math.sin(theta) + y*Math.cos(theta);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

var refresh = function() {
    ITERATIONS = parseFloat(iterationsInput.value);
    THETA = parseFloat(twistInput.value);

    points = [];

    /* Initial triangle */

    var vertices = [
        vec2(-0.5, -0.5),
        vec2(0, 0.5),
        vec2(0.5, -0.5)
    ];

    divideTriangle(vertices[0], vertices[1], vertices[2], ITERATIONS);

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialise attribute buffers
    var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate shader variables with variables in JS file
    var vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();

};