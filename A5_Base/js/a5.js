///<reference path='./typings/tsd.d.ts'/>
///<reference path="./localTypings/webglutils.d.ts"/>
define(["require", "exports", './loader'], function (require, exports, loader) {
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
    })();
    //This helper function sets up the x coordinate for each letter
    //This is called every time a new letter is added, since the x values need to be updated
    //to create the desired positioning
    var setX = function (i) {
        letters[i].x = -(((worldWidth / (letters.length + 1)) * (i + 1)) - (worldWidth / 2));
    };
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImE1LnRzIl0sIm5hbWVzIjpbIm9mZnNldCIsImluaXRXZWJHTCIsIm1haW4iLCJtYWluLmRlZ1RvUmFkIiwibWFpbi5yZW5kZXIiLCJtYWluLmRyYXdTY2VuZSIsIm1haW4uZHJhd1NjZW5lLmluaXRCdWZmZXIiLCJtYWluLmRyYXdTY2VuZS5pbml0QnVmZmVycyIsIkxldHRlciIsIkxldHRlci5jb25zdHJ1Y3RvciJdLCJtYXBwaW5ncyI6IkFBQUEseUNBQXlDO0FBQ3pDLHFEQUFxRDs7SUFJckQsNEZBQTRGO0lBQzVGLHVGQUF1RjtJQUN2RixtQkFBbUI7SUFDbkIsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN4QixLQUFLLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsdUJBQXVCO0lBRTNDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7SUFDN0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBRW5DLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQztJQUU5QywrQ0FBK0M7SUFDL0MsSUFBSSxNQUFNLEdBQXNCLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFakUsWUFBWTtJQUNaLElBQUksSUFBSSxHQUFHLFVBQVMsR0FBVyxFQUFFLEdBQVk7UUFDM0MsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNWLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDVixDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdB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QUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dDQUV4Q0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsUUFBUUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBRXRGQSxDQUFDQTs0QkFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsR0FBR0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBRW5EQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFFcEdBLENBQUNBOzRCQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQ0FFTkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsUUFBUUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBRTlGQSxDQUFDQTs0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LHdGQUF3RjtJQUN4RixtQ0FBbUM7SUFDbkMsSUFBSSxJQUFJLEdBQUcsVUFBUyxDQUFTO1FBRXpCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhGLENBQUMsQ0FBQSIsImZpbGUiOiJhNS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgcGF0aD0nLi90eXBpbmdzL3RzZC5kLnRzJy8+XHJcbi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vbG9jYWxUeXBpbmdzL3dlYmdsdXRpbHMuZC50c1wiLz5cclxuXHJcbmltcG9ydCBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gc3RhdHMgbW9kdWxlIGJ5IG1yZG9vYiAoaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi9zdGF0cy5qcykgdG8gc2hvdyB0aGUgcGVyZm9ybWFuY2UgXHJcbi8vIG9mIHlvdXIgZ3JhcGhpY3NcclxudmFyIHN0YXRzID0gbmV3IFN0YXRzKCk7XHJcbnN0YXRzLnNldE1vZGUoIDEgKTsgLy8gMDogZnBzLCAxOiBtcywgMjogbWJcclxuXHJcbnN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG5zdGF0cy5kb21FbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzBweCc7XHJcbnN0YXRzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzBweCc7XHJcblxyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBzdGF0cy5kb21FbGVtZW50ICk7XHJcblxyXG4vLyBnZXQgc29tZSBvZiBvdXIgY2FudmFzIGVsZW1lbnRzIHRoYXQgd2UgbmVlZFxyXG52YXIgY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2ViZ2xcIik7XHJcblxyXG4vLyB1dGlsaXRpZXNcclxudmFyIHJhbmQgPSBmdW5jdGlvbihtaW46IG51bWJlciwgbWF4PzogbnVtYmVyKSB7XHJcbiAgaWYgKG1heCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBtYXggPSBtaW47XHJcbiAgICBtaW4gPSAwO1xyXG4gIH1cclxuICByZXR1cm4gbWluICsgTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pO1xyXG59O1xyXG5cclxudmFyIHJhbmRJbnQgPSBmdW5jdGlvbihyYW5nZSkge1xyXG4gIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiByYW5nZSk7XHJcbn07XHJcblxyXG4vL0xldHRlcnMgaXMgYW4gYXJyYXkgdGhhdCB3aWxsIHN0b3JlIHVwIHRvIDE1IGxldHRlcnNcclxuLy9UZXh0dXJlcyBpcyBhbiBhcnJheSB0aGF0IHdpbGwgc3RvcmUgYWxsIHRoZSB0ZXh0dXJlc1xyXG5cclxudmFyIGxldHRlcnMgPSBbXTtcclxudmFyIHRleHR1cmVzID0gW107XHJcblxyXG4vL1RoZSB3b3JsZCB3aWR0aCBhbmQgaGVpZ2h0IGFyZSBzYXZlZCBnbG9iYWxseVxyXG5cclxudmFyIHdvcmxkSGVpZ2h0O1xyXG52YXIgd29ybGRXaWR0aDtcclxuXHJcbndpbmRvd1tcInJlc2V0XCJdID0gKCkgPT4ge1xyXG4gIFxyXG4gIC8vV2hlbiB0aGUgYnV0dG9uIGlzIHByZXNzZWQsIGp1c3QgY3JlYXRlIGEgbmV3IGFycmF5XHJcbiAgXHJcbiAgbGV0dGVycyA9IFtdO1xyXG4gIFxyXG59XHJcblxyXG4vL1JlY3RhbmdsZSBpcyB0aGUgcmVjdCBmb3VuZCBpbiBvZmZzZXQgc2F2ZWQgZ2xvYmFsbHlcclxuXHJcbnZhciByZWN0YW5nbGUgPSB1bmRlZmluZWQ7XHJcblxyXG4vLyBzb21lIHNpbXBsZSBpbnRlcmFjdGlvbiB1c2luZyB0aGUgbW91c2UuXHJcbi8vIHdlIGFyZSBnb2luZyB0byBnZXQgc21hbGwgbW90aW9uIG9mZnNldHMgb2YgdGhlIG1vdXNlLCBhbmQgdXNlIHRoZXNlIHRvIHJvdGF0ZSB0aGUgb2JqZWN0XHJcbi8vXHJcbi8vIG91ciBvZmZzZXQoKSBmdW5jdGlvbiBmcm9tIGFzc2lnbm1lbnQgMCwgdG8gZ2l2ZSB1cyBhIGdvb2QgbW91c2UgcG9zaXRpb24gaW4gdGhlIGNhbnZhcyBcclxuZnVuY3Rpb24gb2Zmc2V0KGU6IE1vdXNlRXZlbnQpOiBHTE0uSUFycmF5IHtcclxuICAgIGUgPSBlIHx8IDxNb3VzZUV2ZW50PiB3aW5kb3cuZXZlbnQ7XHJcblxyXG4gICAgdmFyIHRhcmdldCA9IDxFbGVtZW50PiBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQsXHJcbiAgICAgICAgcmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgICAgICBvZmZzZXRYID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0LFxyXG4gICAgICAgIG9mZnNldFkgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcclxuICAgICAgICBcclxuICAgIHJlY3RhbmdsZSA9IHJlY3Q7XHJcblxyXG4gICAgcmV0dXJuIHZlYzIuZnJvbVZhbHVlcyhvZmZzZXRYLCBvZmZzZXRZKTtcclxufVxyXG5cclxudmFyIG1vdXNlU3RhcnQgPSB1bmRlZmluZWQ7ICAvLyBwcmV2aW91cyBtb3VzZSBwb3NpdGlvblxyXG52YXIgbW91c2VEZWx0YSA9IHVuZGVmaW5lZDsgIC8vIHRoZSBhbW91bnQgdGhlIG1vdXNlIGhhcyBtb3ZlZFxyXG4vL3ZhciBtb3VzZUFuZ2xlcyA9IHZlYzIuY3JlYXRlKCk7ICAvLyBhbmdsZSBvZmZzZXQgY29ycmVzcG9uZGluZyB0byBtb3VzZSBtb3ZlbWVudFxyXG5cclxudmFyIG1vdXNlQ2xpY2tWZWN0b3IgPSB1bmRlZmluZWQ7IC8vVGhlIG1vdXNlIHBvc2l0aW9uIGNvbnZlcnRlZCB0byB3b3JsZCBjb29yZGluYXRlcyBhbmQgcHV0IGluIGEgdmVjdG9yXHJcblxyXG4vLyBzdGFydCB0aGluZ3Mgb2ZmIHdpdGggYSBkb3duIHByZXNzXHJcbmNhbnZhcy5vbm1vdXNlZG93biA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgbW91c2VTdGFydCA9IG9mZnNldChldik7ICAgICAgICBcclxuICAgIG1vdXNlRGVsdGEgPSB2ZWMyLmNyZWF0ZSgpOyAgLy8gaW5pdGlhbGl6ZSB0byAwLDBcclxuICAgLy92ZWMyLnNldChtb3VzZUFuZ2xlcywgMCwgMCk7XHJcbiAgICBcclxufVxyXG5cclxuLy8gLy8gc3RvcCB0aGluZ3Mgd2l0aCBhIG1vdXNlIHJlbGVhc2VcclxuY2FudmFzLm9ubW91c2V1cCA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgaWYgKG1vdXNlU3RhcnQgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIFxyXG4gICAgICAgIGNvbnN0IGNsaWNrRW5kID0gb2Zmc2V0KGV2KTtcclxuICAgICAgICB2ZWMyLnN1Yihtb3VzZURlbHRhLCBjbGlja0VuZCwgbW91c2VTdGFydCk7ICAgICAgICAvLyBkZWx0YSA9IGVuZCAtIHN0YXJ0XHJcbiAgICAgICAgLy92ZWMyLnNjYWxlKG1vdXNlQW5nbGVzLCBtb3VzZURlbHRhLCAxMC9jYW52YXMuaGVpZ2h0KTsgIFxyXG5cclxuICAgICAgICAvLyBub3cgdG9zcyB0aGUgdHdvIHZhbHVlcyBzaW5jZSB0aGUgbW91c2UgaXMgdXBcclxuICAgICAgICBtb3VzZURlbHRhID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIG1vdXNlU3RhcnQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9HZXQgdGhlIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgICAgICB2YXIgd2lkdGggPSByZWN0YW5nbGUucmlnaHQgLSByZWN0YW5nbGUubGVmdDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gcmVjdGFuZ2xlLmJvdHRvbSAtIHJlY3RhbmdsZS50b3A7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TYXZlIHRoZSBvZmZzZXQgaW50byBhIHRlbXBcclxuICAgICAgICB2YXIgdGVtcCA9IGNsaWNrRW5kO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vTW9kaWZ5IHRlbXAncyB4IGFuZCB5XHJcbiAgICAgICAgdGVtcFswXSA9IHRlbXBbMF0gLSAod2lkdGgvMik7XHJcbiAgICAgICAgdGVtcFsxXSA9IDEgLSB0ZW1wWzFdICsgKGhlaWdodC8yKTtcclxuICAgICAgICBcclxuICAgICAgICAvL0dldCBuZXcgeCBhbmQgeSBmb3IgdGhlIG1vdXNlQ2xpY2tWZWN0b3JcclxuICAgICAgICB2YXIgeCA9ICh0ZW1wWzBdIC8gd2lkdGgpICogd29ybGRXaWR0aDtcclxuICAgICAgICB2YXIgeSA9ICh0ZW1wWzFdIC8gaGVpZ2h0KSAqIHdvcmxkSGVpZ2h0O1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vTWFrZSBhIHZlYzQgKHggaXMgbmVnYXRlZCBmb3IgY29ycmVjdGluZyBpc3N1ZXMpXHJcbiAgICAgICAgbW91c2VDbGlja1ZlY3RvciA9IHZlYzQuZnJvbVZhbHVlcygteCwgeSwgMCwgMSk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIC8vIGlmIHdlJ3JlIG1vdmluZyBhbmQgdGhlIG1vdXNlIGlzIGRvd24gICAgICAgIFxyXG4vLyBjYW52YXMub25tb3VzZW1vdmUgPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuLy8gICAgIGlmIChtb3VzZVN0YXJ0ICE9IHVuZGVmaW5lZCkge1xyXG4vLyAgICAgICBjb25zdCBtID0gb2Zmc2V0KGV2KTtcclxuLy8gICAgICAgdmVjMi5zdWIobW91c2VEZWx0YSwgbSwgbW91c2VTdGFydCk7ICAgIC8vIGRlbHRhID0gbW91c2UgLSBzdGFydCBcclxuLy8gICAgICAgdmVjMi5jb3B5KG1vdXNlU3RhcnQsIG0pOyAgICAgICAgICAgICAgIC8vIHN0YXJ0IGJlY29tZXMgY3VycmVudCBwb3NpdGlvblxyXG4vLyAgICAgICB2ZWMyLnNjYWxlKG1vdXNlQW5nbGVzLCBtb3VzZURlbHRhLCAxMC9jYW52YXMuaGVpZ2h0KTtcclxuXHJcbi8vICAgICAgIC8vIGNvbnNvbGUubG9nKFwibW91c2Vtb3ZlIG1vdXNlQW5nbGVzOiBcIiArIG1vdXNlQW5nbGVzWzBdICsgXCIsIFwiICsgbW91c2VBbmdsZXNbMV0pO1xyXG4vLyAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1vdXNlbW92ZSBtb3VzZURlbHRhOiBcIiArIG1vdXNlRGVsdGFbMF0gKyBcIiwgXCIgKyBtb3VzZURlbHRhWzFdKTtcclxuLy8gICAgICAgLy8gY29uc29sZS5sb2coXCJtb3VzZW1vdmUgbW91c2VTdGFydDogXCIgKyBtb3VzZVN0YXJ0WzBdICsgXCIsIFwiICsgbW91c2VTdGFydFsxXSk7XHJcbi8vICAgIH1cclxuLy8gfVxyXG5cclxuLy8gLy8gc3RvcCB0aGluZ3MgaWYgeW91IG1vdmUgb3V0IG9mIHRoZSB3aW5kb3dcclxuLy8gY2FudmFzLm9ubW91c2VvdXQgPSAoZXY6IE1vdXNlRXZlbnQpID0+IHtcclxuLy8gICAgIGlmIChtb3VzZVN0YXJ0ICE9IHVuZGVmaW5lZCkge1xyXG4vLyAgICAgICB2ZWMyLnNldChtb3VzZUFuZ2xlcywgMCwgMCk7XHJcbi8vICAgICAgIG1vdXNlRGVsdGEgPSB1bmRlZmluZWQ7XHJcbi8vICAgICAgIG1vdXNlU3RhcnQgPSB1bmRlZmluZWQ7XHJcbi8vICAgICB9XHJcbi8vIH1cclxuXHJcbndpbmRvdy5vbmtleWRvd24gPSAoZXY6IEtleWJvYXJkRXZlbnQpID0+IHtcclxuICBcclxuICB2YXIgZmxhZyA9IDA7ICAgICAgICAgICAvL0ZsYWcgdG8gc2VlIGlmIGEgdmFsaWQga2V5IGhhcyBiZWVuIHByZXNzZWRcclxuICB2YXIgaXNTaGlmdGVkID0gMDsgICAgICAvL0NoZWNrIHRvIHNlZSBpZiBzaGlmdCBpcyBoZWxkXHJcbiAgdmFyIGNvZGU7ICAgICAgICAgICAgICAgLy9TdG9yaW5nIHRoZSBwcm9wZXIga2V5Y29kZVxyXG4gIFxyXG4gIC8vRmlyc3QgY2hlY2sgaWYgd2UncmUgdW5kZXIgMTUgbGV0dGVyc1xyXG4gIGlmIChsZXR0ZXJzLmxlbmd0aCA8IDE1KSB7XHJcbiAgICBcclxuICAgIC8vSWYga2V5Y29kZSBpcyBpbiB0aGlzIHJhbmdlLCB0aGVuIGl0J3MgYSBsZXR0ZXJcclxuICAgIGlmIChldi5rZXlDb2RlID49IDY1ICYmIGV2LmtleUNvZGUgPD0gOTApIHtcclxuICAgICAgXHJcbiAgICAgIC8vQ2hlY2sgZm9yIHNoaWZ0XHJcbiAgICAgIGlmIChldi5zaGlmdEtleSkge1xyXG4gICAgICBcclxuICAgICAgICBpc1NoaWZ0ZWQgPSAxO1xyXG4gICAgICBcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy9TYXZlXHJcbiAgICAgIGNvZGUgPSBldi5rZXlDb2RlO1xyXG4gICAgXHJcbiAgICB9IGVsc2UgaWYgKGV2LmtleUNvZGUgPT0gMzIpIHtcclxuICAgICAgXHJcbiAgICAgIC8vU2F2aW5nIGtleWNvZGUgZm9yIHNwYWNlXHJcbiAgICAgIGNvZGUgPSBldi5rZXlDb2RlO1xyXG4gICAgXHJcbiAgICB9IGVsc2UgaWYgKGV2LmtleUNvZGUgPT0gNDkpIHtcclxuICAgICAgXHJcbiAgICAgIC8vVGhpcyBpcyB0aGUgZXhjbGFtYXRpb24gcG9pbnQsIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yIHNoaWZ0XHJcbiAgICAgIGlmIChldi5zaGlmdEtleSkge1xyXG4gICAgXHJcbiAgICAgICAgaXNTaGlmdGVkID0gMTtcclxuICAgIFxyXG4gICAgICAgIGNvZGUgPSBldi5rZXlDb2RlO1xyXG4gICAgICAgIFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vRmxhZyBmb3IgaGl0dGluZyAxXHJcbiAgICAgICAgZmxhZyA9IDE7XHJcbiAgICAgICAgXHJcbiAgICAgIH1cclxuICAgIFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgXHJcbiAgICAgIC8vRmxhZyBmb3Igbm90IGhpdHRpbmcgYSB2YWxpZCBrZXlcclxuICAgICAgZmxhZyA9IDE7XHJcbiAgICBcclxuICAgIH1cclxuICAgIFxyXG4gIH0gZWxzZSB7XHJcbiAgICBcclxuICAgIC8vRmxhZyBmb3IgdHJ5aW5nIHRvIHB1dCBtb3JlIHRoYW4gMTUgbGV0dGVyc1xyXG4gICAgZmxhZyA9IDE7XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgLy9Qcm9jZWVkIGlmIGZsYWcgaXMgMFxyXG4gIGlmIChmbGFnID09IDApIHtcclxuICAgIFxyXG4gICAgLy9DcmVhdGUgYSBuZXcgbGV0dGVyXHJcbiAgICB2YXIgbGV0dGVyID0gbmV3IExldHRlcihpc1NoaWZ0ZWQsIGNvZGUpO1xyXG4gICAgXHJcbiAgICAvL1B1c2ggdG8gdGhlIGFycmF5XHJcbiAgICBsZXR0ZXJzLnB1c2gobGV0dGVyKTtcclxuICAgIFxyXG4gICAgdmFyIGk7XHJcbiAgICBcclxuICAgIC8vRm9yIGV2ZXJ5IGxldHRlciwgZ2V0IGl0cyB4IHZhbHVlXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGV0dGVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBcclxuICAgICAgc2V0WChpKTtcclxuICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vUGxheSB0aGUgYmVsbCBzb3VuZFxyXG4gICAgdmFyIGdvb2RTb3VuZCA9IG5ldyBIb3dsKHtcclxuICAgICAgdXJsczogWydiZWxsLm1wMyddXHJcbiAgICB9KS5wbGF5KCk7XHJcbiAgICBcclxuICB9IGVsc2Uge1xyXG4gICAgXHJcbiAgICAvL0V2ZW4gaWYgZmxhZ2dlZCwgd2UgY291bGQganVzdCBiZSBob2xkaW5nIHNoaWZ0XHJcbiAgICAvL0lmIG5vdCwgcGxheSB0aGUgYnV6emVyIHNvdW5kXHJcbiAgICBpZiAoIWV2LnNoaWZ0S2V5KSB7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgYmFkU291bmQgPSBuZXcgSG93bCh7XHJcbiAgICAgICAgdXJsczogWydidXp6ZXIubXAzJ11cclxuICAgICAgfSkucGxheSgpO1xyXG4gICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gIH1cclxuICBcclxufVxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gc3RhcnQgdGhpbmdzIG9mZiBieSBjYWxsaW5nIGluaXRXZWJHTFxyXG5pbml0V2ViR0woKTtcclxuXHJcbmZ1bmN0aW9uIGluaXRXZWJHTCgpIHtcclxuICAvLyBnZXQgdGhlIHJlbmRlcmluZyBjb250ZXh0IGZvciB3ZWJHTFxyXG4gIHZhciBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0ID0gZ2V0V2ViR0xDb250ZXh0KGNhbnZhcyk7XHJcbiAgaWYgKCFnbCkge1xyXG4gICAgcmV0dXJuOyAgLy8gbm8gd2ViZ2whICBCeWUgYnllXHJcbiAgfVxyXG5cclxuICAvLyB0dXJuIG9uIGJhY2tmYWNlIGN1bGxpbmcgYW5kIHpidWZmZXJpbmdcclxuICAvL2dsLmVuYWJsZShnbC5DVUxMX0ZBQ0UpO1xyXG4gIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcclxuXHJcbiAgLy8gYXR0ZW1wdCB0byBkb3dubG9hZCBhbmQgc2V0IHVwIG91ciBHTFNMIHNoYWRlcnMuICBXaGVuIHRoZXkgZG93bmxvYWQsIHByb2Nlc3NlZCB0byB0aGUgbmV4dCBzdGVwXHJcbiAgLy8gb2Ygb3VyIHByb2dyYW0sIHRoZSBcIm1haW5cIiByb3V0aW5nXHJcbiAgLy8gXHJcbiAgLy8gWU9VIFNIT1VMRCBNT0RJRlkgVEhJUyBUTyBET1dOTE9BRCBBTEwgWU9VUiBTSEFERVJTIGFuZCBzZXQgdXAgYWxsIGZvdXIgU0hBREVSIFBST0dSQU1TLFxyXG4gIC8vIFRIRU4gUEFTUyBBTiBBUlJBWSBPRiBQUk9HUkFNUyBUTyBtYWluKCkuICBZb3UnbGwgaGF2ZSB0byBkbyBvdGhlciB0aGluZ3MgaW4gbWFpbiB0byBkZWFsXHJcbiAgLy8gd2l0aCBtdWx0aXBsZSBzaGFkZXJzIGFuZCBzd2l0Y2ggYmV0d2VlbiB0aGVtXHJcbiAgbG9hZGVyLmxvYWRGaWxlcyhbJ3NoYWRlcnMvYTMtc2hhZGVyLnZlcnQnLCAnc2hhZGVycy9hMy1zaGFkZXIuZnJhZyddLCBmdW5jdGlvbiAoc2hhZGVyVGV4dCkge1xyXG4gICAgdmFyIHByb2dyYW0gPSBjcmVhdGVQcm9ncmFtRnJvbVNvdXJjZXMoZ2wsIHNoYWRlclRleHQpO1xyXG4gICAgbWFpbihnbCwgcHJvZ3JhbSk7XHJcbiAgfSwgZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICBhbGVydCgnU2hhZGVyIGZhaWxlZCB0byBkb3dubG9hZCBcIicgKyB1cmwgKyAnXCInKTtcclxuICB9KTsgXHJcbn1cclxuXHJcbi8vIHdlYkdMIGlzIHNldCB1cCwgYW5kIG91ciBTaGFkZXIgcHJvZ3JhbSBoYXMgYmVlbiBjcmVhdGVkLiAgRmluaXNoIHNldHRpbmcgdXAgb3VyIHdlYkdMIGFwcGxpY2F0aW9uICAgICAgIFxyXG5mdW5jdGlvbiBtYWluKGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIHByb2dyYW06IFdlYkdMUHJvZ3JhbSkge1xyXG4gIFxyXG4gIC8vIHVzZSB0aGUgd2ViZ2wtdXRpbHMgbGlicmFyeSB0byBjcmVhdGUgc2V0dGVycyBmb3IgYWxsIHRoZSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlcyBpbiBvdXIgc2hhZGVycy5cclxuICAvLyBJdCBlbnVtZXJhdGVzIGFsbCBvZiB0aGUgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgaW4gdGhlIHByb2dyYW0sIGFuZCBjcmVhdGVzIHV0aWxpdHkgZnVuY3Rpb25zIHRvIFxyXG4gIC8vIGFsbG93IFwic2V0VW5pZm9ybXNcIiBhbmQgXCJzZXRBdHRyaWJ1dGVzXCIgKGJlbG93KSB0byBzZXQgdGhlIHNoYWRlciB2YXJpYWJsZXMgZnJvbSBhIGphdmFzY3JpcHQgb2JqZWN0LiBcclxuICAvLyBUaGUgb2JqZWN0cyBoYXZlIGEga2V5IGZvciBlYWNoIHVuaWZvcm0gb3IgYXR0cmlidXRlLCBhbmQgYSB2YWx1ZSBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIGZvciB0aGVcclxuICAvLyBzZXR0ZXIgZnVuY3Rpb25cclxuICB2YXIgdW5pZm9ybVNldHRlcnMgPSBjcmVhdGVVbmlmb3JtU2V0dGVycyhnbCwgcHJvZ3JhbSk7XHJcbiAgdmFyIGF0dHJpYlNldHRlcnMgID0gY3JlYXRlQXR0cmlidXRlU2V0dGVycyhnbCwgcHJvZ3JhbSk7XHJcblxyXG4gIC8vIGFuIGluZGV4ZWQgcXVhZFxyXG4gIHZhciBhcnJheXMgPSB7XHJcbiAgICAgcG9zaXRpb246IHsgbnVtQ29tcG9uZW50czogMywgZGF0YTogWzAsIDAsIDAsIDEwLCAwLCAwLCAwLCAxMCwgMCwgMTAsIDEwLCAwXSwgfSxcclxuICAgICAvL3RleGNvb3JkOiB7IG51bUNvbXBvbmVudHM6IDIsIGRhdGE6IFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgLy90ZXhjb29yZDogeyBudW1Db21wb25lbnRzOiAyLCBkYXRhOiBbMCwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sICAgICAgICAgICAgICAgICB9LFxyXG4gICAgIHRleGNvb3JkOiB7IG51bUNvbXBvbmVudHM6IDIsIGRhdGE6IFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAwXSwgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICBub3JtYWw6ICAgeyBudW1Db21wb25lbnRzOiAzLCBkYXRhOiBbMCwgMCwgLTEsIDAsIDAsIC0xLCAwLCAwLCAtMSwgMCwgMCwgLTFdLCB9LFxyXG4gICAgIGluZGljZXM6ICB7IG51bUNvbXBvbmVudHM6IDMsIGRhdGE6IFswLCAxLCAyLCAxLCAzLCAyXSwgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgfTtcclxuICB2YXIgY2VudGVyID0gWzUsNSwwXTtcclxuICB2YXIgc2NhbGVGYWN0b3IgPSAyO1xyXG4gIFxyXG4gIHZhciBidWZmZXJJbmZvID0gY3JlYXRlQnVmZmVySW5mb0Zyb21BcnJheXMoZ2wsIGFycmF5cyk7XHJcbiAgXHJcbiAgZnVuY3Rpb24gZGVnVG9SYWQoZCkge1xyXG4gICAgcmV0dXJuIGQgKiBNYXRoLlBJIC8gMTgwO1xyXG4gIH1cclxuXHJcbiAgdmFyIGNhbWVyYUFuZ2xlUmFkaWFucyA9IGRlZ1RvUmFkKDApO1xyXG4gIHZhciBmaWVsZE9mVmlld1JhZGlhbnMgPSBkZWdUb1JhZCg2MCk7XHJcbiAgdmFyIGNhbWVyYUhlaWdodCA9IDUwO1xyXG5cclxuICB2YXIgdW5pZm9ybXNUaGF0QXJlVGhlU2FtZUZvckFsbE9iamVjdHMgPSB7XHJcbiAgICB1X2xpZ2h0V29ybGRQb3M6ICAgICAgICAgWzUwLCAzMCwgLTEwMF0sXHJcbiAgICB1X3ZpZXdJbnZlcnNlOiAgICAgICAgICAgbWF0NC5jcmVhdGUoKSxcclxuICAgIHVfbGlnaHRDb2xvcjogICAgICAgICAgICBbMSwgMSwgMSwgMV0sXHJcbiAgICB1X2FtYmllbnQ6ICAgICAgICAgICAgICAgWzAuMSwgMC4xLCAwLjEsIDAuMV1cclxuICB9O1xyXG5cclxuICB2YXIgdW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0ID0ge1xyXG4gICAgdV93b3JsZFZpZXdQcm9qZWN0aW9uOiAgIG1hdDQuY3JlYXRlKCksXHJcbiAgICB1X3dvcmxkOiAgICAgICAgICAgICAgICAgbWF0NC5jcmVhdGUoKSxcclxuICAgIHVfd29ybGRJbnZlcnNlVHJhbnNwb3NlOiBtYXQ0LmNyZWF0ZSgpLFxyXG4gIH07XHJcblxyXG4gIC8vIHZhciB0ZXh0dXJlID0gLi4uLiBjcmVhdGUgYSB0ZXh0dXJlIG9mIHNvbWUgZm9ybVxyXG5cclxuICB2YXIgYmFzZUNvbG9yID0gcmFuZCgyNDApO1xyXG4gIHZhciBvYmplY3RTdGF0ZSA9IHsgXHJcbiAgICAgIG1hdGVyaWFsVW5pZm9ybXM6IHtcclxuICAgICAgICB1X2NvbG9yTXVsdDogICAgICAgICAgICAgY2hyb21hLmhzdihyYW5kKGJhc2VDb2xvciwgYmFzZUNvbG9yICsgMTIwKSwgMC41LCAxKS5nbCgpLFxyXG4gICAgICAgIC8vdV9jb2xvck11bHQ6ICAgICAgICAgICAgIFswLCAxLCAwLCAxXSxcclxuICAgICAgICAvL3VfZGlmZnVzZTogICAgICAgICAgICAgICBudWxsLC8vdGV4dHVyZSxcclxuICAgICAgICB1X3NwZWN1bGFyOiAgICAgICAgICAgICAgWzEsIDEsIDEsIDFdLFxyXG4gICAgICAgIHVfc2hpbmluZXNzOiAgICAgICAgICAgICA0NTAsXHJcbiAgICAgICAgdV9zcGVjdWxhckZhY3RvcjogICAgICAgIDAuNzUsXHJcbiAgICAgICAgdV9pbWFnZTogICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICAvL3VfbGluZUNvbG9yOiAgICAgICAgICAgICBbMCwgMCwgMCwgMF0sXHJcbiAgICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBzb21lIHZhcmlhYmxlcyB3ZSdsbCByZXVzZSBiZWxvd1xyXG4gIHZhciBwcm9qZWN0aW9uTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICB2YXIgdmlld01hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIHJvdGF0aW9uTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICB2YXIgbWF0cml4ID0gbWF0NC5jcmVhdGUoKTsgIC8vIGEgc2NyYXRjaCBtYXRyaXhcclxuICB2YXIgaW52TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcclxuICB2YXIgYXhpc1ZlY3RvciA9IHZlYzMuY3JlYXRlKCk7XHJcbiAgXHJcbiAgdmFyIGk7XHJcbiAgXHJcbiAgZm9yIChpID0gMDsgaSA8IDU0OyBpKyspIHtcclxuICAgIFxyXG4gICAgdmFyIHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTtcclxuICAgIC8vIEZpbGwgdGhlIHRleHR1cmUgd2l0aCBhIDF4MSBibHVlIHBpeGVsLlxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCAxLCAxLCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBuZXcgVWludDhBcnJheShbMCwgMCwgMjU1LCAyNTVdKSk7XHJcbiAgICBcclxuICAgIHRleHR1cmVzW2ldID0gdGV4dHVyZTtcclxuICAgIFxyXG4gIH1cclxuICBcclxuICAvL1RoZSBmb2xsb3dpbmcgaW1hZ2UgY29uc3RydWN0aW9uIGFuZCByZW5kZXIgZnVuY3Rpb24gYXJlIHRha2VuIGZyb20gV2ViR0xGdW5kYW1lbnRhbHMsXHJcbiAgLy9hcyBzZWVuIGhlcmU6IGh0dHA6Ly93ZWJnbGZ1bmRhbWVudGFscy5vcmcvd2ViZ2wvbGVzc29ucy93ZWJnbC1pbWFnZS1wcm9jZXNzaW5nLmh0bWxcclxuICAvL1RoZXJlIGFyZSA1NCBpbWFnZXM6IDI2IHVwcGVyY2FzZSBsZXR0ZXJzLCAyNiBsb3dlcmNhc2UsIGEgc3BhY2UsIGFuZCBhbiBleGNsYW1hdGlvbiBwb2ludFxyXG4gIC8vRXZlcnkgc2luZ2xlIG9uZSBpcyBoYXJkLWNvZGVkIGFuZCBwdXQgaW4gdGhlIHRleHR1cmVzIGFycmF5XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUEgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VBLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlQS5wbmdcIjtcclxuICBsb3dlcmNhc2VBLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUEsIDApO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlQiA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUIuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VCLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlQiwgMSk7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VDID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlQy5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUMucG5nXCI7XHJcbiAgbG93ZXJjYXNlQy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VDLCAyKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUQgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VELnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlRC5wbmdcIjtcclxuICBsb3dlcmNhc2VELm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUQsIDMpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlRSA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUUuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VFLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUUub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlRSwgNCk7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VGID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlRi5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUYucG5nXCI7XHJcbiAgbG93ZXJjYXNlRi5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VGLCA1KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUcgPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VHLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlRy5wbmdcIjtcclxuICBsb3dlcmNhc2VHLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUcsIDYpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlSCA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUguc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VILnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUgub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlSCwgNyk7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBsb3dlcmNhc2VJID0gbmV3IEltYWdlKCk7XHJcbiAgbG93ZXJjYXNlSS5zcmMgPSBcImZpeGVkSW1hZ2VzL0xvd2VyY2FzZUkucG5nXCI7XHJcbiAgbG93ZXJjYXNlSS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihsb3dlcmNhc2VJLCA4KTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIGxvd2VyY2FzZUogPSBuZXcgSW1hZ2UoKTtcclxuICBsb3dlcmNhc2VKLnNyYyA9IFwiZml4ZWRJbWFnZXMvTG93ZXJjYXNlSi5wbmdcIjtcclxuICBsb3dlcmNhc2VKLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmVuZGVyKGxvd2VyY2FzZUosIDkpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlSyA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUsuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VLLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUsub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlSywgMTApO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlTCA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZUwuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VMLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZUwub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlTCwgMTEpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlTSA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZU0uc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VNLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZU0ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlTSwgMTIpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlTiA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZU4uc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VOLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZU4ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlTiwgMTMpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlTyA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZU8uc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VPLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZU8ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlTywgMTQpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlUCA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVAuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VQLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVAub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlUCwgMTUpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlUSA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVEuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VRLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlUSwgMTYpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlUiA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVIuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VSLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlUiwgMTcpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlUyA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVMuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VTLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVMub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlUywgMTgpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlVCA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVQuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VULnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVQub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlVCwgMTkpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlVSA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVUuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VVLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVUub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlVSwgMjApO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlViA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVYuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VWLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVYub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlViwgMjEpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlVyA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVcuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VXLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVcub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlVywgMjIpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlWCA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVguc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VYLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVgub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlWCwgMjMpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlWSA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVkuc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VZLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVkub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlWSwgMjQpO1xyXG4gIH1cclxuICBcclxuICB2YXIgbG93ZXJjYXNlWiA9IG5ldyBJbWFnZSgpO1xyXG4gIGxvd2VyY2FzZVouc3JjID0gXCJmaXhlZEltYWdlcy9Mb3dlcmNhc2VaLnBuZ1wiO1xyXG4gIGxvd2VyY2FzZVoub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIobG93ZXJjYXNlWiwgMjUpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlQSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUEuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VBLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlQSwgMjYpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlQiA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUIuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VCLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlQiwgMjcpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlQyA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUMuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VDLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUMub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlQywgMjgpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlRCA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUQuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VELnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUQub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlRCwgMjkpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlRSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUUuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VFLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUUub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlRSwgMzApO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlRiA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUYuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VGLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUYub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlRiwgMzEpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlRyA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUcuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VHLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUcub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlRywgMzIpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlSCA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUguc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VILnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUgub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlSCwgMzMpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlSSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUkuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VJLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUkub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlSSwgMzQpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlSiA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUouc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VKLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUoub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlSiwgMzUpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlSyA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUsuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VLLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUsub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlSywgMzYpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlTCA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZUwuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VMLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZUwub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlTCwgMzcpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlTSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZU0uc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VNLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZU0ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlTSwgMzgpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlTiA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZU4uc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VOLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZU4ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlQSwgMzkpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlTyA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZU8uc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VPLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZU8ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlTywgNDApO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlUCA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVAuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VQLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVAub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlUCwgNDEpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlUSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVEuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VRLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlUSwgNDIpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlUiA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVIuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VSLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlUiwgNDMpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlUyA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVMuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VTLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVMub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlUywgNDQpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlVCA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVQuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VULnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVQub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlVCwgNDUpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlVSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVUuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VVLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVUub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlVSwgNDYpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlViA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVYuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VWLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVYub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlViwgNDcpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlVyA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVcuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VXLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVcub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlVywgNDgpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlWCA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVguc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VYLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVgub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlWCwgNDkpO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlWSA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVkuc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VZLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVkub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlWSwgNTApO1xyXG4gIH1cclxuICBcclxuICB2YXIgdXBwZXJjYXNlWiA9IG5ldyBJbWFnZSgpO1xyXG4gIHVwcGVyY2FzZVouc3JjID0gXCJmaXhlZEltYWdlcy9VcHBlcmNhc2VaLnBuZ1wiO1xyXG4gIHVwcGVyY2FzZVoub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIodXBwZXJjYXNlWiwgNTEpO1xyXG4gIH1cclxuICBcclxuICB2YXIgZXhjbGFtYXRpb24gPSBuZXcgSW1hZ2UoKTtcclxuICBleGNsYW1hdGlvbi5zcmMgPSBcImZpeGVkSW1hZ2VzL0V4Y2xhbWF0aW9uUG9pbnQucG5nXCI7XHJcbiAgZXhjbGFtYXRpb24ub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW5kZXIoZXhjbGFtYXRpb24sIDUyKTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHNwYWNlID0gbmV3IEltYWdlKCk7XHJcbiAgc3BhY2Uuc3JjID0gXCJmaXhlZEltYWdlcy9TcGFjZS5wbmdcIjtcclxuICBzcGFjZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJlbmRlcihzcGFjZSwgNTMpO1xyXG4gIH1cclxuICBcclxuICAvL09uZSBvZiB0aGUgZmlyc3QgbWFqb3IgZGlmZmVyZW5jZXMgaXMgdGhlIGluY2x1c2lvbiBvZiBhbiBpbmRleCBwYXJhbWV0ZXIsXHJcbiAgLy93aGljaCB3aWxsIGJpbmQgdGhlIHRleHR1cmUgdG8gdGhlIHByb3BlciBsb2NhdGlvbiBpbiB0aGUgYXJyYXlcclxuICAgIFxyXG4gIC8vZnVuY3Rpb24gcmVuZGVyKGltYWdlKSB7XHJcbiAgZnVuY3Rpb24gcmVuZGVyKGltYWdlLCBpbmRleCkge1xyXG4gXHJcbiAgICAvLyBDcmVhdGUgYSB0ZXh0dXJlLlxyXG4gICAgLy92YXIgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmVzW2luZGV4XSk7XHJcbiBcclxuICAgIC8vIFNldCB0aGUgcGFyYW1ldGVycyBzbyB3ZSBjYW4gcmVuZGVyIGFueSBzaXplIGltYWdlLlxyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuIFxyXG4gICAgLy8gVXBsb2FkIHRoZSBpbWFnZSBpbnRvIHRoZSB0ZXh0dXJlLlxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBpbWFnZSk7XHJcbiAgICBcclxuICAgIC8vVGhlIHJlc3Qgb2YgdGhlIHJlbmRlciBmdW5jdGlvbiB0YWtlbiBpc24ndCB1c2VkLCBzaW5jZSB0aGUgdGV4dHVyZSBoYXMgYWxyZWFkeSBiZWVuIGJvdW5kXHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdTY2VuZSk7XHJcblxyXG4gIC8vIERyYXcgdGhlIHNjZW5lLlxyXG4gIGZ1bmN0aW9uIGRyYXdTY2VuZSh0aW1lOiBudW1iZXIpIHtcclxuICAgIHRpbWUgKj0gMC4wMDE7IFxyXG4gICBcclxuICAgIC8vIG1lYXN1cmUgdGltZSB0YWtlbiBmb3IgdGhlIGxpdHRsZSBzdGF0cyBtZXRlclxyXG4gICAgc3RhdHMuYmVnaW4oKTtcclxuXHJcbiAgICAvLyBpZiB0aGUgd2luZG93IGNoYW5nZWQgc2l6ZSwgcmVzZXQgdGhlIFdlYkdMIGNhbnZhcyBzaXplIHRvIG1hdGNoLiAgVGhlIGRpc3BsYXllZCBzaXplIG9mIHRoZSBjYW52YXNcclxuICAgIC8vIChkZXRlcm1pbmVkIGJ5IHdpbmRvdyBzaXplLCBsYXlvdXQsIGFuZCB5b3VyIENTUykgaXMgc2VwYXJhdGUgZnJvbSB0aGUgc2l6ZSBvZiB0aGUgV2ViR0wgcmVuZGVyIGJ1ZmZlcnMsIFxyXG4gICAgLy8gd2hpY2ggeW91IGNhbiBjb250cm9sIGJ5IHNldHRpbmcgY2FudmFzLndpZHRoIGFuZCBjYW52YXMuaGVpZ2h0XHJcbiAgICByZXNpemVDYW52YXNUb0Rpc3BsYXlTaXplKGNhbnZhcyk7XHJcblxyXG4gICAgLy8gU2V0IHRoZSB2aWV3cG9ydCB0byBtYXRjaCB0aGUgY2FudmFzXHJcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgXHJcbiAgICAvLyBDbGVhciB0aGUgY2FudmFzIEFORCB0aGUgZGVwdGggYnVmZmVyLlxyXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIHByb2plY3Rpb24gbWF0cml4XHJcbiAgICB2YXIgYXNwZWN0ID0gY2FudmFzLmNsaWVudFdpZHRoIC8gY2FudmFzLmNsaWVudEhlaWdodDtcclxuICAgIG1hdDQucGVyc3BlY3RpdmUocHJvamVjdGlvbk1hdHJpeCxmaWVsZE9mVmlld1JhZGlhbnMsIGFzcGVjdCwgMSwgMjAwMCk7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgY2FtZXJhJ3MgbWF0cml4IHVzaW5nIGxvb2sgYXQuXHJcbiAgICB2YXIgY2FtZXJhUG9zaXRpb24gPSBbMCwgMCwgLTIwMF07XHJcbiAgICB2YXIgdGFyZ2V0ID0gWzAsIDAsIDBdO1xyXG4gICAgdmFyIHVwID0gWzAsIDEsIDBdO1xyXG4gICAgdmFyIGNhbWVyYU1hdHJpeCA9IG1hdDQubG9va0F0KHVuaWZvcm1zVGhhdEFyZVRoZVNhbWVGb3JBbGxPYmplY3RzLnVfdmlld0ludmVyc2UsIGNhbWVyYVBvc2l0aW9uLCB0YXJnZXQsIHVwKTtcclxuICAgIFxyXG4gICAgLy9HZXQgdGhlIHdvcmxkIGhlaWdodCBhbmQgd2lkdGgsIHVzaW5nIHRoZSBjYW1lcmEgcG9zaXRpb24sIHRoZSBmaWVsZCBvZiB2aWV3LCBhbmQgdGhlIGFzcGVjdCByYXRpb1xyXG4gICAgd29ybGRIZWlnaHQgPSBNYXRoLmFicyhjYW1lcmFQb3NpdGlvblsyXSkgKiBNYXRoLnRhbihmaWVsZE9mVmlld1JhZGlhbnMgLyAyKSAqIDI7XHJcbiAgICB3b3JsZFdpZHRoID0gd29ybGRIZWlnaHQgKiBhc3BlY3Q7XHJcbiAgICBcclxuICAgIC8vIE1ha2UgYSB2aWV3IG1hdHJpeCBmcm9tIHRoZSBjYW1lcmEgbWF0cml4LlxyXG4gICAgbWF0NC5pbnZlcnQodmlld01hdHJpeCwgY2FtZXJhTWF0cml4KTtcclxuICAgIFxyXG4gICAgLy8gdGVsbCBXZWJHTCB0byB1c2Ugb3VyIHNoYWRlciBwcm9ncmFtICh3aWxsIG5lZWQgdG8gY2hhbmdlIHRoaXMpXHJcbiAgICBnbC51c2VQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgXHJcbiAgICAvL0NoZWNrIHRvIHNlZSBpZiB3ZSBoYXZlIGFueSBsZXR0ZXJzIGF0IGFsbFxyXG4gICAgaWYgKGxldHRlcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICBcclxuICAgICAgdmFyIGk7XHJcbiAgICAgIFxyXG4gICAgICAvL0dvIHRocm91Z2ggYWxsIHRoZSBsZXR0ZXJzXHJcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZXR0ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBcclxuICAgICAgICAvLyBTZXR1cCBhbGwgdGhlIG5lZWRlZCBhdHRyaWJ1dGVzIGFuZCBidWZmZXJzLiAgXHJcbiAgICAgICAgc2V0QnVmZmVyc0FuZEF0dHJpYnV0ZXMoZ2wsIGF0dHJpYlNldHRlcnMsIGJ1ZmZlckluZm8pO1xyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHVuaWZvcm1zIHRoYXQgYXJlIHRoZSBzYW1lIGZvciBhbGwgb2JqZWN0cy4gIFVubGlrZSB0aGUgYXR0cmlidXRlcywgZWFjaCB1bmlmb3JtIHNldHRlclxyXG4gICAgICAgIC8vIGlzIGRpZmZlcmVudCwgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHRoZSB1bmlmb3JtIHZhcmlhYmxlLiAgTG9vayBpbiB3ZWJnbC11dGlsLmpzIGZvciB0aGVcclxuICAgICAgICAvLyBpbXBsZW1lbnRhdGlvbiBvZiAgc2V0VW5pZm9ybXMgdG8gc2VlIHRoZSBkZXRhaWxzIGZvciBzcGVjaWZpYyB0eXBlcyAgICAgICBcclxuICAgICAgICBzZXRVbmlmb3Jtcyh1bmlmb3JtU2V0dGVycywgdW5pZm9ybXNUaGF0QXJlVGhlU2FtZUZvckFsbE9iamVjdHMpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbWc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG47XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9DaGVjayBpZiB0aGUga2V5Y29kZSBpcyBvZiBvbmUgb2YgdGhlIGxldHRlcnNcclxuICAgICAgICBpZiAobGV0dGVyc1tpXS5rZXljb2RlID49IDY1ICYmIGxldHRlcnNbaV0ua2V5Y29kZSA8PSA5MCkge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBpZiAobGV0dGVyc1tpXS5zaGlmdCA9PSAwKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL0lmIG5vdCBzaGlmdGVkLCB0aGVuIHNpbXBseSByZWR1Y2UgdG8gZ2V0IHRoZSBwcm9wZXIgcG9zaXRpb25cclxuICAgICAgICAgICAgbiA9IGxldHRlcnNbaV0ua2V5Y29kZSAtIDY1O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL0lmIHNoaWZ0ZWQsIHRoZW4gYWRkIDI2IHRvIGNvcnJlY3RcclxuICAgICAgICAgICAgbiA9IGxldHRlcnNbaV0ua2V5Y29kZSAtIDY1ICsgMjY7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgfSBlbHNlIGlmIChsZXR0ZXJzW2ldLmtleWNvZGUgPT0gNDkgJiYgbGV0dGVyc1tpXS5zaGlmdCA9PSAxKSB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vSWYgdGhlc2UgY29uZGl0aW9ucyBhcmUgc2F0aXNpZmVkLCB0aGVuIHdlIGhhdmUgYW4gZXhjbGFtYXRpb24gcG9pbnRcclxuICAgICAgICAgIC8vKHRoZXJlIHNob3VsZG4ndCBiZSBhIGNhc2Ugd2hlcmUgb25lIGlzIGJ1dCB0aGUgb3RoZXIgaXNuJ3QpXHJcbiAgICAgICAgICBuID0gNTI7XHJcbiAgICAgICAgICBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL090aGVyd2lzZSBpdCdzIGEgc3BhY2UgKGhlbHBzIHdpdGggZm9yY2Utc2V0KVxyXG4gICAgICAgICAgbiA9IDUzO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgICBcclxuICAgICAgICAvL0dldCB0aGUgcmlnaHQgdGV4dHVyZSBcclxuICAgICAgICBpbWcgPSB0ZXh0dXJlc1tuXTtcclxuICAgICAgICBcclxuICAgICAgICAvL1NldCBpdCB0byB1X2ltYWdlXHJcbiAgICAgICAgb2JqZWN0U3RhdGUubWF0ZXJpYWxVbmlmb3Jtcy51X2ltYWdlID0gaW1nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vU3RhcnQgd2l0aCB0aHRlIGlkZW50aXR5IG1hdHJpeFxyXG4gICAgICAgIG1hdDQuaWRlbnRpdHkobWF0cml4KTtcclxuICAgICAgICBcclxuICAgICAgICAvL1N0YXJ0IGJ5IHRyYW5zbGF0aW5nIHRvIHRoZSBwcm9wZXIgY29vcmRpbmF0ZXNcclxuICAgICAgICBtYXQ0LnRyYW5zbGF0ZShtYXRyaXgsIG1hdHJpeCwgW2xldHRlcnNbaV0ueCwgbGV0dGVyc1tpXS55LCAwXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9Sb3RhdGUgYWxvbmcgWiBmb3IgdGlsdGluZ1xyXG4gICAgICAgIC8vVGhpcyBpZiBzdGF0ZW1lbnQgbGV0cyBpdCBhbHRlcm5hdGUgYmFjayBhbmQgZm9ydGggYmV0d2VlbiBlYWNoIGRpcmVjdGlvblxyXG4gICAgICAgIGlmIChpICUgMiA9PSAwKSB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIG1hdDQucm90YXRlWihtYXRyaXgsIG1hdHJpeCwgZGVnVG9SYWQobGV0dGVyc1tpXS50aWx0KSk7XHJcbiAgICAgICAgICBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBtYXQ0LnJvdGF0ZVoobWF0cml4LCBtYXRyaXgsIGRlZ1RvUmFkKC1sZXR0ZXJzW2ldLnRpbHQpKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL0lmIG1vdXNDbGlja1ZlY3RvciBpcyBkZWZpbmVkLCB0aGVuIHRoZXJlIGhhcyBiZWVuIGEgbW91c2UgY2xpY2tcclxuICAgICAgICBpZiAobW91c2VDbGlja1ZlY3RvciAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy9HZXQgdGhlIGxldHRlcidzIHggYW5kIHlcclxuICAgICAgICAgIHZhciB4ID0gbGV0dGVyc1tpXS54O1xyXG4gICAgICAgICAgdmFyIHkgPSBsZXR0ZXJzW2ldLnk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vR2V0IHRoZSBtb3VzZSB4IGFuZCB5XHJcbiAgICAgICAgICB2YXIgYSA9IG1vdXNlQ2xpY2tWZWN0b3JbMF07XHJcbiAgICAgICAgICB2YXIgYiA9IG1vdXNlQ2xpY2tWZWN0b3JbMV07XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vVXNlIHRoaXMgZm9yIGNyZWF0aW5nIGRpZmZlcmVudCBkZWdyZWVzIG9mIHNwaW5cclxuICAgICAgICAgIHZhciBpbnQgPSA1ICogc2NhbGVGYWN0b3I7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vSWYgdGhlIG1vdXNlIGlzIHdpdGhpbiB0aGVzZSBsaW1pdHMsIHRoZW4gd2UndmUgc3VjY2Vzc2Z1bGx5IGNsaWNrZWQgb24gdGhlIG9iamVjdFxyXG4gICAgICAgICAgaWYgKGEgPj0gKHggLSBpbnQpICYmIGEgPD0gKHggKyBpbnQpICYmIGIgPj0gKHkgLSBpbnQpICYmIGIgPD0gKHkgKyBpbnQpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL0VzdGFibGlzaCB0aGF0IHdlJ3JlIHNwaW5uaW5nXHJcbiAgICAgICAgICAgIGxldHRlcnNbaV0uaXNTcGlubmluZyA9IDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL1ZhbHVlIHRvIHNwbGl0IGJldHdlZW4gY2VudGVyIGFuZCBlZGdlXHJcbiAgICAgICAgICAgIHZhciBoYWxmID0gaW50IC8gMjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vU2V0IGRlZ3JlZXNcclxuICAgICAgICAgICAgaWYgKGEgPj0gKHggLSBoYWxmKSAmJiBhIDw9ICh4ICsgaGFsZikpIHtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICBsZXR0ZXJzW2ldLmRlZ3JlZSA9IDI7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgbGV0dGVyc1tpXS5kZWdyZWUgPSAxO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL01ha2UgdGhlIG1vdXNlIHZlY3RvciB1bmRlZmluZWQgYWdhaW4sIHNvIHRoYXQgdGhlIHNwaW5uaW5nIGlzIG5vdCBoaW5nZWQgb24gY2xpY2tpbmcgc29tZXRoaW5nIGVsc2VcclxuICAgICAgICAgICAgbW91c2VDbGlja1ZlY3RvciA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9Qcm9jZWVkIGlmIHNwaW5uaW5nXHJcbiAgICAgICAgaWYgKGxldHRlcnNbaV0uaXNTcGlubmluZyA9PSAxKSB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vR2V0IGFyYml0cmFyaWx5LXNlbGVjdGVkIHNwaW5zXHJcbiAgICAgICAgICB2YXIgc3BpbnM7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChsZXR0ZXJzW2ldLmRlZ3JlZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBzcGlucyA9IDI7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHNwaW5zID0gNDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vSmFua3kgd2F5IG9mIGNvbnRyb2xsaW5nIHRpbWUgc3B1blxyXG4gICAgICAgICAgaWYgKGxldHRlcnNbaV0udGltZSA8IHNwaW5zKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL0phbmt5IHdheSBvZiBjcmVhdGluZyBkZWNlbGVyYXRpb25cclxuICAgICAgICAgICAgaWYgKGxldHRlcnNbaV0udGltZSA8IGxldHRlcnNbaV0uZGVncmVlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIG1hdDQucm90YXRlWShtYXRyaXgsIG1hdHJpeCwgZGVnVG9SYWQoMzYwICogKGxldHRlcnNbaV0udGltZSAvIGxldHRlcnNbaV0uZGVncmVlKSkpO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxldHRlcnNbaV0udGltZSA8IDIgKiBsZXR0ZXJzW2ldLmRlZ3JlZSkge1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIG1hdDQucm90YXRlWShtYXRyaXgsIG1hdHJpeCwgZGVnVG9SYWQoKDM2MCAqIChsZXR0ZXJzW2ldLnRpbWUgLyAobGV0dGVyc1tpXS5kZWdyZWUgKiAyKSkpICsgMTgwKSk7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgbWF0NC5yb3RhdGVZKG1hdHJpeCwgbWF0cml4LCBkZWdUb1JhZCgzNjAgKiAoKGxldHRlcnNbaV0udGltZSAvIChsZXR0ZXJzW2ldLmRlZ3JlZSAqIDQpKSkpKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9JbmNyZW1lbnQgdGltZVxyXG4gICAgICAgICAgICBsZXR0ZXJzW2ldLnRpbWUgKz0gMC4wMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9JZiB3ZSdyZSBkb25lIHNwaW5uaW5nLCB0aGVuIHNldCBhbGwgdGhlc2UgdmFsdWVzIGJhY2sgdG8gMFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbGV0dGVyc1tpXS50aW1lID0gMDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldHRlcnNbaV0uaXNTcGlubmluZyA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXR0ZXJzW2ldLmRlZ3JlZSA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhZGQgYSB0cmFuc2xhdGUgYW5kIHNjYWxlIHRvIHRoZSBvYmplY3QgV29ybGQgeGZvcm0sIHNvIHdlIGhhdmU6ICBSICogVCAqIFNcclxuICAgICAgICBtYXQ0LnRyYW5zbGF0ZShtYXRyaXgsIG1hdHJpeCwgWy1jZW50ZXJbMF0qc2NhbGVGYWN0b3IsIC1jZW50ZXJbMV0qc2NhbGVGYWN0b3IsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtY2VudGVyWzJdKnNjYWxlRmFjdG9yXSk7XHJcbiAgICAgICAgbWF0NC5zY2FsZShtYXRyaXgsIG1hdHJpeCwgW3NjYWxlRmFjdG9yLCBzY2FsZUZhY3Rvciwgc2NhbGVGYWN0b3JdKTtcclxuICAgICAgICBtYXQ0LmNvcHkodW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0LnVfd29ybGQsIG1hdHJpeCk7XHJcbiAgICBcclxuICAgICAgICAvLyBnZXQgcHJvaiAqIHZpZXcgKiB3b3JsZFxyXG4gICAgICAgIG1hdDQubXVsdGlwbHkobWF0cml4LCB2aWV3TWF0cml4LCB1bmlmb3Jtc1RoYXRBcmVDb21wdXRlZEZvckVhY2hPYmplY3QudV93b3JsZCk7XHJcbiAgICAgICAgbWF0NC5tdWx0aXBseSh1bmlmb3Jtc1RoYXRBcmVDb21wdXRlZEZvckVhY2hPYmplY3QudV93b3JsZFZpZXdQcm9qZWN0aW9uLCBwcm9qZWN0aW9uTWF0cml4LCBtYXRyaXgpO1xyXG5cclxuICAgICAgICAvLyBnZXQgd29ybGRJbnZUcmFuc3Bvc2UuICBGb3IgYW4gZXhwbGFpbmF0aW9uIG9mIHdoeSB3ZSBuZWVkIHRoaXMsIGZvciBmaXhpbmcgdGhlIG5vcm1hbHMsIHNlZVxyXG4gICAgICAgIC8vIGh0dHA6Ly93d3cudW5rbm93bnJvYWQuY29tL3J0Zm0vZ3JhcGhpY3MvcnRfbm9ybWFscy5odG1sXHJcbiAgICAgICAgbWF0NC50cmFuc3Bvc2UodW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0LnVfd29ybGRJbnZlcnNlVHJhbnNwb3NlLCBcclxuICAgICAgICAgICAgICAgICAgIG1hdDQuaW52ZXJ0KG1hdHJpeCwgdW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0LnVfd29ybGQpKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB1bmlmb3JtcyB3ZSBqdXN0IGNvbXB1dGVkXHJcbiAgICAgICAgc2V0VW5pZm9ybXModW5pZm9ybVNldHRlcnMsIHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdCk7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdW5pZm9ybXMgdGhhdCBhcmUgc3BlY2lmaWMgdG8gdGhlIHRoaXMgb2JqZWN0LlxyXG4gICAgICAgIHNldFVuaWZvcm1zKHVuaWZvcm1TZXR0ZXJzLCBvYmplY3RTdGF0ZS5tYXRlcmlhbFVuaWZvcm1zKTtcclxuXHJcbiAgICAgICAgLy8gRHJhdyB0aGUgZ2VvbWV0cnkuICAgRXZlcnl0aGluZyBpcyBrZXllZCB0byB0aGUgXCJcIlxyXG4gICAgICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsIGJ1ZmZlckluZm8ubnVtRWxlbWVudHMsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuICAgICAgICBcclxuICAgICAgICAvL1RoaXMgYXJyYXkgZG9lc24ndCBuZWNlc3NhcmlseSBuZWVkIHRvIGJlIGVuYWJsZWQsIGJ1dCBpdCdzIGdvb2QganVzdCBpbiBjYXNlXHJcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpKTtcclxuICAgICAgICBcclxuICAgICAgICAvL1RoaXMgY29kZSBmb3IgZHJhd2luZyBsaW5lcyBpcyB0YWtlbiBmcm9tIGhlcmU6XHJcbiAgICAgICAgLy9odHRwOi8vd3d3LmNvZGVwcm9qZWN0LmNvbS9BcnRpY2xlcy81OTQyMjIvTGluZXBsdXNpbnBsdXNXZWJHTHBsdXNhbmRwbHVzd2h5cGx1c3lvdXBsdXNnb25uYXBcclxuICAgICAgICAvLzUuMCBzZWVtcyB0byBiZSB0aGUgbWFnaWMgbnVtYmVyLCBib3RoIGZvciBrZWVwaW5nIHRoZSBsaW5lIGNlbnRlcmVkIGFuZFxyXG4gICAgICAgIC8vZm9yIGhhdmluZyB0aGUgbGVhc3Qgbm90aWNlYWJsZSBlZmZlY3QgZHVyaW5nIHktcm90YXRpb25cclxuICAgICAgICB2YXIgdnR4ID0gbmV3IEZsb2F0MzJBcnJheShcclxuICAgICAgICAgICAgICAgIFs1LjAsIDAuMCwgMC4wLCBcclxuICAgICAgICAgICAgICAgICA1LjAsIHdvcmxkSGVpZ2h0LCAwLjBdXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgdmFyIGlkeCA9IG5ldyBVaW50MTZBcnJheShbMCwgMV0pO1xyXG4gICAgICAgIGluaXRCdWZmZXJzKHZ0eCwgaWR4KTtcclxuICAgICAgICBnbC5saW5lV2lkdGgoMS4wKTtcclxuICAgICAgICAvL2dsLnVuaWZvcm00ZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ1X2xpbmVDb2xvclwiKSwgMCwgMCwgMCwgMSk7XHJcbiAgICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsLkxJTkVTLCAyLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UaGUgYXJyYXkgTVVTVCBiZSBkaXNhYmxlZCBzbyB0aGF0IHRoZSBvdGhlciBidWZmZXJzIGNhbiBiZSB1c2VkIGZvciBvdGhlciBzcXVhcmVzXHJcbiAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9wb3NpdGlvblwiKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZnVuY3Rpb24gaW5pdEJ1ZmZlcihnbEVMRU1FTlRfQVJSQVlfQlVGRkVSLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBidWYgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbEVMRU1FTlRfQVJSQVlfQlVGRkVSLCBidWYpO1xyXG4gICAgICAgICAgICBnbC5idWZmZXJEYXRhKGdsRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1ZjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGluaXRCdWZmZXJzKHZ0eCwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciB2YnVmID0gaW5pdEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZ0eCk7XHJcbiAgICAgICAgICAgIHZhciBpYnVmID0gaW5pdEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaWR4KTtcclxuICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcG9zaXRpb25cIiksIDMsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0YXRzIG1ldGVyXHJcbiAgICBzdGF0cy5lbmQoKTtcclxuXHJcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd1NjZW5lKTtcclxuICB9XHJcbiAgXHJcbn1cclxuXHJcbi8vVGhlIGNsYXNzIGZvciBlYWNoIGxldHRlclxyXG5jbGFzcyBMZXR0ZXIge1xyXG4gIFxyXG4gIGlzU3Bpbm5pbmc6ICAgbnVtYmVyOyAgICAgICAvL1N0YXRlcyB3aGV0aGVyIG9yIG5vdCBpdCdzIGN1cnJlbnRseSBzcGlubmluZ1xyXG4gIGRlZ3JlZTogICAgICAgbnVtYmVyOyAgICAgICAvL1N0YXRlcyB3aGljaCBkZWdyZWUgaXQncyBzcGlubmluZyAoMCBpZiBub3QpXHJcbiAgdGltZTogICAgICAgICBudW1iZXI7ICAgICAgIC8vU2F2ZXMgdGhlIHRpbWUgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHNwaW5zICgwIGlmIG5vdClcclxuICB4OiAgICAgICAgICAgIG51bWJlcjsgICAgICAgLy9YLWNvb3JkaW5hdGVcclxuICB5OiAgICAgICAgICAgIG51bWJlcjsgICAgICAgLy9ZLWNvb3JkaW5hdGVcclxuICBzaGlmdDogICAgICAgIG51bWJlcjsgICAgICAgLy9GbGFnIGZvciB3aGV0aGVyIG9yIG5vdCBzaGlmdCB3YXMgaGVsZFxyXG4gIGtleWNvZGU6ICAgICAgbnVtYmVyOyAgICAgICAvL0ludGVnZXIgY29kZSBjb3JyZXNwb25kaW5nIHRvIGEga2V5XHJcbiAgdGlsdDogICAgICAgICBudW1iZXI7ICAgICAgIC8vRGVncmVlIG9mIHRpbHRpbmdcclxuICBcclxuICBjb25zdHJ1Y3RvcihzaGlmdCwga2V5Y29kZSkge1xyXG4gICAgXHJcbiAgICAvL1NldCBzaGlmdCBhbmQga2V5Y29kZSBiYXNlZCBvbiB0aGUgcGFyYW1ldGVyc1xyXG4gICAgdGhpcy5zaGlmdCA9IHNoaWZ0O1xyXG4gICAgdGhpcy5rZXljb2RlID0ga2V5Y29kZTtcclxuICAgIFxyXG4gICAgLy9TZXQgdGhlIGZvbGxvd2luZyB0byAwXHJcbiAgICB0aGlzLmlzU3Bpbm5pbmcgPSAwO1xyXG4gICAgdGhpcy5kZWdyZWUgPSAwO1xyXG4gICAgdGhpcy50aW1lID0gMDtcclxuICAgIFxyXG4gICAgLy9UaWx0IGlzIGEgcmFuZG9tZSB2YWx1ZSBmcm9tIG5vdGhpbmcgdG8gNSBkZWdyZWVzXHJcbiAgICAvL1N1Y2ggYSBzbWFsbCByYW5nZSBoZWxwcyBtYWtlIHBvc3NpYmxlIGZ1bm55IGJ1c2luZXNzIGZyb20gcm90YXRpb24gbGVzcyBub3RpY2VhYmxlXHJcbiAgICB0aGlzLnRpbHQgPSByYW5kKDAsIDUpO1xyXG4gICAgXHJcbiAgICAvL1N0YXJ0IG9mZiB3aXRoIHggYXMgMFxyXG4gICAgdGhpcy54ID0gMDtcclxuICAgIFxyXG4gICAgLy9TZXQgeSB0byBhIHJhbmRvbSB2YXJpYWJsZSB3aXRoaW4gdGhlIGNlbnRlciBwYXJ0IG9mIHRoZSB3b3JsZFxyXG4gICAgdGhpcy55ID0gcmFuZCgtKHdvcmxkSGVpZ2h0ICogMC4yNSksIHdvcmxkSGVpZ2h0ICogMC4yNSk7XHJcbiAgICBcclxuICB9XHJcblxyXG59XHJcblxyXG4vL1RoaXMgaGVscGVyIGZ1bmN0aW9uIHNldHMgdXAgdGhlIHggY29vcmRpbmF0ZSBmb3IgZWFjaCBsZXR0ZXJcclxuLy9UaGlzIGlzIGNhbGxlZCBldmVyeSB0aW1lIGEgbmV3IGxldHRlciBpcyBhZGRlZCwgc2luY2UgdGhlIHggdmFsdWVzIG5lZWQgdG8gYmUgdXBkYXRlZFxyXG4vL3RvIGNyZWF0ZSB0aGUgZGVzaXJlZCBwb3NpdGlvbmluZ1xyXG52YXIgc2V0WCA9IGZ1bmN0aW9uKGk6IG51bWJlcikge1xyXG4gICAgXHJcbiAgICBsZXR0ZXJzW2ldLnggPSAtKCgod29ybGRXaWR0aCAvIChsZXR0ZXJzLmxlbmd0aCArIDEpKSAqIChpICsgMSkpIC0gKHdvcmxkV2lkdGggLyAyKSk7XHJcbiAgICBcclxuIH0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
