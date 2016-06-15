///<reference path='./typings/tsd.d.ts'/>
///<reference path="./localTypings/webglutils.d.ts"/>
define(["require", "exports", './loader'], function (require, exports, loader) {
    "use strict";
    ////////////////////////////////////////////////////////////////////////////////////////////
    // stats module by mrdoob (https://github.com/mrdoob/stats.js) to show the performance 
    // of your graphics
    var stats = new Stats();
    stats.setMode(1); // 0: fps, 1: ms, 2: mb
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
    // get some of our canvas elements that we need
    var canvas = document.getElementById("webgl");
    // utilities
    var rand = function (min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);
    };
    var randInt = function (range) {
        return Math.floor(Math.random() * range);
    };
    //Letters is an array that will store up to 15 letters
    //Textures is an array that will store all the textures
    var letters = [];
    var textures = [];
    //The world width and height are saved globally
    var worldHeight;
    var worldWidth;
    window["reset"] = function () {
        //When the button is pressed, just create a new array
        letters = [];
    };
    //Rectangle is the rect found in offset saved globally
    var rectangle = undefined;
    // some simple interaction using the mouse.
    // we are going to get small motion offsets of the mouse, and use these to rotate the object
    //
    // our offset() function from assignment 0, to give us a good mouse position in the canvas 
    function offset(e) {
        e = e || window.event;
        var target = e.target || e.srcElement, rect = target.getBoundingClientRect(), offsetX = e.clientX - rect.left, offsetY = e.clientY - rect.top;
        rectangle = rect;
        return vec2.fromValues(offsetX, offsetY);
    }
    var mouseStart = undefined; // previous mouse position
    var mouseDelta = undefined; // the amount the mouse has moved
    //var mouseAngles = vec2.create();  // angle offset corresponding to mouse movement
    var mouseClickVector = undefined; //The mouse position converted to world coordinates and put in a vector
    // start things off with a down press
    canvas.onmousedown = function (ev) {
        mouseStart = offset(ev);
        mouseDelta = vec2.create(); // initialize to 0,0
        //vec2.set(mouseAngles, 0, 0);
    };
    // // stop things with a mouse release
    canvas.onmouseup = function (ev) {
        if (mouseStart != undefined) {
            var clickEnd = offset(ev);
            vec2.sub(mouseDelta, clickEnd, mouseStart); // delta = end - start
            //vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);  
            // now toss the two values since the mouse is up
            mouseDelta = undefined;
            mouseStart = undefined;
            //Get the width and height
            var width = rectangle.right - rectangle.left;
            var height = rectangle.bottom - rectangle.top;
            //Save the offset into a temp
            var temp = clickEnd;
            //Modify temp's x and y
            temp[0] = temp[0] - (width / 2);
            temp[1] = 1 - temp[1] + (height / 2);
            //Get new x and y for the mouseClickVector
            var x = (temp[0] / width) * worldWidth;
            var y = (temp[1] / height) * worldHeight;
            //Make a vec4 (x is negated for correcting issues)
            mouseClickVector = vec4.fromValues(-x, y, 0, 1);
        }
    };
    // // if we're moving and the mouse is down        
    // canvas.onmousemove = (ev: MouseEvent) => {
    //     if (mouseStart != undefined) {
    //       const m = offset(ev);
    //       vec2.sub(mouseDelta, m, mouseStart);    // delta = mouse - start 
    //       vec2.copy(mouseStart, m);               // start becomes current position
    //       vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);
    //       // console.log("mousemove mouseAngles: " + mouseAngles[0] + ", " + mouseAngles[1]);
    //       // console.log("mousemove mouseDelta: " + mouseDelta[0] + ", " + mouseDelta[1]);
    //       // console.log("mousemove mouseStart: " + mouseStart[0] + ", " + mouseStart[1]);
    //    }
    // }
    // // stop things if you move out of the window
    // canvas.onmouseout = (ev: MouseEvent) => {
    //     if (mouseStart != undefined) {
    //       vec2.set(mouseAngles, 0, 0);
    //       mouseDelta = undefined;
    //       mouseStart = undefined;
    //     }
    // }
    window.onkeydown = function (ev) {
        var flag = 0; //Flag to see if a valid key has been pressed
        var isShifted = 0; //Check to see if shift is held
        var code; //Storing the proper keycode
        //First check if we're under 15 letters
        if (letters.length < 15) {
            //If keycode is in this range, then it's a letter
            if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                //Check for shift
                if (ev.shiftKey) {
                    isShifted = 1;
                }
                //Save
                code = ev.keyCode;
            }
            else if (ev.keyCode == 32) {
                //Saving keycode for space
                code = ev.keyCode;
            }
            else if (ev.keyCode == 49) {
                //This is the exclamation point, so we need to check for shift
                if (ev.shiftKey) {
                    isShifted = 1;
                    code = ev.keyCode;
                }
                else {
                    //Flag for hitting 1
                    flag = 1;
                }
            }
            else {
                //Flag for not hitting a valid key
                flag = 1;
            }
        }
        else {
            //Flag for trying to put more than 15 letters
            flag = 1;
        }
        //Proceed if flag is 0
        if (flag == 0) {
            //Create a new letter
            var letter = new Letter(isShifted, code);
            //Push to the array
            letters.push(letter);
            var i;
            //For every letter, get its x value
            for (i = 0; i < letters.length; i++) {
                setX(i);
            }
            //Play the bell sound
            var goodSound = new Howl({
                urls: ['bell.mp3']
            }).play();
        }
        else {
            //Even if flagged, we could just be holding shift
            //If not, play the buzzer sound
            if (!ev.shiftKey) {
                var badSound = new Howl({
                    urls: ['buzzer.mp3']
                }).play();
            }
        }
    };
    ////////////////////////////////////////////////////////////////////////////////////////////
    // start things off by calling initWebGL
    initWebGL();
    function initWebGL() {
        // get the rendering context for webGL
        var gl = getWebGLContext(canvas);
        if (!gl) {
            return; // no webgl!  Bye bye
        }
        // turn on backface culling and zbuffering
        //gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        // attempt to download and set up our GLSL shaders.  When they download, processed to the next step
        // of our program, the "main" routing
        // 
        // YOU SHOULD MODIFY THIS TO DOWNLOAD ALL YOUR SHADERS and set up all four SHADER PROGRAMS,
        // THEN PASS AN ARRAY OF PROGRAMS TO main().  You'll have to do other things in main to deal
        // with multiple shaders and switch between them
        loader.loadFiles(['shaders/a3-shader.vert', 'shaders/a3-shader.frag'], function (shaderText) {
            var program = createProgramFromSources(gl, shaderText);
            main(gl, program);
        }, function (url) {
            alert('Shader failed to download "' + url + '"');
        });
    }
    // webGL is set up, and our Shader program has been created.  Finish setting up our webGL application       
    function main(gl, program) {
        // use the webgl-utils library to create setters for all the uniforms and attributes in our shaders.
        // It enumerates all of the uniforms and attributes in the program, and creates utility functions to 
        // allow "setUniforms" and "setAttributes" (below) to set the shader variables from a javascript object. 
        // The objects have a key for each uniform or attribute, and a value containing the parameters for the
        // setter function
        var uniformSetters = createUniformSetters(gl, program);
        var attribSetters = createAttributeSetters(gl, program);
        // an indexed quad
        var arrays = {
            position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
            //texcoord: { numComponents: 2, data: [0, 0, 1, 0, 0, 1, 1, 1],                 },
            //texcoord: { numComponents: 2, data: [0, 1, 1, 1, 0, 0, 1, 0],                 },
            texcoord: { numComponents: 2, data: [1, 1, 0, 1, 1, 0, 0, 0], },
            normal: { numComponents: 3, data: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], },
            indices: { numComponents: 3, data: [0, 1, 2, 1, 3, 2], },
        };
        var center = [5, 5, 0];
        var scaleFactor = 2;
        var bufferInfo = createBufferInfoFromArrays(gl, arrays);
        function degToRad(d) {
            return d * Math.PI / 180;
        }
        var cameraAngleRadians = degToRad(0);
        var fieldOfViewRadians = degToRad(60);
        var cameraHeight = 50;
        var uniformsThatAreTheSameForAllObjects = {
            u_lightWorldPos: [50, 30, -100],
            u_viewInverse: mat4.create(),
            u_lightColor: [1, 1, 1, 1],
            u_ambient: [0.1, 0.1, 0.1, 0.1]
        };
        var uniformsThatAreComputedForEachObject = {
            u_worldViewProjection: mat4.create(),
            u_world: mat4.create(),
            u_worldInverseTranspose: mat4.create(),
        };
        // var texture = .... create a texture of some form
        var baseColor = rand(240);
        var objectState = {
            materialUniforms: {
                u_colorMult: chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
                //u_colorMult:             [0, 1, 0, 1],
                //u_diffuse:               null,//texture,
                u_specular: [1, 1, 1, 1],
                u_shininess: 450,
                u_specularFactor: 0.75,
                u_image: undefined,
            }
        };
        // some variables we'll reuse below
        var projectionMatrix = mat4.create();
        var viewMatrix = mat4.create();
        var rotationMatrix = mat4.create();
        var matrix = mat4.create(); // a scratch matrix
        var invMatrix = mat4.create();
        var axisVector = vec3.create();
        var i;
        for (i = 0; i < 54; i++) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
            textures[i] = texture;
        }
        //The following image construction and render function are taken from WebGLFundamentals,
        //as seen here: http://webglfundamentals.org/webgl/lessons/webgl-image-processing.html
        //There are 54 images: 26 uppercase letters, 26 lowercase, a space, and an exclamation point
        //Every single one is hard-coded and put in the textures array
        var lowercaseA = new Image();
        lowercaseA.src = "fixedImages/LowercaseA.png";
        lowercaseA.onload = function () {
            render(lowercaseA, 0);
        };
        var lowercaseB = new Image();
        lowercaseB.src = "fixedImages/LowercaseB.png";
        lowercaseB.onload = function () {
            render(lowercaseB, 1);
        };
        var lowercaseC = new Image();
        lowercaseC.src = "fixedImages/LowercaseC.png";
        lowercaseC.onload = function () {
            render(lowercaseC, 2);
        };
        var lowercaseD = new Image();
        lowercaseD.src = "fixedImages/LowercaseD.png";
        lowercaseD.onload = function () {
            render(lowercaseD, 3);
        };
        var lowercaseE = new Image();
        lowercaseE.src = "fixedImages/LowercaseE.png";
        lowercaseE.onload = function () {
            render(lowercaseE, 4);
        };
        var lowercaseF = new Image();
        lowercaseF.src = "fixedImages/LowercaseF.png";
        lowercaseF.onload = function () {
            render(lowercaseF, 5);
        };
        var lowercaseG = new Image();
        lowercaseG.src = "fixedImages/LowercaseG.png";
        lowercaseG.onload = function () {
            render(lowercaseG, 6);
        };
        var lowercaseH = new Image();
        lowercaseH.src = "fixedImages/LowercaseH.png";
        lowercaseH.onload = function () {
            render(lowercaseH, 7);
        };
        var lowercaseI = new Image();
        lowercaseI.src = "fixedImages/LowercaseI.png";
        lowercaseI.onload = function () {
            render(lowercaseI, 8);
        };
        var lowercaseJ = new Image();
        lowercaseJ.src = "fixedImages/LowercaseJ.png";
        lowercaseJ.onload = function () {
            render(lowercaseJ, 9);
        };
        var lowercaseK = new Image();
        lowercaseK.src = "fixedImages/LowercaseK.png";
        lowercaseK.onload = function () {
            render(lowercaseK, 10);
        };
        var lowercaseL = new Image();
        lowercaseL.src = "fixedImages/LowercaseL.png";
        lowercaseL.onload = function () {
            render(lowercaseL, 11);
        };
        var lowercaseM = new Image();
        lowercaseM.src = "fixedImages/LowercaseM.png";
        lowercaseM.onload = function () {
            render(lowercaseM, 12);
        };
        var lowercaseN = new Image();
        lowercaseN.src = "fixedImages/LowercaseN.png";
        lowercaseN.onload = function () {
            render(lowercaseN, 13);
        };
        var lowercaseO = new Image();
        lowercaseO.src = "fixedImages/LowercaseO.png";
        lowercaseO.onload = function () {
            render(lowercaseO, 14);
        };
        var lowercaseP = new Image();
        lowercaseP.src = "fixedImages/LowercaseP.png";
        lowercaseP.onload = function () {
            render(lowercaseP, 15);
        };
        var lowercaseQ = new Image();
        lowercaseQ.src = "fixedImages/LowercaseQ.png";
        lowercaseQ.onload = function () {
            render(lowercaseQ, 16);
        };
        var lowercaseR = new Image();
        lowercaseR.src = "fixedImages/LowercaseR.png";
        lowercaseR.onload = function () {
            render(lowercaseR, 17);
        };
        var lowercaseS = new Image();
        lowercaseS.src = "fixedImages/LowercaseS.png";
        lowercaseS.onload = function () {
            render(lowercaseS, 18);
        };
        var lowercaseT = new Image();
        lowercaseT.src = "fixedImages/LowercaseT.png";
        lowercaseT.onload = function () {
            render(lowercaseT, 19);
        };
        var lowercaseU = new Image();
        lowercaseU.src = "fixedImages/LowercaseU.png";
        lowercaseU.onload = function () {
            render(lowercaseU, 20);
        };
        var lowercaseV = new Image();
        lowercaseV.src = "fixedImages/LowercaseV.png";
        lowercaseV.onload = function () {
            render(lowercaseV, 21);
        };
        var lowercaseW = new Image();
        lowercaseW.src = "fixedImages/LowercaseW.png";
        lowercaseW.onload = function () {
            render(lowercaseW, 22);
        };
        var lowercaseX = new Image();
        lowercaseX.src = "fixedImages/LowercaseX.png";
        lowercaseX.onload = function () {
            render(lowercaseX, 23);
        };
        var lowercaseY = new Image();
        lowercaseY.src = "fixedImages/LowercaseY.png";
        lowercaseY.onload = function () {
            render(lowercaseY, 24);
        };
        var lowercaseZ = new Image();
        lowercaseZ.src = "fixedImages/LowercaseZ.png";
        lowercaseZ.onload = function () {
            render(lowercaseZ, 25);
        };
        var uppercaseA = new Image();
        uppercaseA.src = "fixedImages/UppercaseA.png";
        uppercaseA.onload = function () {
            render(uppercaseA, 26);
        };
        var uppercaseB = new Image();
        uppercaseB.src = "fixedImages/UppercaseB.png";
        uppercaseB.onload = function () {
            render(uppercaseB, 27);
        };
        var uppercaseC = new Image();
        uppercaseC.src = "fixedImages/UppercaseC.png";
        uppercaseC.onload = function () {
            render(uppercaseC, 28);
        };
        var uppercaseD = new Image();
        uppercaseD.src = "fixedImages/UppercaseD.png";
        uppercaseD.onload = function () {
            render(uppercaseD, 29);
        };
        var uppercaseE = new Image();
        uppercaseE.src = "fixedImages/UppercaseE.png";
        uppercaseE.onload = function () {
            render(uppercaseE, 30);
        };
        var uppercaseF = new Image();
        uppercaseF.src = "fixedImages/UppercaseF.png";
        uppercaseF.onload = function () {
            render(uppercaseF, 31);
        };
        var uppercaseG = new Image();
        uppercaseG.src = "fixedImages/UppercaseG.png";
        uppercaseG.onload = function () {
            render(uppercaseG, 32);
        };
        var uppercaseH = new Image();
        uppercaseH.src = "fixedImages/UppercaseH.png";
        uppercaseH.onload = function () {
            render(uppercaseH, 33);
        };
        var uppercaseI = new Image();
        uppercaseI.src = "fixedImages/UppercaseI.png";
        uppercaseI.onload = function () {
            render(uppercaseI, 34);
        };
        var uppercaseJ = new Image();
        uppercaseJ.src = "fixedImages/UppercaseJ.png";
        uppercaseJ.onload = function () {
            render(uppercaseJ, 35);
        };
        var uppercaseK = new Image();
        uppercaseK.src = "fixedImages/UppercaseK.png";
        uppercaseK.onload = function () {
            render(uppercaseK, 36);
        };
        var uppercaseL = new Image();
        uppercaseL.src = "fixedImages/UppercaseL.png";
        uppercaseL.onload = function () {
            render(uppercaseL, 37);
        };
        var uppercaseM = new Image();
        uppercaseM.src = "fixedImages/UppercaseM.png";
        uppercaseM.onload = function () {
            render(uppercaseM, 38);
        };
        var uppercaseN = new Image();
        uppercaseN.src = "fixedImages/UppercaseN.png";
        uppercaseN.onload = function () {
            render(uppercaseA, 39);
        };
        var uppercaseO = new Image();
        uppercaseO.src = "fixedImages/UppercaseO.png";
        uppercaseO.onload = function () {
            render(uppercaseO, 40);
        };
        var uppercaseP = new Image();
        uppercaseP.src = "fixedImages/UppercaseP.png";
        uppercaseP.onload = function () {
            render(uppercaseP, 41);
        };
        var uppercaseQ = new Image();
        uppercaseQ.src = "fixedImages/UppercaseQ.png";
        uppercaseQ.onload = function () {
            render(uppercaseQ, 42);
        };
        var uppercaseR = new Image();
        uppercaseR.src = "fixedImages/UppercaseR.png";
        uppercaseR.onload = function () {
            render(uppercaseR, 43);
        };
        var uppercaseS = new Image();
        uppercaseS.src = "fixedImages/UppercaseS.png";
        uppercaseS.onload = function () {
            render(uppercaseS, 44);
        };
        var uppercaseT = new Image();
        uppercaseT.src = "fixedImages/UppercaseT.png";
        uppercaseT.onload = function () {
            render(uppercaseT, 45);
        };
        var uppercaseU = new Image();
        uppercaseU.src = "fixedImages/UppercaseU.png";
        uppercaseU.onload = function () {
            render(uppercaseU, 46);
        };
        var uppercaseV = new Image();
        uppercaseV.src = "fixedImages/UppercaseV.png";
        uppercaseV.onload = function () {
            render(uppercaseV, 47);
        };
        var uppercaseW = new Image();
        uppercaseW.src = "fixedImages/UppercaseW.png";
        uppercaseW.onload = function () {
            render(uppercaseW, 48);
        };
        var uppercaseX = new Image();
        uppercaseX.src = "fixedImages/UppercaseX.png";
        uppercaseX.onload = function () {
            render(uppercaseX, 49);
        };
        var uppercaseY = new Image();
        uppercaseY.src = "fixedImages/UppercaseY.png";
        uppercaseY.onload = function () {
            render(uppercaseY, 50);
        };
        var uppercaseZ = new Image();
        uppercaseZ.src = "fixedImages/UppercaseZ.png";
        uppercaseZ.onload = function () {
            render(uppercaseZ, 51);
        };
        var exclamation = new Image();
        exclamation.src = "fixedImages/ExclamationPoint.png";
        exclamation.onload = function () {
            render(exclamation, 52);
        };
        var space = new Image();
        space.src = "fixedImages/Space.png";
        space.onload = function () {
            render(space, 53);
        };
        //One of the first major differences is the inclusion of an index parameter,
        //which will bind the texture to the proper location in the array
        //function render(image) {
        function render(image, index) {
            // Create a texture.
            //var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, textures[index]);
            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            //The rest of the render function taken isn't used, since the texture has already been bound
        }
        requestAnimationFrame(drawScene);
        // Draw the scene.
        function drawScene(time) {
            time *= 0.001;
            // measure time taken for the little stats meter
            stats.begin();
            // if the window changed size, reset the WebGL canvas size to match.  The displayed size of the canvas
            // (determined by window size, layout, and your CSS) is separate from the size of the WebGL render buffers, 
            // which you can control by setting canvas.width and canvas.height
            resizeCanvasToDisplaySize(canvas);
            // Set the viewport to match the canvas
            gl.viewport(0, 0, canvas.width, canvas.height);
            // Clear the canvas AND the depth buffer.
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // Compute the projection matrix
            var aspect = canvas.clientWidth / canvas.clientHeight;
            mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, 1, 2000);
            // Compute the camera's matrix using look at.
            var cameraPosition = [0, 0, -200];
            var target = [0, 0, 0];
            var up = [0, 1, 0];
            var cameraMatrix = mat4.lookAt(uniformsThatAreTheSameForAllObjects.u_viewInverse, cameraPosition, target, up);
            //Get the world height and width, using the camera position, the field of view, and the aspect ratio
            worldHeight = Math.abs(cameraPosition[2]) * Math.tan(fieldOfViewRadians / 2) * 2;
            worldWidth = worldHeight * aspect;
            // Make a view matrix from the camera matrix.
            mat4.invert(viewMatrix, cameraMatrix);
            // tell WebGL to use our shader program (will need to change this)
            gl.useProgram(program);
            //Check to see if we have any letters at all
            if (letters.length > 0) {
                var i;
                //Go through all the letters
                for (i = 0; i < letters.length; i++) {
                    // Setup all the needed attributes and buffers.  
                    setBuffersAndAttributes(gl, attribSetters, bufferInfo);
                    // Set the uniforms that are the same for all objects.  Unlike the attributes, each uniform setter
                    // is different, depending on the type of the uniform variable.  Look in webgl-util.js for the
                    // implementation of  setUniforms to see the details for specific types       
                    setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);
                    var img;
                    var n;
                    //Check if the keycode is of one of the letters
                    if (letters[i].keycode >= 65 && letters[i].keycode <= 90) {
                        if (letters[i].shift == 0) {
                            //If not shifted, then simply reduce to get the proper position
                            n = letters[i].keycode - 65;
                        }
                        else {
                            //If shifted, then add 26 to correct
                            n = letters[i].keycode - 65 + 26;
                        }
                    }
                    else if (letters[i].keycode == 49 && letters[i].shift == 1) {
                        //If these conditions are satisifed, then we have an exclamation point
                        //(there shouldn't be a case where one is but the other isn't)
                        n = 52;
                    }
                    else {
                        //Otherwise it's a space (helps with force-set)
                        n = 53;
                    }
                    //Get the right texture 
                    img = textures[n];
                    //Set it to u_image
                    objectState.materialUniforms.u_image = img;
                    //Start with thte identity matrix
                    mat4.identity(matrix);
                    //Start by translating to the proper coordinates
                    mat4.translate(matrix, matrix, [letters[i].x, letters[i].y, 0]);
                    //Rotate along Z for tilting
                    //This if statement lets it alternate back and forth between each direction
                    if (i % 2 == 0) {
                        mat4.rotateZ(matrix, matrix, degToRad(letters[i].tilt));
                    }
                    else {
                        mat4.rotateZ(matrix, matrix, degToRad(-letters[i].tilt));
                    }
                    //If mousClickVector is defined, then there has been a mouse click
                    if (mouseClickVector != undefined) {
                        //Get the letter's x and y
                        var x = letters[i].x;
                        var y = letters[i].y;
                        //Get the mouse x and y
                        var a = mouseClickVector[0];
                        var b = mouseClickVector[1];
                        //Use this for creating different degrees of spin
                        var int = 5 * scaleFactor;
                        //If the mouse is within these limits, then we've successfully clicked on the object
                        if (a >= (x - int) && a <= (x + int) && b >= (y - int) && b <= (y + int)) {
                            //Establish that we're spinning
                            letters[i].isSpinning = 1;
                            //Value to split between center and edge
                            var half = int / 2;
                            //Set degrees
                            if (a >= (x - half) && a <= (x + half)) {
                                letters[i].degree = 2;
                            }
                            else {
                                letters[i].degree = 1;
                            }
                            //Make the mouse vector undefined again, so that the spinning is not hinged on clicking something else
                            mouseClickVector = undefined;
                        }
                    }
                    //Proceed if spinning
                    if (letters[i].isSpinning == 1) {
                        //Get arbitrarily-selected spins
                        var spins;
                        if (letters[i].degree == 2) {
                            spins = 2;
                        }
                        else {
                            spins = 4;
                        }
                        //Janky way of controlling time spun
                        if (letters[i].time < spins) {
                            //Janky way of creating deceleration
                            if (letters[i].time < letters[i].degree) {
                                mat4.rotateY(matrix, matrix, degToRad(360 * (letters[i].time / letters[i].degree)));
                            }
                            else if (letters[i].time < 2 * letters[i].degree) {
                                mat4.rotateY(matrix, matrix, degToRad((360 * (letters[i].time / (letters[i].degree * 2))) + 180));
                            }
                            else {
                                mat4.rotateY(matrix, matrix, degToRad(360 * ((letters[i].time / (letters[i].degree * 4)))));
                            }
                            //Increment time
                            letters[i].time += 0.01;
                        }
                        else {
                            //If we're done spinning, then set all these values back to 0
                            letters[i].time = 0;
                            letters[i].isSpinning = 0;
                            letters[i].degree = 0;
                        }
                    }
                    // add a translate and scale to the object World xform, so we have:  R * T * S
                    mat4.translate(matrix, matrix, [-center[0] * scaleFactor, -center[1] * scaleFactor,
                        -center[2] * scaleFactor]);
                    mat4.scale(matrix, matrix, [scaleFactor, scaleFactor, scaleFactor]);
                    mat4.copy(uniformsThatAreComputedForEachObject.u_world, matrix);
                    // get proj * view * world
                    mat4.multiply(matrix, viewMatrix, uniformsThatAreComputedForEachObject.u_world);
                    mat4.multiply(uniformsThatAreComputedForEachObject.u_worldViewProjection, projectionMatrix, matrix);
                    // get worldInvTranspose.  For an explaination of why we need this, for fixing the normals, see
                    // http://www.unknownroad.com/rtfm/graphics/rt_normals.html
                    mat4.transpose(uniformsThatAreComputedForEachObject.u_worldInverseTranspose, mat4.invert(matrix, uniformsThatAreComputedForEachObject.u_world));
                    // Set the uniforms we just computed
                    setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);
                    // Set the uniforms that are specific to the this object.
                    setUniforms(uniformSetters, objectState.materialUniforms);
                    // Draw the geometry.   Everything is keyed to the ""
                    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
                    //This array doesn't necessarily need to be enabled, but it's good just in case
                    gl.enableVertexAttribArray(gl.getAttribLocation(program, "a_position"));
                    //This code for drawing lines is taken from here:
                    //http://www.codeproject.com/Articles/594222/LineplusinplusWebGLplusandpluswhyplusyouplusgonnap
                    //5.0 seems to be the magic number, both for keeping the line centered and
                    //for having the least noticeable effect during y-rotation
                    var vtx = new Float32Array([5.0, 0.0, 0.0,
                        5.0, worldHeight, 0.0]);
                    var idx = new Uint16Array([0, 1]);
                    initBuffers(vtx, idx);
                    gl.lineWidth(1.0);
                    //gl.uniform4f(gl.getUniformLocation(program, "u_lineColor"), 0, 0, 0, 1);
                    gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 0);
                    //The array MUST be disabled so that the other buffers can be used for other squares
                    gl.disableVertexAttribArray(gl.getAttribLocation(program, "a_position"));
                    function initBuffer(glELEMENT_ARRAY_BUFFER, data) {
                        var buf = gl.createBuffer();
                        gl.bindBuffer(glELEMENT_ARRAY_BUFFER, buf);
                        gl.bufferData(glELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
                        return buf;
                    }
                    function initBuffers(vtx, idx) {
                        var vbuf = initBuffer(gl.ARRAY_BUFFER, vtx);
                        var ibuf = initBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
                        gl.vertexAttribPointer(gl.getAttribLocation(program, "a_position"), 3, gl.FLOAT, false, 0, 0);
                    }
                }
            }
            // stats meter
            stats.end();
            requestAnimationFrame(drawScene);
        }
    }
    //The class for each letter
    var Letter = (function () {
        function Letter(shift, keycode) {
            //Set shift and keycode based on the parameters
            this.shift = shift;
            this.keycode = keycode;
            //Set the following to 0
            this.isSpinning = 0;
            this.degree = 0;
            this.time = 0;
            //Tilt is a randome value from nothing to 5 degrees
            //Such a small range helps make possible funny business from rotation less noticeable
            this.tilt = rand(0, 5);
            //Start off with x as 0
            this.x = 0;
            //Set y to a random variable within the center part of the world
            this.y = rand(-(worldHeight * 0.25), worldHeight * 0.25);
        }
        return Letter;
    }());
    //This helper function sets up the x coordinate for each letter
    //This is called every time a new letter is added, since the x values need to be updated
    //to create the desired positioning
    var setX = function (i) {
        letters[i].x = -(((worldWidth / (letters.length + 1)) * (i + 1)) - (worldWidth / 2));
    };
});

//# sourceMappingURL=data:application/json;base64,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UztRQUV6QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV4RixDQUFDLENBQUEiLCJmaWxlIjoiYTUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy88cmVmZXJlbmNlIHBhdGg9Jy4vdHlwaW5ncy90c2QuZC50cycvPlxyXG4vLy88cmVmZXJlbmNlIHBhdGg9XCIuL2xvY2FsVHlwaW5ncy93ZWJnbHV0aWxzLmQudHNcIi8+XHJcblxyXG5pbXBvcnQgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHN0YXRzIG1vZHVsZSBieSBtcmRvb2IgKGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2Ivc3RhdHMuanMpIHRvIHNob3cgdGhlIHBlcmZvcm1hbmNlIFxyXG4vLyBvZiB5b3VyIGdyYXBoaWNzXHJcbnZhciBzdGF0cyA9IG5ldyBTdGF0cygpO1xyXG5zdGF0cy5zZXRNb2RlKCAxICk7IC8vIDA6IGZwcywgMTogbXMsIDI6IG1iXHJcblxyXG5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5yaWdodCA9ICcwcHgnO1xyXG5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICcwcHgnO1xyXG5cclxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggc3RhdHMuZG9tRWxlbWVudCApO1xyXG5cclxuLy8gZ2V0IHNvbWUgb2Ygb3VyIGNhbnZhcyBlbGVtZW50cyB0aGF0IHdlIG5lZWRcclxudmFyIGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndlYmdsXCIpO1xyXG5cclxuLy8gdXRpbGl0aWVzXHJcbnZhciByYW5kID0gZnVuY3Rpb24obWluOiBudW1iZXIsIG1heD86IG51bWJlcikge1xyXG4gIGlmIChtYXggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbWF4ID0gbWluO1xyXG4gICAgbWluID0gMDtcclxuICB9XHJcbiAgcmV0dXJuIG1pbiArIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKTtcclxufTtcclxuXHJcbnZhciByYW5kSW50ID0gZnVuY3Rpb24ocmFuZ2UpIHtcclxuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcmFuZ2UpO1xyXG59O1xyXG5cclxuLy9MZXR0ZXJzIGlzIGFuIGFycmF5IHRoYXQgd2lsbCBzdG9yZSB1cCB0byAxNSBsZXR0ZXJzXHJcbi8vVGV4dHVyZXMgaXMgYW4gYXJyYXkgdGhhdCB3aWxsIHN0b3JlIGFsbCB0aGUgdGV4dHVyZXNcclxuXHJcbnZhciBsZXR0ZXJzID0gW107XHJcbnZhciB0ZXh0dXJlcyA9IFtdO1xyXG5cclxuLy9UaGUgd29ybGQgd2lkdGggYW5kIGhlaWdodCBhcmUgc2F2ZWQgZ2xvYmFsbHlcclxuXHJcbnZhciB3b3JsZEhlaWdodDtcclxudmFyIHdvcmxkV2lkdGg7XHJcblxyXG53aW5kb3dbXCJyZXNldFwiXSA9ICgpID0+IHtcclxuICBcclxuICAvL1doZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLCBqdXN0IGNyZWF0ZSBhIG5ldyBhcnJheVxyXG4gIFxyXG4gIGxldHRlcnMgPSBbXTtcclxuICBcclxufVxyXG5cclxuLy9SZWN0YW5nbGUgaXMgdGhlIHJlY3QgZm91bmQgaW4gb2Zmc2V0IHNhdmVkIGdsb2JhbGx5XHJcblxyXG52YXIgcmVjdGFuZ2xlID0gdW5kZWZpbmVkO1xyXG5cclxuLy8gc29tZSBzaW1wbGUgaW50ZXJhY3Rpb24gdXNpbmcgdGhlIG1vdXNlLlxyXG4vLyB3ZSBhcmUgZ29pbmcgdG8gZ2V0IHNtYWxsIG1vdGlvbiBvZmZzZXRzIG9mIHRoZSBtb3VzZSwgYW5kIHVzZSB0aGVzZSB0byByb3RhdGUgdGhlIG9iamVjdFxyXG4vL1xyXG4vLyBvdXIgb2Zmc2V0KCkgZnVuY3Rpb24gZnJvbSBhc3NpZ25tZW50IDAsIHRvIGdpdmUgdXMgYSBnb29kIG1vdXNlIHBvc2l0aW9uIGluIHRoZSBjYW52YXMgXHJcbmZ1bmN0aW9uIG9mZnNldChlOiBNb3VzZUV2ZW50KTogR0xNLklBcnJheSB7XHJcbiAgICBlID0gZSB8fCA8TW91c2VFdmVudD4gd2luZG93LmV2ZW50O1xyXG5cclxuICAgIHZhciB0YXJnZXQgPSA8RWxlbWVudD4gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50LFxyXG4gICAgICAgIHJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICAgICAgb2Zmc2V0WCA9IGUuY2xpZW50WCAtIHJlY3QubGVmdCxcclxuICAgICAgICBvZmZzZXRZID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XHJcbiAgICAgICAgXHJcbiAgICByZWN0YW5nbGUgPSByZWN0O1xyXG5cclxuICAgIHJldHVybiB2ZWMyLmZyb21WYWx1ZXMob2Zmc2V0WCwgb2Zmc2V0WSk7XHJcbn1cclxuXHJcbnZhciBtb3VzZVN0YXJ0ID0gdW5kZWZpbmVkOyAgLy8gcHJldmlvdXMgbW91c2UgcG9zaXRpb25cclxudmFyIG1vdXNlRGVsdGEgPSB1bmRlZmluZWQ7ICAvLyB0aGUgYW1vdW50IHRoZSBtb3VzZSBoYXMgbW92ZWRcclxuLy92YXIgbW91c2VBbmdsZXMgPSB2ZWMyLmNyZWF0ZSgpOyAgLy8gYW5nbGUgb2Zmc2V0IGNvcnJlc3BvbmRpbmcgdG8gbW91c2UgbW92ZW1lbnRcclxuXHJcbnZhciBtb3VzZUNsaWNrVmVjdG9yID0gdW5kZWZpbmVkOyAvL1RoZSBtb3VzZSBwb3NpdGlvbiBjb252ZXJ0ZWQgdG8gd29ybGQgY29vcmRpbmF0ZXMgYW5kIHB1dCBpbiBhIHZlY3RvclxyXG5cclxuLy8gc3RhcnQgdGhpbmdzIG9mZiB3aXRoIGEgZG93biBwcmVzc1xyXG5jYW52YXMub25tb3VzZWRvd24gPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIG1vdXNlU3RhcnQgPSBvZmZzZXQoZXYpOyAgICAgICAgXHJcbiAgICBtb3VzZURlbHRhID0gdmVjMi5jcmVhdGUoKTsgIC8vIGluaXRpYWxpemUgdG8gMCwwXHJcbiAgIC8vdmVjMi5zZXQobW91c2VBbmdsZXMsIDAsIDApO1xyXG4gICAgXHJcbn1cclxuXHJcbi8vIC8vIHN0b3AgdGhpbmdzIHdpdGggYSBtb3VzZSByZWxlYXNlXHJcbmNhbnZhcy5vbm1vdXNldXAgPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIGlmIChtb3VzZVN0YXJ0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICBcclxuICAgICAgICBjb25zdCBjbGlja0VuZCA9IG9mZnNldChldik7XHJcbiAgICAgICAgdmVjMi5zdWIobW91c2VEZWx0YSwgY2xpY2tFbmQsIG1vdXNlU3RhcnQpOyAgICAgICAgLy8gZGVsdGEgPSBlbmQgLSBzdGFydFxyXG4gICAgICAgIC8vdmVjMi5zY2FsZShtb3VzZUFuZ2xlcywgbW91c2VEZWx0YSwgMTAvY2FudmFzLmhlaWdodCk7ICBcclxuXHJcbiAgICAgICAgLy8gbm93IHRvc3MgdGhlIHR3byB2YWx1ZXMgc2luY2UgdGhlIG1vdXNlIGlzIHVwXHJcbiAgICAgICAgbW91c2VEZWx0YSA9IHVuZGVmaW5lZDtcclxuICAgICAgICBtb3VzZVN0YXJ0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vR2V0IHRoZSB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICAgICAgdmFyIHdpZHRoID0gcmVjdGFuZ2xlLnJpZ2h0IC0gcmVjdGFuZ2xlLmxlZnQ7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IHJlY3RhbmdsZS5ib3R0b20gLSByZWN0YW5nbGUudG9wO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vU2F2ZSB0aGUgb2Zmc2V0IGludG8gYSB0ZW1wXHJcbiAgICAgICAgdmFyIHRlbXAgPSBjbGlja0VuZDtcclxuICAgICAgICBcclxuICAgICAgICAvL01vZGlmeSB0ZW1wJ3MgeCBhbmQgeVxyXG4gICAgICAgIHRlbXBbMF0gPSB0ZW1wWzBdIC0gKHdpZHRoLzIpO1xyXG4gICAgICAgIHRlbXBbMV0gPSAxIC0gdGVtcFsxXSArIChoZWlnaHQvMik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9HZXQgbmV3IHggYW5kIHkgZm9yIHRoZSBtb3VzZUNsaWNrVmVjdG9yXHJcbiAgICAgICAgdmFyIHggPSAodGVtcFswXSAvIHdpZHRoKSAqIHdvcmxkV2lkdGg7XHJcbiAgICAgICAgdmFyIHkgPSAodGVtcFsxXSAvIGhlaWdodCkgKiB3b3JsZEhlaWdodDtcclxuICAgICAgICBcclxuICAgICAgICAvL01ha2UgYSB2ZWM0ICh4IGlzIG5lZ2F0ZWQgZm9yIGNvcnJlY3RpbmcgaXNzdWVzKVxyXG4gICAgICAgIG1vdXNlQ2xpY2tWZWN0b3IgPSB2ZWM0LmZyb21WYWx1ZXMoLXgsIHksIDAsIDEpO1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG4vLyAvLyBpZiB3ZSdyZSBtb3ZpbmcgYW5kIHRoZSBtb3VzZSBpcyBkb3duICAgICAgICBcclxuLy8gY2FudmFzLm9ubW91c2Vtb3ZlID0gKGV2OiBNb3VzZUV2ZW50KSA9PiB7XHJcbi8vICAgICBpZiAobW91c2VTdGFydCAhPSB1bmRlZmluZWQpIHtcclxuLy8gICAgICAgY29uc3QgbSA9IG9mZnNldChldik7XHJcbi8vICAgICAgIHZlYzIuc3ViKG1vdXNlRGVsdGEsIG0sIG1vdXNlU3RhcnQpOyAgICAvLyBkZWx0YSA9IG1vdXNlIC0gc3RhcnQgXHJcbi8vICAgICAgIHZlYzIuY29weShtb3VzZVN0YXJ0LCBtKTsgICAgICAgICAgICAgICAvLyBzdGFydCBiZWNvbWVzIGN1cnJlbnQgcG9zaXRpb25cclxuLy8gICAgICAgdmVjMi5zY2FsZShtb3VzZUFuZ2xlcywgbW91c2VEZWx0YSwgMTAvY2FudmFzLmhlaWdodCk7XHJcblxyXG4vLyAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1vdXNlbW92ZSBtb3VzZUFuZ2xlczogXCIgKyBtb3VzZUFuZ2xlc1swXSArIFwiLCBcIiArIG1vdXNlQW5nbGVzWzFdKTtcclxuLy8gICAgICAgLy8gY29uc29sZS5sb2coXCJtb3VzZW1vdmUgbW91c2VEZWx0YTogXCIgKyBtb3VzZURlbHRhWzBdICsgXCIsIFwiICsgbW91c2VEZWx0YVsxXSk7XHJcbi8vICAgICAgIC8vIGNvbnNvbGUubG9nKFwibW91c2Vtb3ZlIG1vdXNlU3RhcnQ6IFwiICsgbW91c2VTdGFydFswXSArIFwiLCBcIiArIG1vdXNlU3RhcnRbMV0pO1xyXG4vLyAgICB9XHJcbi8vIH1cclxuXHJcbi8vIC8vIHN0b3AgdGhpbmdzIGlmIHlvdSBtb3ZlIG91dCBvZiB0aGUgd2luZG93XHJcbi8vIGNhbnZhcy5vbm1vdXNlb3V0ID0gKGV2OiBNb3VzZUV2ZW50KSA9PiB7XHJcbi8vICAgICBpZiAobW91c2VTdGFydCAhPSB1bmRlZmluZWQpIHtcclxuLy8gICAgICAgdmVjMi5zZXQobW91c2VBbmdsZXMsIDAsIDApO1xyXG4vLyAgICAgICBtb3VzZURlbHRhID0gdW5kZWZpbmVkO1xyXG4vLyAgICAgICBtb3VzZVN0YXJ0ID0gdW5kZWZpbmVkO1xyXG4vLyAgICAgfVxyXG4vLyB9XHJcblxyXG53aW5kb3cub25rZXlkb3duID0gKGV2OiBLZXlib2FyZEV2ZW50KSA9PiB7XHJcbiAgXHJcbiAgdmFyIGZsYWcgPSAwOyAgICAgICAgICAgLy9GbGFnIHRvIHNlZSBpZiBhIHZhbGlkIGtleSBoYXMgYmVlbiBwcmVzc2VkXHJcbiAgdmFyIGlzU2hpZnRlZCA9IDA7ICAgICAgLy9DaGVjayB0byBzZWUgaWYgc2hpZnQgaXMgaGVsZFxyXG4gIHZhciBjb2RlOyAgICAgICAgICAgICAgIC8vU3RvcmluZyB0aGUgcHJvcGVyIGtleWNvZGVcclxuICBcclxuICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3JlIHVuZGVyIDE1IGxldHRlcnNcclxuICBpZiAobGV0dGVycy5sZW5ndGggPCAxNSkge1xyXG4gICAgXHJcbiAgICAvL0lmIGtleWNvZGUgaXMgaW4gdGhpcyByYW5nZSwgdGhlbiBpdCdzIGEgbGV0dGVyXHJcbiAgICBpZiAoZXYua2V5Q29kZSA+PSA2NSAmJiBldi5rZXlDb2RlIDw9IDkwKSB7XHJcbiAgICAgIFxyXG4gICAgICAvL0NoZWNrIGZvciBzaGlmdFxyXG4gICAgICBpZiAoZXYuc2hpZnRLZXkpIHtcclxuICAgICAgXHJcbiAgICAgICAgaXNTaGlmdGVkID0gMTtcclxuICAgICAgXHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vU2F2ZVxyXG4gICAgICBjb2RlID0gZXYua2V5Q29kZTtcclxuICAgIFxyXG4gICAgfSBlbHNlIGlmIChldi5rZXlDb2RlID09IDMyKSB7XHJcbiAgICAgIFxyXG4gICAgICAvL1NhdmluZyBrZXljb2RlIGZvciBzcGFjZVxyXG4gICAgICBjb2RlID0gZXYua2V5Q29kZTtcclxuICAgIFxyXG4gICAgfSBlbHNlIGlmIChldi5rZXlDb2RlID09IDQ5KSB7XHJcbiAgICAgIFxyXG4gICAgICAvL1RoaXMgaXMgdGhlIGV4Y2xhbWF0aW9uIHBvaW50LCBzbyB3ZSBuZWVkIHRvIGNoZWNrIGZvciBzaGlmdFxyXG4gICAgICBpZiAoZXYuc2hpZnRLZXkpIHtcclxuICAgIFxyXG4gICAgICAgIGlzU2hpZnRlZCA9IDE7XHJcbiAgICBcclxuICAgICAgICBjb2RlID0gZXYua2V5Q29kZTtcclxuICAgICAgICBcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBcclxuICAgICAgICAvL0ZsYWcgZm9yIGhpdHRpbmcgMVxyXG4gICAgICAgIGZsYWcgPSAxO1xyXG4gICAgICAgIFxyXG4gICAgICB9XHJcbiAgICBcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIFxyXG4gICAgICAvL0ZsYWcgZm9yIG5vdCBoaXR0aW5nIGEgdmFsaWQga2V5XHJcbiAgICAgIGZsYWcgPSAxO1xyXG4gICAgXHJcbiAgICB9XHJcbiAgICBcclxuICB9IGVsc2Uge1xyXG4gICAgXHJcbiAgICAvL0ZsYWcgZm9yIHRyeWluZyB0byBwdXQgbW9yZSB0aGFuIDE1IGxldHRlcnNcclxuICAgIGZsYWcgPSAxO1xyXG4gICAgXHJcbiAgfVxyXG4gIFxyXG4gIC8vUHJvY2VlZCBpZiBmbGFnIGlzIDBcclxuICBpZiAoZmxhZyA9PSAwKSB7XHJcbiAgICBcclxuICAgIC8vQ3JlYXRlIGEgbmV3IGxldHRlclxyXG4gICAgdmFyIGxldHRlciA9IG5ldyBMZXR0ZXIoaXNTaGlmdGVkLCBjb2RlKTtcclxuICAgIFxyXG4gICAgLy9QdXNoIHRvIHRoZSBhcnJheVxyXG4gICAgbGV0dGVycy5wdXNoKGxldHRlcik7XHJcbiAgICBcclxuICAgIHZhciBpO1xyXG4gICAgXHJcbiAgICAvL0ZvciBldmVyeSBsZXR0ZXIsIGdldCBpdHMgeCB2YWx1ZVxyXG4gICAgZm9yIChpID0gMDsgaSA8IGxldHRlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgXHJcbiAgICAgIHNldFgoaSk7XHJcbiAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvL1BsYXkgdGhlIGJlbGwgc291bmRcclxuICAgIHZhciBnb29kU291bmQgPSBuZXcgSG93bCh7XHJcbiAgICAgIHVybHM6IFsnYmVsbC5tcDMnXVxyXG4gICAgfSkucGxheSgpO1xyXG4gICAgXHJcbiAgfSBlbHNlIHtcclxuICAgIFxyXG4gICAgLy9FdmVuIGlmIGZsYWdnZWQsIHdlIGNvdWxkIGp1c3QgYmUgaG9sZGluZyBzaGlmdFxyXG4gICAgLy9JZiBub3QsIHBsYXkgdGhlIGJ1enplciBzb3VuZFxyXG4gICAgaWYgKCFldi5zaGlmdEtleSkge1xyXG4gICAgICBcclxuICAgICAgdmFyIGJhZFNvdW5kID0gbmV3IEhvd2woe1xyXG4gICAgICAgIHVybHM6IFsnYnV6emVyLm1wMyddXHJcbiAgICAgIH0pLnBsYXkoKTtcclxuICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbn1cclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHN0YXJ0IHRoaW5ncyBvZmYgYnkgY2FsbGluZyBpbml0V2ViR0xcclxuaW5pdFdlYkdMKCk7XHJcblxyXG5mdW5jdGlvbiBpbml0V2ViR0woKSB7XHJcbiAgLy8gZ2V0IHRoZSByZW5kZXJpbmcgY29udGV4dCBmb3Igd2ViR0xcclxuICB2YXIgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCA9IGdldFdlYkdMQ29udGV4dChjYW52YXMpO1xyXG4gIGlmICghZ2wpIHtcclxuICAgIHJldHVybjsgIC8vIG5vIHdlYmdsISAgQnllIGJ5ZVxyXG4gIH1cclxuXHJcbiAgLy8gdHVybiBvbiBiYWNrZmFjZSBjdWxsaW5nIGFuZCB6YnVmZmVyaW5nXHJcbiAgLy9nbC5lbmFibGUoZ2wuQ1VMTF9GQUNFKTtcclxuICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XHJcblxyXG4gIC8vIGF0dGVtcHQgdG8gZG93bmxvYWQgYW5kIHNldCB1cCBvdXIgR0xTTCBzaGFkZXJzLiAgV2hlbiB0aGV5IGRvd25sb2FkLCBwcm9jZXNzZWQgdG8gdGhlIG5leHQgc3RlcFxyXG4gIC8vIG9mIG91ciBwcm9ncmFtLCB0aGUgXCJtYWluXCIgcm91dGluZ1xyXG4gIC8vIFxyXG4gIC8vIFlPVSBTSE9VTEQgTU9ESUZZIFRISVMgVE8gRE9XTkxPQUQgQUxMIFlPVVIgU0hBREVSUyBhbmQgc2V0IHVwIGFsbCBmb3VyIFNIQURFUiBQUk9HUkFNUyxcclxuICAvLyBUSEVOIFBBU1MgQU4gQVJSQVkgT0YgUFJPR1JBTVMgVE8gbWFpbigpLiAgWW91J2xsIGhhdmUgdG8gZG8gb3RoZXIgdGhpbmdzIGluIG1haW4gdG8gZGVhbFxyXG4gIC8vIHdpdGggbXVsdGlwbGUgc2hhZGVycyBhbmQgc3dpdGNoIGJldHdlZW4gdGhlbVxyXG4gIGxvYWRlci5sb2FkRmlsZXMoWydzaGFkZXJzL2EzLXNoYWRlci52ZXJ0JywgJ3NoYWRlcnMvYTMtc2hhZGVyLmZyYWcnXSwgZnVuY3Rpb24gKHNoYWRlclRleHQpIHtcclxuICAgIHZhciBwcm9ncmFtID0gY3JlYXRlUHJvZ3JhbUZyb21Tb3VyY2VzKGdsLCBzaGFkZXJUZXh0KTtcclxuICAgIG1haW4oZ2wsIHByb2dyYW0pO1xyXG4gIH0sIGZ1bmN0aW9uICh1cmwpIHtcclxuICAgICAgYWxlcnQoJ1NoYWRlciBmYWlsZWQgdG8gZG93bmxvYWQgXCInICsgdXJsICsgJ1wiJyk7XHJcbiAgfSk7IFxyXG59XHJcblxyXG4vLyB3ZWJHTCBpcyBzZXQgdXAsIGFuZCBvdXIgU2hhZGVyIHByb2dyYW0gaGFzIGJlZW4gY3JlYXRlZC4gIEZpbmlzaCBzZXR0aW5nIHVwIG91ciB3ZWJHTCBhcHBsaWNhdGlvbiAgICAgICBcclxuZnVuY3Rpb24gbWFpbihnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBwcm9ncmFtOiBXZWJHTFByb2dyYW0pIHtcclxuICBcclxuICAvLyB1c2UgdGhlIHdlYmdsLXV0aWxzIGxpYnJhcnkgdG8gY3JlYXRlIHNldHRlcnMgZm9yIGFsbCB0aGUgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgaW4gb3VyIHNoYWRlcnMuXHJcbiAgLy8gSXQgZW51bWVyYXRlcyBhbGwgb2YgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzIGluIHRoZSBwcm9ncmFtLCBhbmQgY3JlYXRlcyB1dGlsaXR5IGZ1bmN0aW9ucyB0byBcclxuICAvLyBhbGxvdyBcInNldFVuaWZvcm1zXCIgYW5kIFwic2V0QXR0cmlidXRlc1wiIChiZWxvdykgdG8gc2V0IHRoZSBzaGFkZXIgdmFyaWFibGVzIGZyb20gYSBqYXZhc2NyaXB0IG9iamVjdC4gXHJcbiAgLy8gVGhlIG9iamVjdHMgaGF2ZSBhIGtleSBmb3IgZWFjaCB1bmlmb3JtIG9yIGF0dHJpYnV0ZSwgYW5kIGEgdmFsdWUgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBmb3IgdGhlXHJcbiAgLy8gc2V0dGVyIGZ1bmN0aW9uXHJcbiAgdmFyIHVuaWZvcm1TZXR0ZXJzID0gY3JlYXRlVW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xyXG4gIHZhciBhdHRyaWJTZXR0ZXJzICA9IGNyZWF0ZUF0dHJpYnV0ZVNldHRlcnMoZ2wsIHByb2dyYW0pO1xyXG5cclxuICAvLyBhbiBpbmRleGVkIHF1YWRcclxuICB2YXIgYXJyYXlzID0ge1xyXG4gICAgIHBvc2l0aW9uOiB7IG51bUNvbXBvbmVudHM6IDMsIGRhdGE6IFswLCAwLCAwLCAxMCwgMCwgMCwgMCwgMTAsIDAsIDEwLCAxMCwgMF0sIH0sXHJcbiAgICAgLy90ZXhjb29yZDogeyBudW1Db21wb25lbnRzOiAyLCBkYXRhOiBbMCwgMCwgMSwgMCwgMCwgMSwgMSwgMV0sICAgICAgICAgICAgICAgICB9LFxyXG4gICAgIC8vdGV4Y29vcmQ6IHsgbnVtQ29tcG9uZW50czogMiwgZGF0YTogWzAsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCAgICAgICAgICAgICAgICAgfSxcclxuICAgICB0ZXhjb29yZDogeyBudW1Db21wb25lbnRzOiAyLCBkYXRhOiBbMSwgMSwgMCwgMSwgMSwgMCwgMCwgMF0sICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgbm9ybWFsOiAgIHsgbnVtQ29tcG9uZW50czogMywgZGF0YTogWzAsIDAsIC0xLCAwLCAwLCAtMSwgMCwgMCwgLTEsIDAsIDAsIC0xXSwgfSxcclxuICAgICBpbmRpY2VzOiAgeyBudW1Db21wb25lbnRzOiAzLCBkYXRhOiBbMCwgMSwgMiwgMSwgMywgMl0sICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gIH07XHJcbiAgdmFyIGNlbnRlciA9IFs1LDUsMF07XHJcbiAgdmFyIHNjYWxlRmFjdG9yID0gMjtcclxuICBcclxuICB2YXIgYnVmZmVySW5mbyA9IGNyZWF0ZUJ1ZmZlckluZm9Gcm9tQXJyYXlzKGdsLCBhcnJheXMpO1xyXG4gIFxyXG4gIGZ1bmN0aW9uIGRlZ1RvUmFkKGQpIHtcclxuICAgIHJldHVybiBkICogTWF0aC5QSSAvIDE4MDtcclxuICB9XHJcblxyXG4gIHZhciBjYW1lcmFBbmdsZVJhZGlhbnMgPSBkZWdUb1JhZCgwKTtcclxuICB2YXIgZmllbGRPZlZpZXdSYWRpYW5zID0gZGVnVG9SYWQoNjApO1xyXG4gIHZhciBjYW1lcmFIZWlnaHQgPSA1MDtcclxuXHJcbiAgdmFyIHVuaWZvcm1zVGhhdEFyZVRoZVNhbWVGb3JBbGxPYmplY3RzID0ge1xyXG4gICAgdV9saWdodFdvcmxkUG9zOiAgICAgICAgIFs1MCwgMzAsIC0xMDBdLFxyXG4gICAgdV92aWV3SW52ZXJzZTogICAgICAgICAgIG1hdDQuY3JlYXRlKCksXHJcbiAgICB1X2xpZ2h0Q29sb3I6ICAgICAgICAgICAgWzEsIDEsIDEsIDFdLFxyXG4gICAgdV9hbWJpZW50OiAgICAgICAgICAgICAgIFswLjEsIDAuMSwgMC4xLCAwLjFdXHJcbiAgfTtcclxuXHJcbiAgdmFyIHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdCA9IHtcclxuICAgIHVfd29ybGRWaWV3UHJvamVjdGlvbjogICBtYXQ0LmNyZWF0ZSgpLFxyXG4gICAgdV93b3JsZDogICAgICAgICAgICAgICAgIG1hdDQuY3JlYXRlKCksXHJcbiAgICB1X3dvcmxkSW52ZXJzZVRyYW5zcG9zZTogbWF0NC5jcmVhdGUoKSxcclxuICB9O1xyXG5cclxuICAvLyB2YXIgdGV4dHVyZSA9IC4uLi4gY3JlYXRlIGEgdGV4dHVyZSBvZiBzb21lIGZvcm1cclxuXHJcbiAgdmFyIGJhc2VDb2xvciA9IHJhbmQoMjQwKTtcclxuICB2YXIgb2JqZWN0U3RhdGUgPSB7IFxyXG4gICAgICBtYXRlcmlhbFVuaWZvcm1zOiB7XHJcbiAgICAgICAgdV9jb2xvck11bHQ6ICAgICAgICAgICAgIGNocm9tYS5oc3YocmFuZChiYXNlQ29sb3IsIGJhc2VDb2xvciArIDEyMCksIDAuNSwgMSkuZ2woKSxcclxuICAgICAgICAvL3VfY29sb3JNdWx0OiAgICAgICAgICAgICBbMCwgMSwgMCwgMV0sXHJcbiAgICAgICAgLy91X2RpZmZ1c2U6ICAgICAgICAgICAgICAgbnVsbCwvL3RleHR1cmUsXHJcbiAgICAgICAgdV9zcGVjdWxhcjogICAgICAgICAgICAgIFsxLCAxLCAxLCAxXSxcclxuICAgICAgICB1X3NoaW5pbmVzczogICAgICAgICAgICAgNDUwLFxyXG4gICAgICAgIHVfc3BlY3VsYXJGYWN0b3I6ICAgICAgICAwLjc1LFxyXG4gICAgICAgIHVfaW1hZ2U6ICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgLy91X2xpbmVDb2xvcjogICAgICAgICAgICAgWzAsIDAsIDAsIDBdLFxyXG4gICAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gc29tZSB2YXJpYWJsZXMgd2UnbGwgcmV1c2UgYmVsb3dcclxuICB2YXIgcHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIHZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gIHZhciByb3RhdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIG1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7ICAvLyBhIHNjcmF0Y2ggbWF0cml4XHJcbiAgdmFyIGludk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIGF4aXNWZWN0b3IgPSB2ZWMzLmNyZWF0ZSgpO1xyXG4gIFxyXG4gIHZhciBpO1xyXG4gIFxyXG4gIGZvciAoaSA9IDA7IGkgPCA1NDsgaSsrKSB7XHJcbiAgICBcclxuICAgIHZhciB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XHJcbiAgICAvLyBGaWxsIHRoZSB0ZXh0dXJlIHdpdGggYSAxeDEgYmx1ZSBwaXhlbC5cclxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgMSwgMSwgMCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgbmV3IFVpbnQ4QXJyYXkoWzAsIDAsIDI1NSwgMjU1XSkpO1xyXG4gICAgXHJcbiAgICB0ZXh0dXJlc1tpXSA9IHRleHR1cmU7XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgLy9UaGUgZm9sbG93aW5nIGltYWdlIGNvbnN0cnVjdGlvbiBhbmQgcmVuZGVyIGZ1bmN0aW9uIGFyZSB0YWtlbiBmcm9tIFdlYkdMRnVuZGFtZW50YWxzLFxyXG4gIC8vYXMgc2VlbiBoZXJlOiBodHRwOi8vd2ViZ2xmdW5kYW1lbnRhbHMub3JnL3dlYmdsL2xlc3NvbnMvd2ViZ2wtaW1hZ2UtcHJvY2Vzc2luZy5odG1sXHJcbiAgLy9UaGVyZSBhcmUgNTQgaW1hZ2VzOiAyNiB1cHBlcmNhc2UgbGV0dGVycywgMjYgbG93ZXJjYXNlLCBhIHNwYWNlLCBhbmQgYW4gZXhjbGFtYXRpb24gcG9pbnRcclxuICAvL0V2ZXJ5IHNpbmdsZSBvbmUgaXMgaGFyZC1jb2RlZCBhbmQgcHV0IGluIHRoZSB0ZXh0dXJlcyBhcnJheVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VBID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlQS5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUEucG5nXCI7XHJcbiAgbG93ZXJjYXNlQS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VBLCAwKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUIgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VCLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlQi5wbmdcIjtcclxuICBsb3dlcmNhc2VCLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUIsIDEpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlQyA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUMuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VDLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUMub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlQywgMik7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VEID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlRC5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUQucG5nXCI7XHJcbiAgbG93ZXJjYXNlRC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VELCAzKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUUgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VFLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlRS5wbmdcIjtcclxuICBsb3dlcmNhc2VFLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUUsIDQpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlRiA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUYuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VGLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUYub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlRiwgNSk7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VHID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlRy5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUcucG5nXCI7XHJcbiAgbG93ZXJjYXNlRy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VHLCA2KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUggPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VILnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlSC5wbmdcIjtcclxuICBsb3dlcmNhc2VILm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUgsIDcpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlSSA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUkuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VJLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUkub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlSSwgOCk7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VKID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlSi5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUoucG5nXCI7XHJcbiAgbG93ZXJjYXNlSi5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VKLCA5KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUsgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VLLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlSy5wbmdcIjtcclxuICBsb3dlcmNhc2VLLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUssIDEwKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUwgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VMLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlTC5wbmdcIjtcclxuICBsb3dlcmNhc2VMLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUwsIDExKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZU0gPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VNLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlTS5wbmdcIjtcclxuICBsb3dlcmNhc2VNLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZU0sIDEyKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZU4gPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VOLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlTi5wbmdcIjtcclxuICBsb3dlcmNhc2VOLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZU4sIDEzKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZU8gPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VPLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlTy5wbmdcIjtcclxuICBsb3dlcmNhc2VPLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZU8sIDE0KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVAgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VQLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlUC5wbmdcIjtcclxuICBsb3dlcmNhc2VQLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVAsIDE1KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVEgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VRLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlUS5wbmdcIjtcclxuICBsb3dlcmNhc2VRLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVEsIDE2KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVIgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VSLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlUi5wbmdcIjtcclxuICBsb3dlcmNhc2VSLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVIsIDE3KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVMgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VTLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlUy5wbmdcIjtcclxuICBsb3dlcmNhc2VTLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVMsIDE4KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVQgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VULnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlVC5wbmdcIjtcclxuICBsb3dlcmNhc2VULm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVQsIDE5KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVUgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VVLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlVS5wbmdcIjtcclxuICBsb3dlcmNhc2VVLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVUsIDIwKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVYgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VWLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlVi5wbmdcIjtcclxuICBsb3dlcmNhc2VWLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVYsIDIxKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVcgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VXLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlVy5wbmdcIjtcclxuICBsb3dlcmNhc2VXLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVcsIDIyKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVggPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VYLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlWC5wbmdcIjtcclxuICBsb3dlcmNhc2VYLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVgsIDIzKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVkgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VZLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlWS5wbmdcIjtcclxuICBsb3dlcmNhc2VZLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVksIDI0KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZVogPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VaLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlWi5wbmdcIjtcclxuICBsb3dlcmNhc2VaLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZVosIDI1KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUEgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VBLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlQS5wbmdcIjtcclxuICB1cHBlcmNhc2VBLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUEsIDI2KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUIgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VCLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlQi5wbmdcIjtcclxuICB1cHBlcmNhc2VCLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUIsIDI3KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUMgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VDLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlQy5wbmdcIjtcclxuICB1cHBlcmNhc2VDLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUMsIDI4KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUQgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VELnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlRC5wbmdcIjtcclxuICB1cHBlcmNhc2VELm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUQsIDI5KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUUgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VFLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlRS5wbmdcIjtcclxuICB1cHBlcmNhc2VFLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUUsIDMwKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUYgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VGLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlRi5wbmdcIjtcclxuICB1cHBlcmNhc2VGLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUYsIDMxKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUcgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VHLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlRy5wbmdcIjtcclxuICB1cHBlcmNhc2VHLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUcsIDMyKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUggPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VILnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlSC5wbmdcIjtcclxuICB1cHBlcmNhc2VILm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUgsIDMzKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUkgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VJLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlSS5wbmdcIjtcclxuICB1cHBlcmNhc2VJLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUksIDM0KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUogPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VKLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlSi5wbmdcIjtcclxuICB1cHBlcmNhc2VKLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUosIDM1KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUsgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VLLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlSy5wbmdcIjtcclxuICB1cHBlcmNhc2VLLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUssIDM2KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZUwgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VMLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlTC5wbmdcIjtcclxuICB1cHBlcmNhc2VMLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUwsIDM3KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZU0gPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VNLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlTS5wbmdcIjtcclxuICB1cHBlcmNhc2VNLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZU0sIDM4KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZU4gPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VOLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlTi5wbmdcIjtcclxuICB1cHBlcmNhc2VOLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZUEsIDM5KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZU8gPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VPLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlTy5wbmdcIjtcclxuICB1cHBlcmNhc2VPLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZU8sIDQwKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVAgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VQLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlUC5wbmdcIjtcclxuICB1cHBlcmNhc2VQLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVAsIDQxKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVEgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VRLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlUS5wbmdcIjtcclxuICB1cHBlcmNhc2VRLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVEsIDQyKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVIgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VSLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlUi5wbmdcIjtcclxuICB1cHBlcmNhc2VSLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVIsIDQzKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVMgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VTLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlUy5wbmdcIjtcclxuICB1cHBlcmNhc2VTLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVMsIDQ0KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVQgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VULnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlVC5wbmdcIjtcclxuICB1cHBlcmNhc2VULm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVQsIDQ1KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVUgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VVLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlVS5wbmdcIjtcclxuICB1cHBlcmNhc2VVLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVUsIDQ2KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVYgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VWLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlVi5wbmdcIjtcclxuICB1cHBlcmNhc2VWLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVYsIDQ3KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVcgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VXLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlVy5wbmdcIjtcclxuICB1cHBlcmNhc2VXLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVcsIDQ4KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVggPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VYLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlWC5wbmdcIjtcclxuICB1cHBlcmNhc2VYLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVgsIDQ5KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVkgPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VZLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlWS5wbmdcIjtcclxuICB1cHBlcmNhc2VZLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVksIDUwKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHVwcGVyY2FzZVogPSBuZXcgSW1hZ2UoKTtcclxuICB1cHBlcmNhc2VaLnNyYyA9IFwiZml4ZWRJbWFnZXMvVXBwZXJjYXNlWi5wbmdcIjtcclxuICB1cHBlcmNhc2VaLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKHVwcGVyY2FzZVosIDUxKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGV4Y2xhbWF0aW9uID0gbmV3IEltYWdlKCk7XHJcbiAgZXhjbGFtYXRpb24uc3JjID0gXCJmaXhlZEltYWdlcy9FeGNsYW1hdGlvblBvaW50LnBuZ1wiO1xyXG4gIGV4Y2xhbWF0aW9uLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGV4Y2xhbWF0aW9uLCA1Mik7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBzcGFjZSA9IG5ldyBJbWFnZSgpO1xyXG4gIHNwYWNlLnNyYyA9IFwiZml4ZWRJbWFnZXMvU3BhY2UucG5nXCI7XHJcbiAgc3BhY2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIoc3BhY2UsIDUzKTtcclxuICB9XHJcbiAgXHJcbiAgLy9PbmUgb2YgdGhlIGZpcnN0IG1ham9yIGRpZmZlcmVuY2VzIGlzIHRoZSBpbmNsdXNpb24gb2YgYW4gaW5kZXggcGFyYW1ldGVyLFxyXG4gIC8vd2hpY2ggd2lsbCBiaW5kIHRoZSB0ZXh0dXJlIHRvIHRoZSBwcm9wZXIgbG9jYXRpb24gaW4gdGhlIGFycmF5XHJcbiAgICBcclxuICAvL2Z1bmN0aW9uIHJlbmRlcihpbWFnZSkge1xyXG4gIGZ1bmN0aW9uIHJlbmRlcihpbWFnZSwgaW5kZXgpIHtcclxuIFxyXG4gICAgLy8gQ3JlYXRlIGEgdGV4dHVyZS5cclxuICAgIC8vdmFyIHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlc1tpbmRleF0pO1xyXG4gXHJcbiAgICAvLyBTZXQgdGhlIHBhcmFtZXRlcnMgc28gd2UgY2FuIHJlbmRlciBhbnkgc2l6ZSBpbWFnZS5cclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiBcclxuICAgIC8vIFVwbG9hZCB0aGUgaW1hZ2UgaW50byB0aGUgdGV4dHVyZS5cclxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpO1xyXG4gICAgXHJcbiAgICAvL1RoZSByZXN0IG9mIHRoZSByZW5kZXIgZnVuY3Rpb24gdGFrZW4gaXNuJ3QgdXNlZCwgc2luY2UgdGhlIHRleHR1cmUgaGFzIGFscmVhZHkgYmVlbiBib3VuZFxyXG4gICAgXHJcbiAgfVxyXG4gIFxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3U2NlbmUpO1xyXG5cclxuICAvLyBEcmF3IHRoZSBzY2VuZS5cclxuICBmdW5jdGlvbiBkcmF3U2NlbmUodGltZTogbnVtYmVyKSB7XHJcbiAgICB0aW1lICo9IDAuMDAxOyBcclxuICAgXHJcbiAgICAvLyBtZWFzdXJlIHRpbWUgdGFrZW4gZm9yIHRoZSBsaXR0bGUgc3RhdHMgbWV0ZXJcclxuICAgIHN0YXRzLmJlZ2luKCk7XHJcblxyXG4gICAgLy8gaWYgdGhlIHdpbmRvdyBjaGFuZ2VkIHNpemUsIHJlc2V0IHRoZSBXZWJHTCBjYW52YXMgc2l6ZSB0byBtYXRjaC4gIFRoZSBkaXNwbGF5ZWQgc2l6ZSBvZiB0aGUgY2FudmFzXHJcbiAgICAvLyAoZGV0ZXJtaW5lZCBieSB3aW5kb3cgc2l6ZSwgbGF5b3V0LCBhbmQgeW91ciBDU1MpIGlzIHNlcGFyYXRlIGZyb20gdGhlIHNpemUgb2YgdGhlIFdlYkdMIHJlbmRlciBidWZmZXJzLCBcclxuICAgIC8vIHdoaWNoIHlvdSBjYW4gY29udHJvbCBieSBzZXR0aW5nIGNhbnZhcy53aWR0aCBhbmQgY2FudmFzLmhlaWdodFxyXG4gICAgcmVzaXplQ2FudmFzVG9EaXNwbGF5U2l6ZShjYW52YXMpO1xyXG5cclxuICAgIC8vIFNldCB0aGUgdmlld3BvcnQgdG8gbWF0Y2ggdGhlIGNhbnZhc1xyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgIFxyXG4gICAgLy8gQ2xlYXIgdGhlIGNhbnZhcyBBTkQgdGhlIGRlcHRoIGJ1ZmZlci5cclxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAvLyBDb21wdXRlIHRoZSBwcm9qZWN0aW9uIG1hdHJpeFxyXG4gICAgdmFyIGFzcGVjdCA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIGNhbnZhcy5jbGllbnRIZWlnaHQ7XHJcbiAgICBtYXQ0LnBlcnNwZWN0aXZlKHByb2plY3Rpb25NYXRyaXgsZmllbGRPZlZpZXdSYWRpYW5zLCBhc3BlY3QsIDEsIDIwMDApO1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIGNhbWVyYSdzIG1hdHJpeCB1c2luZyBsb29rIGF0LlxyXG4gICAgdmFyIGNhbWVyYVBvc2l0aW9uID0gWzAsIDAsIC0yMDBdO1xyXG4gICAgdmFyIHRhcmdldCA9IFswLCAwLCAwXTtcclxuICAgIHZhciB1cCA9IFswLCAxLCAwXTtcclxuICAgIHZhciBjYW1lcmFNYXRyaXggPSBtYXQ0Lmxvb2tBdCh1bmlmb3Jtc1RoYXRBcmVUaGVTYW1lRm9yQWxsT2JqZWN0cy51X3ZpZXdJbnZlcnNlLCBjYW1lcmFQb3NpdGlvbiwgdGFyZ2V0LCB1cCk7XHJcbiAgICBcclxuICAgIC8vR2V0IHRoZSB3b3JsZCBoZWlnaHQgYW5kIHdpZHRoLCB1c2luZyB0aGUgY2FtZXJhIHBvc2l0aW9uLCB0aGUgZmllbGQgb2YgdmlldywgYW5kIHRoZSBhc3BlY3QgcmF0aW9cclxuICAgIHdvcmxkSGVpZ2h0ID0gTWF0aC5hYnMoY2FtZXJhUG9zaXRpb25bMl0pICogTWF0aC50YW4oZmllbGRPZlZpZXdSYWRpYW5zIC8gMikgKiAyO1xyXG4gICAgd29ybGRXaWR0aCA9IHdvcmxkSGVpZ2h0ICogYXNwZWN0O1xyXG4gICAgXHJcbiAgICAvLyBNYWtlIGEgdmlldyBtYXRyaXggZnJvbSB0aGUgY2FtZXJhIG1hdHJpeC5cclxuICAgIG1hdDQuaW52ZXJ0KHZpZXdNYXRyaXgsIGNhbWVyYU1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIHRlbGwgV2ViR0wgdG8gdXNlIG91ciBzaGFkZXIgcHJvZ3JhbSAod2lsbCBuZWVkIHRvIGNoYW5nZSB0aGlzKVxyXG4gICAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgIFxyXG4gICAgLy9DaGVjayB0byBzZWUgaWYgd2UgaGF2ZSBhbnkgbGV0dGVycyBhdCBhbGxcclxuICAgIGlmIChsZXR0ZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgXHJcbiAgICAgIHZhciBpO1xyXG4gICAgICBcclxuICAgICAgLy9HbyB0aHJvdWdoIGFsbCB0aGUgbGV0dGVyc1xyXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGV0dGVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgXHJcbiAgICAgICAgLy8gU2V0dXAgYWxsIHRoZSBuZWVkZWQgYXR0cmlidXRlcyBhbmQgYnVmZmVycy4gIFxyXG4gICAgICAgIHNldEJ1ZmZlcnNBbmRBdHRyaWJ1dGVzKGdsLCBhdHRyaWJTZXR0ZXJzLCBidWZmZXJJbmZvKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB1bmlmb3JtcyB0aGF0IGFyZSB0aGUgc2FtZSBmb3IgYWxsIG9iamVjdHMuICBVbmxpa2UgdGhlIGF0dHJpYnV0ZXMsIGVhY2ggdW5pZm9ybSBzZXR0ZXJcclxuICAgICAgICAvLyBpcyBkaWZmZXJlbnQsIGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiB0aGUgdW5pZm9ybSB2YXJpYWJsZS4gIExvb2sgaW4gd2ViZ2wtdXRpbC5qcyBmb3IgdGhlXHJcbiAgICAgICAgLy8gaW1wbGVtZW50YXRpb24gb2YgIHNldFVuaWZvcm1zIHRvIHNlZSB0aGUgZGV0YWlscyBmb3Igc3BlY2lmaWMgdHlwZXMgICAgICAgXHJcbiAgICAgICAgc2V0VW5pZm9ybXModW5pZm9ybVNldHRlcnMsIHVuaWZvcm1zVGhhdEFyZVRoZVNhbWVGb3JBbGxPYmplY3RzKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW1nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vQ2hlY2sgaWYgdGhlIGtleWNvZGUgaXMgb2Ygb25lIG9mIHRoZSBsZXR0ZXJzXHJcbiAgICAgICAgaWYgKGxldHRlcnNbaV0ua2V5Y29kZSA+PSA2NSAmJiBsZXR0ZXJzW2ldLmtleWNvZGUgPD0gOTApIHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKGxldHRlcnNbaV0uc2hpZnQgPT0gMCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9JZiBub3Qgc2hpZnRlZCwgdGhlbiBzaW1wbHkgcmVkdWNlIHRvIGdldCB0aGUgcHJvcGVyIHBvc2l0aW9uXHJcbiAgICAgICAgICAgIG4gPSBsZXR0ZXJzW2ldLmtleWNvZGUgLSA2NTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9JZiBzaGlmdGVkLCB0aGVuIGFkZCAyNiB0byBjb3JyZWN0XHJcbiAgICAgICAgICAgIG4gPSBsZXR0ZXJzW2ldLmtleWNvZGUgLSA2NSArIDI2O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgIH0gZWxzZSBpZiAobGV0dGVyc1tpXS5rZXljb2RlID09IDQ5ICYmIGxldHRlcnNbaV0uc2hpZnQgPT0gMSkge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL0lmIHRoZXNlIGNvbmRpdGlvbnMgYXJlIHNhdGlzaWZlZCwgdGhlbiB3ZSBoYXZlIGFuIGV4Y2xhbWF0aW9uIHBvaW50XHJcbiAgICAgICAgICAvLyh0aGVyZSBzaG91bGRuJ3QgYmUgYSBjYXNlIHdoZXJlIG9uZSBpcyBidXQgdGhlIG90aGVyIGlzbid0KVxyXG4gICAgICAgICAgbiA9IDUyO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy9PdGhlcndpc2UgaXQncyBhIHNwYWNlIChoZWxwcyB3aXRoIGZvcmNlLXNldClcclxuICAgICAgICAgIG4gPSA1MztcclxuICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICAgXHJcbiAgICAgICAgLy9HZXQgdGhlIHJpZ2h0IHRleHR1cmUgXHJcbiAgICAgICAgaW1nID0gdGV4dHVyZXNbbl07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TZXQgaXQgdG8gdV9pbWFnZVxyXG4gICAgICAgIG9iamVjdFN0YXRlLm1hdGVyaWFsVW5pZm9ybXMudV9pbWFnZSA9IGltZztcclxuICAgICAgICBcclxuICAgICAgICAvL1N0YXJ0IHdpdGggdGh0ZSBpZGVudGl0eSBtYXRyaXhcclxuICAgICAgICBtYXQ0LmlkZW50aXR5KG1hdHJpeCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TdGFydCBieSB0cmFuc2xhdGluZyB0byB0aGUgcHJvcGVyIGNvb3JkaW5hdGVzXHJcbiAgICAgICAgbWF0NC50cmFuc2xhdGUobWF0cml4LCBtYXRyaXgsIFtsZXR0ZXJzW2ldLngsIGxldHRlcnNbaV0ueSwgMF0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vUm90YXRlIGFsb25nIFogZm9yIHRpbHRpbmdcclxuICAgICAgICAvL1RoaXMgaWYgc3RhdGVtZW50IGxldHMgaXQgYWx0ZXJuYXRlIGJhY2sgYW5kIGZvcnRoIGJldHdlZW4gZWFjaCBkaXJlY3Rpb25cclxuICAgICAgICBpZiAoaSAlIDIgPT0gMCkge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBtYXQ0LnJvdGF0ZVoobWF0cml4LCBtYXRyaXgsIGRlZ1RvUmFkKGxldHRlcnNbaV0udGlsdCkpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgbWF0NC5yb3RhdGVaKG1hdHJpeCwgbWF0cml4LCBkZWdUb1JhZCgtbGV0dGVyc1tpXS50aWx0KSk7XHJcbiAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9JZiBtb3VzQ2xpY2tWZWN0b3IgaXMgZGVmaW5lZCwgdGhlbiB0aGVyZSBoYXMgYmVlbiBhIG1vdXNlIGNsaWNrXHJcbiAgICAgICAgaWYgKG1vdXNlQ2xpY2tWZWN0b3IgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vR2V0IHRoZSBsZXR0ZXIncyB4IGFuZCB5XHJcbiAgICAgICAgICB2YXIgeCA9IGxldHRlcnNbaV0ueDtcclxuICAgICAgICAgIHZhciB5ID0gbGV0dGVyc1tpXS55O1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL0dldCB0aGUgbW91c2UgeCBhbmQgeVxyXG4gICAgICAgICAgdmFyIGEgPSBtb3VzZUNsaWNrVmVjdG9yWzBdO1xyXG4gICAgICAgICAgdmFyIGIgPSBtb3VzZUNsaWNrVmVjdG9yWzFdO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL1VzZSB0aGlzIGZvciBjcmVhdGluZyBkaWZmZXJlbnQgZGVncmVlcyBvZiBzcGluXHJcbiAgICAgICAgICB2YXIgaW50ID0gNSAqIHNjYWxlRmFjdG9yO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL0lmIHRoZSBtb3VzZSBpcyB3aXRoaW4gdGhlc2UgbGltaXRzLCB0aGVuIHdlJ3ZlIHN1Y2Nlc3NmdWxseSBjbGlja2VkIG9uIHRoZSBvYmplY3RcclxuICAgICAgICAgIGlmIChhID49ICh4IC0gaW50KSAmJiBhIDw9ICh4ICsgaW50KSAmJiBiID49ICh5IC0gaW50KSAmJiBiIDw9ICh5ICsgaW50KSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9Fc3RhYmxpc2ggdGhhdCB3ZSdyZSBzcGlubmluZ1xyXG4gICAgICAgICAgICBsZXR0ZXJzW2ldLmlzU3Bpbm5pbmcgPSAxO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9WYWx1ZSB0byBzcGxpdCBiZXR3ZWVuIGNlbnRlciBhbmQgZWRnZVxyXG4gICAgICAgICAgICB2YXIgaGFsZiA9IGludCAvIDI7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL1NldCBkZWdyZWVzXHJcbiAgICAgICAgICAgIGlmIChhID49ICh4IC0gaGFsZikgJiYgYSA8PSAoeCArIGhhbGYpKSB7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgbGV0dGVyc1tpXS5kZWdyZWUgPSAyO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIGxldHRlcnNbaV0uZGVncmVlID0gMTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9NYWtlIHRoZSBtb3VzZSB2ZWN0b3IgdW5kZWZpbmVkIGFnYWluLCBzbyB0aGF0IHRoZSBzcGlubmluZyBpcyBub3QgaGluZ2VkIG9uIGNsaWNraW5nIHNvbWV0aGluZyBlbHNlXHJcbiAgICAgICAgICAgIG1vdXNlQ2xpY2tWZWN0b3IgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vUHJvY2VlZCBpZiBzcGlubmluZ1xyXG4gICAgICAgIGlmIChsZXR0ZXJzW2ldLmlzU3Bpbm5pbmcgPT0gMSkge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL0dldCBhcmJpdHJhcmlseS1zZWxlY3RlZCBzcGluc1xyXG4gICAgICAgICAgdmFyIHNwaW5zO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBpZiAobGV0dGVyc1tpXS5kZWdyZWUgPT0gMikge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgc3BpbnMgPSAyO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBzcGlucyA9IDQ7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL0phbmt5IHdheSBvZiBjb250cm9sbGluZyB0aW1lIHNwdW5cclxuICAgICAgICAgIGlmIChsZXR0ZXJzW2ldLnRpbWUgPCBzcGlucykge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9KYW5reSB3YXkgb2YgY3JlYXRpbmcgZGVjZWxlcmF0aW9uXHJcbiAgICAgICAgICAgIGlmIChsZXR0ZXJzW2ldLnRpbWUgPCBsZXR0ZXJzW2ldLmRlZ3JlZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICBtYXQ0LnJvdGF0ZVkobWF0cml4LCBtYXRyaXgsIGRlZ1RvUmFkKDM2MCAqIChsZXR0ZXJzW2ldLnRpbWUgLyBsZXR0ZXJzW2ldLmRlZ3JlZSkpKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsZXR0ZXJzW2ldLnRpbWUgPCAyICogbGV0dGVyc1tpXS5kZWdyZWUpIHtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICBtYXQ0LnJvdGF0ZVkobWF0cml4LCBtYXRyaXgsIGRlZ1RvUmFkKCgzNjAgKiAobGV0dGVyc1tpXS50aW1lIC8gKGxldHRlcnNbaV0uZGVncmVlICogMikpKSArIDE4MCkpO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIG1hdDQucm90YXRlWShtYXRyaXgsIG1hdHJpeCwgZGVnVG9SYWQoMzYwICogKChsZXR0ZXJzW2ldLnRpbWUgLyAobGV0dGVyc1tpXS5kZWdyZWUgKiA0KSkpKSk7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vSW5jcmVtZW50IHRpbWVcclxuICAgICAgICAgICAgbGV0dGVyc1tpXS50aW1lICs9IDAuMDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vSWYgd2UncmUgZG9uZSBzcGlubmluZywgdGhlbiBzZXQgYWxsIHRoZXNlIHZhbHVlcyBiYWNrIHRvIDBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldHRlcnNbaV0udGltZSA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXR0ZXJzW2ldLmlzU3Bpbm5pbmcgPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbGV0dGVyc1tpXS5kZWdyZWUgPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gYWRkIGEgdHJhbnNsYXRlIGFuZCBzY2FsZSB0byB0aGUgb2JqZWN0IFdvcmxkIHhmb3JtLCBzbyB3ZSBoYXZlOiAgUiAqIFQgKiBTXHJcbiAgICAgICAgbWF0NC50cmFuc2xhdGUobWF0cml4LCBtYXRyaXgsIFstY2VudGVyWzBdKnNjYWxlRmFjdG9yLCAtY2VudGVyWzFdKnNjYWxlRmFjdG9yLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLWNlbnRlclsyXSpzY2FsZUZhY3Rvcl0pO1xyXG4gICAgICAgIG1hdDQuc2NhbGUobWF0cml4LCBtYXRyaXgsIFtzY2FsZUZhY3Rvciwgc2NhbGVGYWN0b3IsIHNjYWxlRmFjdG9yXSk7XHJcbiAgICAgICAgbWF0NC5jb3B5KHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkLCBtYXRyaXgpO1xyXG4gICAgXHJcbiAgICAgICAgLy8gZ2V0IHByb2ogKiB2aWV3ICogd29ybGRcclxuICAgICAgICBtYXQ0Lm11bHRpcGx5KG1hdHJpeCwgdmlld01hdHJpeCwgdW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0LnVfd29ybGQpO1xyXG4gICAgICAgIG1hdDQubXVsdGlwbHkodW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0LnVfd29ybGRWaWV3UHJvamVjdGlvbiwgcHJvamVjdGlvbk1hdHJpeCwgbWF0cml4KTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHdvcmxkSW52VHJhbnNwb3NlLiAgRm9yIGFuIGV4cGxhaW5hdGlvbiBvZiB3aHkgd2UgbmVlZCB0aGlzLCBmb3IgZml4aW5nIHRoZSBub3JtYWxzLCBzZWVcclxuICAgICAgICAvLyBodHRwOi8vd3d3LnVua25vd25yb2FkLmNvbS9ydGZtL2dyYXBoaWNzL3J0X25vcm1hbHMuaHRtbFxyXG4gICAgICAgIG1hdDQudHJhbnNwb3NlKHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkSW52ZXJzZVRyYW5zcG9zZSwgXHJcbiAgICAgICAgICAgICAgICAgICBtYXQ0LmludmVydChtYXRyaXgsIHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkKSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdW5pZm9ybXMgd2UganVzdCBjb21wdXRlZFxyXG4gICAgICAgIHNldFVuaWZvcm1zKHVuaWZvcm1TZXR0ZXJzLCB1bmlmb3Jtc1RoYXRBcmVDb21wdXRlZEZvckVhY2hPYmplY3QpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHVuaWZvcm1zIHRoYXQgYXJlIHNwZWNpZmljIHRvIHRoZSB0aGlzIG9iamVjdC5cclxuICAgICAgICBzZXRVbmlmb3Jtcyh1bmlmb3JtU2V0dGVycywgb2JqZWN0U3RhdGUubWF0ZXJpYWxVbmlmb3Jtcyk7XHJcblxyXG4gICAgICAgIC8vIERyYXcgdGhlIGdlb21ldHJ5LiAgIEV2ZXJ5dGhpbmcgaXMga2V5ZWQgdG8gdGhlIFwiXCJcclxuICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBidWZmZXJJbmZvLm51bUVsZW1lbnRzLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UaGlzIGFycmF5IGRvZXNuJ3QgbmVjZXNzYXJpbHkgbmVlZCB0byBiZSBlbmFibGVkLCBidXQgaXQncyBnb29kIGp1c3QgaW4gY2FzZVxyXG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UaGlzIGNvZGUgZm9yIGRyYXdpbmcgbGluZXMgaXMgdGFrZW4gZnJvbSBoZXJlOlxyXG4gICAgICAgIC8vaHR0cDovL3d3dy5jb2RlcHJvamVjdC5jb20vQXJ0aWNsZXMvNTk0MjIyL0xpbmVwbHVzaW5wbHVzV2ViR0xwbHVzYW5kcGx1c3doeXBsdXN5b3VwbHVzZ29ubmFwXHJcbiAgICAgICAgLy81LjAgc2VlbXMgdG8gYmUgdGhlIG1hZ2ljIG51bWJlciwgYm90aCBmb3Iga2VlcGluZyB0aGUgbGluZSBjZW50ZXJlZCBhbmRcclxuICAgICAgICAvL2ZvciBoYXZpbmcgdGhlIGxlYXN0IG5vdGljZWFibGUgZWZmZWN0IGR1cmluZyB5LXJvdGF0aW9uXHJcbiAgICAgICAgdmFyIHZ0eCA9IG5ldyBGbG9hdDMyQXJyYXkoXHJcbiAgICAgICAgICAgICAgICBbNS4wLCAwLjAsIDAuMCwgXHJcbiAgICAgICAgICAgICAgICAgNS4wLCB3b3JsZEhlaWdodCwgMC4wXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIHZhciBpZHggPSBuZXcgVWludDE2QXJyYXkoWzAsIDFdKTtcclxuICAgICAgICBpbml0QnVmZmVycyh2dHgsIGlkeCk7XHJcbiAgICAgICAgZ2wubGluZVdpZHRoKDEuMCk7XHJcbiAgICAgICAgLy9nbC51bmlmb3JtNGYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidV9saW5lQ29sb3JcIiksIDAsIDAsIDAsIDEpO1xyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5MSU5FUywgMiwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vVGhlIGFycmF5IE1VU1QgYmUgZGlzYWJsZWQgc28gdGhhdCB0aGUgb3RoZXIgYnVmZmVycyBjYW4gYmUgdXNlZCBmb3Igb3RoZXIgc3F1YXJlc1xyXG4gICAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcG9zaXRpb25cIikpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZ1bmN0aW9uIGluaXRCdWZmZXIoZ2xFTEVNRU5UX0FSUkFZX0JVRkZFUiwgZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgYnVmID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2xFTEVNRU5UX0FSUkFZX0JVRkZFUiwgYnVmKTtcclxuICAgICAgICAgICAgZ2wuYnVmZmVyRGF0YShnbEVMRU1FTlRfQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgICAgIHJldHVybiBidWY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBpbml0QnVmZmVycyh2dHgsIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgdmJ1ZiA9IGluaXRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2dHgpO1xyXG4gICAgICAgICAgICB2YXIgaWJ1ZiA9IGluaXRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlkeCk7XHJcbiAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGF0cyBtZXRlclxyXG4gICAgc3RhdHMuZW5kKCk7XHJcblxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdTY2VuZSk7XHJcbiAgfVxyXG4gIFxyXG59XHJcblxyXG4vL1RoZSBjbGFzcyBmb3IgZWFjaCBsZXR0ZXJcclxuY2xhc3MgTGV0dGVyIHtcclxuICBcclxuICBpc1NwaW5uaW5nOiAgIG51bWJlcjsgICAgICAgLy9TdGF0ZXMgd2hldGhlciBvciBub3QgaXQncyBjdXJyZW50bHkgc3Bpbm5pbmdcclxuICBkZWdyZWU6ICAgICAgIG51bWJlcjsgICAgICAgLy9TdGF0ZXMgd2hpY2ggZGVncmVlIGl0J3Mgc3Bpbm5pbmcgKDAgaWYgbm90KVxyXG4gIHRpbWU6ICAgICAgICAgbnVtYmVyOyAgICAgICAvL1NhdmVzIHRoZSB0aW1lIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBzcGlucyAoMCBpZiBub3QpXHJcbiAgeDogICAgICAgICAgICBudW1iZXI7ICAgICAgIC8vWC1jb29yZGluYXRlXHJcbiAgeTogICAgICAgICAgICBudW1iZXI7ICAgICAgIC8vWS1jb29yZGluYXRlXHJcbiAgc2hpZnQ6ICAgICAgICBudW1iZXI7ICAgICAgIC8vRmxhZyBmb3Igd2hldGhlciBvciBub3Qgc2hpZnQgd2FzIGhlbGRcclxuICBrZXljb2RlOiAgICAgIG51bWJlcjsgICAgICAgLy9JbnRlZ2VyIGNvZGUgY29ycmVzcG9uZGluZyB0byBhIGtleVxyXG4gIHRpbHQ6ICAgICAgICAgbnVtYmVyOyAgICAgICAvL0RlZ3JlZSBvZiB0aWx0aW5nXHJcbiAgXHJcbiAgY29uc3RydWN0b3Ioc2hpZnQsIGtleWNvZGUpIHtcclxuICAgIFxyXG4gICAgLy9TZXQgc2hpZnQgYW5kIGtleWNvZGUgYmFzZWQgb24gdGhlIHBhcmFtZXRlcnNcclxuICAgIHRoaXMuc2hpZnQgPSBzaGlmdDtcclxuICAgIHRoaXMua2V5Y29kZSA9IGtleWNvZGU7XHJcbiAgICBcclxuICAgIC8vU2V0IHRoZSBmb2xsb3dpbmcgdG8gMFxyXG4gICAgdGhpcy5pc1NwaW5uaW5nID0gMDtcclxuICAgIHRoaXMuZGVncmVlID0gMDtcclxuICAgIHRoaXMudGltZSA9IDA7XHJcbiAgICBcclxuICAgIC8vVGlsdCBpcyBhIHJhbmRvbWUgdmFsdWUgZnJvbSBub3RoaW5nIHRvIDUgZGVncmVlc1xyXG4gICAgLy9TdWNoIGEgc21hbGwgcmFuZ2UgaGVscHMgbWFrZSBwb3NzaWJsZSBmdW5ueSBidXNpbmVzcyBmcm9tIHJvdGF0aW9uIGxlc3Mgbm90aWNlYWJsZVxyXG4gICAgdGhpcy50aWx0ID0gcmFuZCgwLCA1KTtcclxuICAgIFxyXG4gICAgLy9TdGFydCBvZmYgd2l0aCB4IGFzIDBcclxuICAgIHRoaXMueCA9IDA7XHJcbiAgICBcclxuICAgIC8vU2V0IHkgdG8gYSByYW5kb20gdmFyaWFibGUgd2l0aGluIHRoZSBjZW50ZXIgcGFydCBvZiB0aGUgd29ybGRcclxuICAgIHRoaXMueSA9IHJhbmQoLSh3b3JsZEhlaWdodCAqIDAuMjUpLCB3b3JsZEhlaWdodCAqIDAuMjUpO1xyXG4gICAgXHJcbiAgfVxyXG5cclxufVxyXG5cclxuLy9UaGlzIGhlbHBlciBmdW5jdGlvbiBzZXRzIHVwIHRoZSB4IGNvb3JkaW5hdGUgZm9yIGVhY2ggbGV0dGVyXHJcbi8vVGhpcyBpcyBjYWxsZWQgZXZlcnkgdGltZSBhIG5ldyBsZXR0ZXIgaXMgYWRkZWQsIHNpbmNlIHRoZSB4IHZhbHVlcyBuZWVkIHRvIGJlIHVwZGF0ZWRcclxuLy90byBjcmVhdGUgdGhlIGRlc2lyZWQgcG9zaXRpb25pbmdcclxudmFyIHNldFggPSBmdW5jdGlvbihpOiBudW1iZXIpIHtcclxuICAgIFxyXG4gICAgbGV0dGVyc1tpXS54ID0gLSgoKHdvcmxkV2lkdGggLyAobGV0dGVycy5sZW5ndGggKyAxKSkgKiAoaSArIDEpKSAtICh3b3JsZFdpZHRoIC8gMikpO1xyXG4gICAgXHJcbiB9Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
