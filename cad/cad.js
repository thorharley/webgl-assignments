var maxVertices = 1000000;
var index = 0;
var bufferId;
var shouldDraw = false;

window.onload = function init() {

    $(".slider").on("input", onChange);

    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert('WebGL isn\'t available');
    }
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialise attribute buffers
    var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxVertices, gl.DYNAMIC_DRAW);

    // Associate shader variables with variables in JS file
    var vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mouseenter", mouseEnter);
    canvas.addEventListener("mouseout", mouseOut);
    render();
};

function mouseMove(event) {
    if (shouldDraw === true) {
        addPoint(event);
        index++;
    }
}

function mouseUp(event) {
    shouldDraw = false;
    addPoint(event);
    addPoint(event);
    index++;
}

function mouseEnter(event) {
    if (event.buttons !== 0) {
        mouseDown(event);
    }
}

function mouseOut(event) {
    if (event.buttons !== 0) {
        mouseUp(event);
    }
}

function mouseDown(event) {
    shouldDraw = true;
    addPoint(event);
    addPoint(event);
    index++;
}

var clearCanvas = function() {
    shouldDraw = false;
    index = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxVertices, gl.DYNAMIC_DRAW);
};

var addCylinder = function() {

}
var onChange = function(e) {
    var value = e.target.value;
    $('#cylinderlength').html(value);
}

function addPoint(event) {
    
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    var point = vec2(2*x/canvas.width-1, 2*(canvas.height-y)/canvas.height-1);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(point));
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, index);
    window.requestAnimFrame(render);
}