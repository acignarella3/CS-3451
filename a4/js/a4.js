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
    ////////////////////////////////////////////////////////////////////////////////////////////
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
    ////////////////////////////////////////////////////////////////////////////////////////////
    // get some of our canvas elements that we need
    var canvas = document.getElementById("webgl");
    //This is a global variable for the programs array
    //It starts off at 0, and it won't come back to 0 ever, not that we care
    var shader = 0;
    //This is exclusively for the image rendering, ensuring that the images only render once
    var stop = 0;
    //For every window, if the window is clicked, simply change the global variable to the appropriate value
    window["onEffect1"] = function () {
        console.log("install effect1!");
        //////////////
        ///////// YOUR CODE HERE TO cause the program to use your first shader effect
        ///////// (you can probably just use some sort of global variable to indicate which effect)
        //////////////
        shader = 1;
    };
    window["onEffect2"] = function () {
        console.log("install effect2!");
        //////////////
        ///////// YOUR CODE HERE TO cause the program to use your second shader effect
        ///////// (you can probably just use some sort of global variable to indicate which effect)
        //////////////
        shader = 2;
    };
    window["onEffect3"] = function () {
        console.log("install effect3!");
        //////////////
        ///////// YOUR CODE HERE TO cause the program to use your third shader effect
        ///////// (you can probably just use some sort of global variable to indicate which effect)
        //////////////
        shader = 3;
        stop = 1;
    };
    window["onEffect4"] = function () {
        console.log("install effect4!");
        //////////////
        ///////// YOUR CODE HERE TO cause the program to use your fourth shader effect
        ///////// (you can probably just use some sort of global variable to indicate which effect)
        //////////////
        shader = 4;
    };
    ////////////////////////////////////////////////////////////////////////////////////////////
    // some simple interaction using the mouse.
    // we are going to get small motion offsets of the mouse, and use these to rotate the object
    //
    // our offset() function from assignment 0, to give us a good mouse position in the canvas 
    function offset(e) {
        e = e || window.event;
        var target = e.target || e.srcElement, rect = target.getBoundingClientRect(), offsetX = e.clientX - rect.left, offsetY = e.clientY - rect.top;
        return vec2.fromValues(offsetX, offsetY);
    }
    var mouseStart = undefined; // previous mouse position
    var mouseDelta = undefined; // the amount the mouse has moved
    var mouseAngles = vec2.create(); // angle offset corresponding to mouse movement
    // start things off with a down press
    canvas.onmousedown = function (ev) {
        mouseStart = offset(ev);
        mouseDelta = vec2.create(); // initialize to 0,0
        vec2.set(mouseAngles, 0, 0);
    };
    // stop things with a mouse release
    canvas.onmouseup = function (ev) {
        if (mouseStart != undefined) {
            var clickEnd = offset(ev);
            vec2.sub(mouseDelta, clickEnd, mouseStart); // delta = end - start
            vec2.scale(mouseAngles, mouseDelta, 10 / canvas.height);
            // now toss the two values since the mouse is up
            mouseDelta = undefined;
            mouseStart = undefined;
        }
    };
    // if we're moving and the mouse is down        
    canvas.onmousemove = function (ev) {
        if (mouseStart != undefined) {
            var m = offset(ev);
            vec2.sub(mouseDelta, m, mouseStart); // delta = mouse - start 
            vec2.copy(mouseStart, m); // start becomes current position
            vec2.scale(mouseAngles, mouseDelta, 10 / canvas.height);
        }
    };
    // stop things if you move out of the window
    canvas.onmouseout = function (ev) {
        if (mouseStart != undefined) {
            vec2.set(mouseAngles, 0, 0);
            mouseDelta = undefined;
            mouseStart = undefined;
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
        loader.loadFiles(['shaders/a3-shader.vert', 'shaders/a3-shader.frag', 'shaders/a4-shader1.vert', 'shaders/a4-shader1.frag',
            'shaders/a4-shader2.vert', 'shaders/a4-shader2.frag', 'shaders/a4-shader3.vert', 'shaders/a4-shader3.frag',
            'shaders/a4-shader4.vert', 'shaders/a4-shader4.frag'], function (shaderText) {
            //var program = createProgramFromSources(gl, shaderText);
            //Set each pair as a separate string
            var string0 = [shaderText[0], shaderText[1]];
            var string1 = [shaderText[2], shaderText[3]];
            var string2 = [shaderText[4], shaderText[5]];
            var string3 = [shaderText[6], shaderText[7]];
            var string4 = [shaderText[8], shaderText[9]];
            //Use the strings to create programs
            var program0 = createProgramFromSources(gl, string0);
            var program1 = createProgramFromSources(gl, string1);
            var program2 = createProgramFromSources(gl, string2);
            var program3 = createProgramFromSources(gl, string3);
            var program4 = createProgramFromSources(gl, string4);
            //Set all the programs into a single array
            var programs = [program0, program1, program2, program3, program4];
            //Call main
            main(gl, programs);
        }, function (url) {
            alert('Shader failed to download "' + url + '"');
        });
    }
    ////////////////////////////////////////////////////////////////////////////////////////////
    // webGL is set up, and our Shader program has been created.  Finish setting up our webGL application       
    function main(gl, programs) {
        // use the webgl-utils library to create setters for all the uniforms and attributes in our shaders.
        // It enumerates all of the uniforms and attributes in the program, and creates utility functions to 
        // allow "setUniforms" and "setAttributes" (below) to set the shader variables from a javascript object. 
        // The objects have a key for each uniform or attribute, and a value containing the parameters for the
        // setter function
        //var uniformSetters = createUniformSetters(gl, program);
        //var attribSetters  = createAttributeSetters(gl, program);
        /*var uniformSetters = [];
        var attribSetters = [];
        
        var i;
        
        for (i = 0; i < 5; i++) {
          
          uniformSetters[i] = createUniformSetters(gl, programs[i]);
          attribSetters[i] = createAttributeSetters(gl, programs[i]);
          
        }*/
        // //Go between x and y coordinates for subdivision
        // var x;
        // var y;
        // //Store new array values
        // var newPosition = [];
        // var newTexCoord = [];
        // var newNormals = [];
        // var newIndices = [];
        // //Set variable for how much we want to divide by
        // var division = 4;
        // //Since we start with 10, use that to determine increments
        // var inc = 10 / division;
        // //Go for all new x and y values
        // for (x = 0; x <= division; x++) {
        //   for (y = 0; y <= division; y++) {
        //     //Use increment to modify x and y
        //     //Hard-set z to 0
        //     newPosition.push(y * inc);
        //     newPosition.push(x * inc);
        //     newPosition.push(0);
        //     //Since texcoord is 0..1, divide by 10 to normalize
        //     newTexCoord.push((y * inc) / 10);
        //     newTexCoord.push((x * inc) / 10);
        //     //Hard-set (0, 0, -1), like in the given code
        //     newNormals.push(0);
        //     newNormals.push(0);
        //     newNormals.push(-1);
        //   }
        // }
        // var i;
        // console.log(division * division);
        // //For whatever division value, add 1 and square it to get the total number of indices
        // for (i = 0; i <= division * division; i++) {
        //   //(division + 1) sets the edge
        //   //If i mod this equals division, then we have reached the edge, and don't want to do anything
        //   if (i % (division + 1) < division) {
        //     console.log(i % (division + 1));
        //     //Num will be what we use to snake around everywhere
        //     var num = i;
        //     //Push num, the one after num, and the one above num
        //     newIndices.push(num);
        //     newIndices.push(num + 1);
        //     num = num + division + 1;
        //     newIndices.push(num);
        //     //Now we're right above where we started
        //     //Push this, the one next to it, and the one right below
        //     newIndices.push(num);
        //     newIndices.push(num + 1);
        //     num = num - division;
        //     newIndices.push(num);
        //   }
        // }
        //The code below is copied directly from the code of the tombstone example, with
        //the appropriate modifications. See here:
        //https://github.com/mrdoob/three.js/blob/master/src/extras/geometries/PlaneBufferGeometry.js
        //The above commented-out code consists of my attempt to create my own subdivision code.
        //It would actually work successfully for a division of 2, but beyond that it couldn't calculate
        //the indices properly, creating what I called a "chipped tooth".
        var width_half = 10 / 2;
        var height_half = 10 / 2;
        var gridX = Math.floor(100) || 1;
        var gridY = Math.floor(100) || 1;
        var gridX1 = gridX + 1;
        var gridY1 = gridY + 1;
        var segment_width = 10 / gridX;
        var segment_height = 10 / gridY;
        var vertices = new Float32Array(gridX1 * gridY1 * 3);
        var normals = new Float32Array(gridX1 * gridY1 * 3);
        var uvs = new Float32Array(gridX1 * gridY1 * 2);
        var offset = 0;
        var offset2 = 0;
        for (var iy = 0; iy < gridY1; iy++) {
            var y = iy * segment_height - height_half;
            for (var ix = 0; ix < gridX1; ix++) {
                var x = ix * segment_width - width_half;
                vertices[offset] = x;
                vertices[offset + 1] = -y;
                normals[offset + 2] = 1;
                uvs[offset2] = ix / gridX;
                uvs[offset2 + 1] = 1 - (iy / gridY);
                offset += 3;
                offset2 += 2;
            }
        }
        offset = 0;
        var indices = new ((vertices.length / 3) > 65535 ? Uint32Array : Uint16Array)(gridX * gridY * 6);
        for (var iy = 0; iy < gridY; iy++) {
            for (var ix = 0; ix < gridX; ix++) {
                var a = ix + gridX1 * iy;
                var b = ix + gridX1 * (iy + 1);
                var c = (ix + 1) + gridX1 * (iy + 1);
                var d = (ix + 1) + gridX1 * iy;
                indices[offset] = a;
                indices[offset + 1] = b;
                indices[offset + 2] = d;
                indices[offset + 3] = b;
                indices[offset + 4] = c;
                indices[offset + 5] = d;
                offset += 6;
            }
        }
        // an indexed quad
        //All variables have been modified to use our new arrays
        var arrays = {
            // position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
            // texcoord: { numComponents: 2, data: [0, 0, 1, 0, 0, 1, 1, 1],                 },
            // normal:   { numComponents: 3, data: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], },
            // indices:  { numComponents: 3, data: [0, 1, 2, 1, 3, 2],                       },
            position: { numComponents: 3, data: vertices, },
            texcoord: { numComponents: 2, data: uvs, },
            normal: { numComponents: 3, data: normals, },
            indices: { numComponents: 3, data: indices, },
        };
        var center = [0, 0, 0];
        var scaleFactor = 20;
        //All the positions for arrays have been fixed for the new variables, and center has been slightly
        //changed to make it look right. I could have manipulated scaleFactor as well, but leaving it as-is looked
        //good enough.
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
        //u_time has been added to objectState so that the shaders can use as needed
        var baseColor = rand(240);
        var objectState = {
            materialUniforms: {
                u_colorMult: chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
                //u_diffuse:               texture,
                u_specular: [1, 1, 1, 1],
                u_shininess: 450,
                u_specularFactor: 0.75,
                u_time: 0,
            }
        };
        // some variables we'll reuse below
        var projectionMatrix = mat4.create();
        var viewMatrix = mat4.create();
        var rotationMatrix = mat4.create();
        var matrix = mat4.create(); // a scratch matrix
        var invMatrix = mat4.create();
        var axisVector = vec3.create();
        requestAnimationFrame(drawScene);
        // Draw the scene.
        function drawScene(time) {
            time *= 0.001;
            //Put the time into the object state
            objectState.materialUniforms.u_time = time;
            //These two lines moved down into drawScene, calling the desired programs
            var uniformSetters = createUniformSetters(gl, programs[shader]);
            var attribSetters = createAttributeSetters(gl, programs[shader]);
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
            // Make a view matrix from the camera matrix.
            mat4.invert(viewMatrix, cameraMatrix);
            // tell WebGL to use our shader program (will need to change this)
            gl.useProgram(programs[shader]);
            //If stop is 1, then we want shader 3, and thus need to render the images
            if (stop == 1) {
                //Immediately "unpress"
                stop = 0;
                //Create two images
                var image0 = new Image();
                image0.src = "GreenScreen.jpg";
                image0.onload = function () {
                    render0(image0);
                };
                var image1 = new Image();
                image1.src = "Warhammer.jpg";
                image1.onload = function () {
                    render1(image1);
                };
                //The render functions are taken entirely from the WebGL Fundamentals site. See here:
                //http://webglfundamentals.org/webgl/lessons/webgl-image-processing.html
                //Some parts have been added for the sake of functionality, and deleted for the lack of need
                function render0(image) {
                    var texCoordLocation = gl.getAttribLocation(programs[shader], "a_texCoord");
                    // Create a texture.
                    var texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    // Set the parameters so we can render any size image.
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    // Upload the image into the texture.
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    var textureUnitIndex = "u_image" + 0;
                    var u_imageLoc = gl.getUniformLocation(programs[shader], textureUnitIndex);
                    gl.uniform1i(u_imageLoc, 0);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    //The below is also taken from the same link, in order to provide a u_textureSize
                    //for the attempted blending in shader 3.
                    var textureSizeLocation = gl.getUniformLocation(programs[shader], "u_textureSize");
                    gl.uniform2f(textureSizeLocation, image.width, image.height);
                }
                //Two separate render functions have been created for each image, due to very small
                //but major differences that can be more easily handled separately.
                function render1(image) {
                    var texCoordLocation = gl.getAttribLocation(programs[shader], "a_texCoord");
                    // Create a texture.
                    var texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    // Set the parameters so we can render any size image.
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    // Upload the image into the texture.
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    var textureUnitIndex = "u_image" + 1;
                    var u_imageLoc = gl.getUniformLocation(programs[shader], textureUnitIndex);
                    gl.uniform1i(u_imageLoc, 1);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    //The same code for u_textureSize is commented out here, because I figure the only
                    //size needed is from image0, the background image. It's left here just in case.
                    //var textureSizeLocation = gl.getUniformLocation(programs[shader], "u_textureSize");
                    //gl.uniform2f(textureSizeLocation, image.width, image.height);
                }
            }
            // Setup all the needed attributes and buffers.  
            setBuffersAndAttributes(gl, attribSetters, bufferInfo);
            // Set the uniforms that are the same for all objects.  Unlike the attributes, each uniform setter
            // is different, depending on the type of the uniform variable.  Look in webgl-util.js for the
            // implementation of  setUniforms to see the details for specific types       
            setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);
            ///////////////////////////////////////////////////////
            // Compute the view matrix and corresponding other matrices for rendering.
            // first make a copy of our rotationMatrix
            mat4.copy(matrix, rotationMatrix);
            // adjust the rotation based on mouse activity.  mouseAngles is set if user is dragging 
            if (mouseAngles[0] !== 0 || mouseAngles[1] !== 0) {
                /*
                 * only rotate around Y, use the second mouse value for scale.  Leaving the old code from A3
                 * here, commented out
                 *
                // need an inverse world transform so we can find out what the world X axis for our first rotation is
                mat4.invert(invMatrix, matrix);
                // get the world X axis
                var xAxis = vec3.transformMat4(axisVector, vec3.fromValues(1,0,0), invMatrix);
          
                // rotate about the world X axis (the X parallel to the screen!)
                mat4.rotate(matrix, matrix, -mouseAngles[1], xAxis);
                */
                // now get the inverse world transform so we can find the world Y axis
                mat4.invert(invMatrix, matrix);
                // get the world Y axis
                var yAxis = vec3.transformMat4(axisVector, vec3.fromValues(0, 1, 0), invMatrix);
                // rotate about teh world Y axis
                mat4.rotate(matrix, matrix, mouseAngles[0], yAxis);
                // save the resulting matrix back to the cumulative rotation matrix 
                mat4.copy(rotationMatrix, matrix);
                // use mouseAngles[1] to scale
                scaleFactor += mouseAngles[1];
                vec2.set(mouseAngles, 0, 0);
            }
            // add a translate and scale to the object World xform, so we have:  R * T * S
            mat4.translate(matrix, rotationMatrix, [-center[0] * scaleFactor, -center[1] * scaleFactor,
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
            // stats meter
            stats.end();
            requestAnimationFrame(drawScene);
        }
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImE0LnRzIl0sIm5hbWVzIjpbIm9mZnNldCIsImluaXRXZWJHTCIsIm1haW4iLCJtYWluLmRlZ1RvUmFkIiwibWFpbi5kcmF3U2NlbmUiLCJtYWluLmRyYXdTY2VuZS5yZW5kZXIwIiwibWFpbi5kcmF3U2NlbmUucmVuZGVyMSJdLCJtYXBwaW5ncyI6IkFBQUEseUNBQXlDO0FBQ3pDLHFEQUFxRDs7SUFpQnJELDRGQUE0RjtJQUM1Rix1RkFBdUY7SUFDdkYsbUJBQW1CO0lBQ25CLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7SUFDeEIsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLHVCQUF1QjtJQUUzQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO0lBQzdDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDckMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUVuQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxLQUFLLENBQUMsVUFBVSxDQUFFLENBQUM7SUFFOUMsNEZBQTRGO0lBQzVGLFlBQVk7SUFDWixJQUFJLElBQUksR0FBRyxVQUFTLEdBQVcsRUFBRSxHQUFZO1FBQzNDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDVixHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUNELE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQztJQUVGLElBQUksT0FBTyxHQUFHLFVBQVMsS0FBSztRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENB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QUFHQSxXQUFXQSxDQUFDQTtZQUUxQ0EsR0FBR0EsQ0FBQ0EsQ0FBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsTUFBTUEsRUFBRUEsRUFBRUEsRUFBR0EsRUFBR0EsQ0FBQ0E7Z0JBRXZDQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxhQUFhQSxHQUFHQSxVQUFVQSxDQUFDQTtnQkFFeENBLFFBQVFBLENBQUVBLE1BQU1BLENBQUVBLEdBQUdBLENBQUNBLENBQUNBO2dCQUN2QkEsUUFBUUEsQ0FBRUEsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBRUEsR0FBR0EsQ0FBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBRTdCQSxPQUFPQSxDQUFFQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFFMUJBLEdBQUdBLENBQUVBLE9BQU9BLENBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEtBQUtBLENBQUNBO2dCQUM1QkEsR0FBR0EsQ0FBRUEsT0FBT0EsR0FBR0EsQ0FBQ0EsQ0FBRUEsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBRUEsRUFBRUEsR0FBR0EsS0FBS0EsQ0FBRUEsQ0FBQ0E7Z0JBRXhDQSxNQUFNQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDWkEsT0FBT0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFFZEEsQ0FBQ0E7UUFFRkEsQ0FBQ0E7UUFFREEsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFFWEEsSUFBSUEsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBRUEsQ0FBRUEsUUFBUUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBRUEsR0FBR0EsS0FBS0EsR0FBR0EsV0FBV0EsR0FBR0EsV0FBV0EsQ0FBRUEsQ0FBRUEsS0FBS0EsR0FBR0EsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBRUEsQ0FBQ0E7UUFFdkdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLEtBQUtBLEVBQUVBLEVB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LFlBQVlBLENBQUNBLEVBQUVBLENBQUNBLFNBQVNBLEVBQUVBLFVBQVVBLENBQUNBLFdBQVdBLEVBQUVBLEVBQUVBLENBQUNBLGNBQWNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBRTVFQSxjQUFjQTtZQUNkQSxLQUFLQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUVaQSxxQkFBcUJBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1FBQ25DQSxDQUFDQTtJQUNIRixDQUFDQSIsImZpbGUiOiJhNC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLzxyZWZlcmVuY2UgcGF0aD0nLi90eXBpbmdzL3RzZC5kLnRzJy8+XHJcbi8vLzxyZWZlcmVuY2UgcGF0aD1cIi4vbG9jYWxUeXBpbmdzL3dlYmdsdXRpbHMuZC50c1wiLz5cclxuXHJcbi8qXHJcbiAqIFBvcnRpb25zIG9mIHRoaXMgY29kZSBhcmVcclxuICogQ29weXJpZ2h0IDIwMTUsIEJsYWlyIE1hY0ludHlyZS5cclxuICogXHJcbiAqIFBvcnRpb25zIG9mIHRoaXMgY29kZSB0YWtlbiBmcm9tIGh0dHA6Ly93ZWJnbGZ1bmRhbWVudGFscy5vcmcsIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9ncmVnZ21hbi93ZWJnbC1mdW5kYW1lbnRhbHNcclxuICogYW5kIGFyZSBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgbGljZW5zZS4gIEluIHBhcnRpY3VsYXIsIGZyb20gXHJcbiAqICAgIGh0dHA6Ly93ZWJnbGZ1bmRhbWVudGFscy5vcmcvd2ViZ2wvd2ViZ2wtbGVzcy1jb2RlLW1vcmUtZnVuLmh0bWxcclxuICogICAgaHR0cDovL3dlYmdsZnVuZGFtZW50YWxzLm9yZy93ZWJnbC9yZXNvdXJjZXMvcHJpbWl0aXZlcy5qc1xyXG4gKiBcclxuICogVGhvc2UgcG9ydGlvbnMgQ29weXJpZ2h0IDIwMTQsIEdyZWdnIFRhdmFyZXMuXHJcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqL1xyXG5cclxuaW1wb3J0IGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBzdGF0cyBtb2R1bGUgYnkgbXJkb29iIChodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3N0YXRzLmpzKSB0byBzaG93IHRoZSBwZXJmb3JtYW5jZSBcclxuLy8gb2YgeW91ciBncmFwaGljc1xyXG52YXIgc3RhdHMgPSBuZXcgU3RhdHMoKTtcclxuc3RhdHMuc2V0TW9kZSggMSApOyAvLyAwOiBmcHMsIDE6IG1zLCAyOiBtYlxyXG5cclxuc3RhdHMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbnN0YXRzLmRvbUVsZW1lbnQuc3R5bGUucmlnaHQgPSAnMHB4Jztcclxuc3RhdHMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAnMHB4JztcclxuXHJcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbUVsZW1lbnQgKTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHV0aWxpdGllc1xyXG52YXIgcmFuZCA9IGZ1bmN0aW9uKG1pbjogbnVtYmVyLCBtYXg/OiBudW1iZXIpIHtcclxuICBpZiAobWF4ID09PSB1bmRlZmluZWQpIHtcclxuICAgIG1heCA9IG1pbjtcclxuICAgIG1pbiA9IDA7XHJcbiAgfVxyXG4gIHJldHVybiBtaW4gKyBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbik7XHJcbn07XHJcblxyXG52YXIgcmFuZEludCA9IGZ1bmN0aW9uKHJhbmdlKSB7XHJcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHJhbmdlKTtcclxufTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIGdldCBzb21lIG9mIG91ciBjYW52YXMgZWxlbWVudHMgdGhhdCB3ZSBuZWVkXHJcbnZhciBjYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3ZWJnbFwiKTtcclxuXHJcbi8vVGhpcyBpcyBhIGdsb2JhbCB2YXJpYWJsZSBmb3IgdGhlIHByb2dyYW1zIGFycmF5XHJcbi8vSXQgc3RhcnRzIG9mZiBhdCAwLCBhbmQgaXQgd29uJ3QgY29tZSBiYWNrIHRvIDAgZXZlciwgbm90IHRoYXQgd2UgY2FyZVxyXG52YXIgc2hhZGVyID0gMDsgIFxyXG5cclxuLy9UaGlzIGlzIGV4Y2x1c2l2ZWx5IGZvciB0aGUgaW1hZ2UgcmVuZGVyaW5nLCBlbnN1cmluZyB0aGF0IHRoZSBpbWFnZXMgb25seSByZW5kZXIgb25jZVxyXG52YXIgc3RvcCA9IDA7XHJcblxyXG4vL0ZvciBldmVyeSB3aW5kb3csIGlmIHRoZSB3aW5kb3cgaXMgY2xpY2tlZCwgc2ltcGx5IGNoYW5nZSB0aGUgZ2xvYmFsIHZhcmlhYmxlIHRvIHRoZSBhcHByb3ByaWF0ZSB2YWx1ZVxyXG5cclxud2luZG93W1wib25FZmZlY3QxXCJdID0gKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coXCJpbnN0YWxsIGVmZmVjdDEhXCIpO1xyXG4gICAgXHJcbiAgLy8vLy8vLy8vLy8vLy9cclxuICAvLy8vLy8vLy8gWU9VUiBDT0RFIEhFUkUgVE8gY2F1c2UgdGhlIHByb2dyYW0gdG8gdXNlIHlvdXIgZmlyc3Qgc2hhZGVyIGVmZmVjdFxyXG4gIC8vLy8vLy8vLyAoeW91IGNhbiBwcm9iYWJseSBqdXN0IHVzZSBzb21lIHNvcnQgb2YgZ2xvYmFsIHZhcmlhYmxlIHRvIGluZGljYXRlIHdoaWNoIGVmZmVjdClcclxuICAvLy8vLy8vLy8vLy8vL1xyXG4gIFxyXG4gIHNoYWRlciA9IDE7XHJcbiAgXHJcbn0gXHJcblxyXG53aW5kb3dbXCJvbkVmZmVjdDJcIl0gPSAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhcImluc3RhbGwgZWZmZWN0MiFcIik7XHJcbiAgICBcclxuICAvLy8vLy8vLy8vLy8vL1xyXG4gIC8vLy8vLy8vLyBZT1VSIENPREUgSEVSRSBUTyBjYXVzZSB0aGUgcHJvZ3JhbSB0byB1c2UgeW91ciBzZWNvbmQgc2hhZGVyIGVmZmVjdFxyXG4gIC8vLy8vLy8vLyAoeW91IGNhbiBwcm9iYWJseSBqdXN0IHVzZSBzb21lIHNvcnQgb2YgZ2xvYmFsIHZhcmlhYmxlIHRvIGluZGljYXRlIHdoaWNoIGVmZmVjdClcclxuICAvLy8vLy8vLy8vLy8vL1xyXG4gIFxyXG4gIHNoYWRlciA9IDI7XHJcbiAgXHJcbn0gXHJcblxyXG53aW5kb3dbXCJvbkVmZmVjdDNcIl0gPSAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhcImluc3RhbGwgZWZmZWN0MyFcIik7XHJcbiAgICBcclxuICAvLy8vLy8vLy8vLy8vL1xyXG4gIC8vLy8vLy8vLyBZT1VSIENPREUgSEVSRSBUTyBjYXVzZSB0aGUgcHJvZ3JhbSB0byB1c2UgeW91ciB0aGlyZCBzaGFkZXIgZWZmZWN0XHJcbiAgLy8vLy8vLy8vICh5b3UgY2FuIHByb2JhYmx5IGp1c3QgdXNlIHNvbWUgc29ydCBvZiBnbG9iYWwgdmFyaWFibGUgdG8gaW5kaWNhdGUgd2hpY2ggZWZmZWN0KVxyXG4gIC8vLy8vLy8vLy8vLy8vXHJcbiAgXHJcbiAgc2hhZGVyID0gMztcclxuICBzdG9wID0gMTtcclxuICBcclxufSBcclxuXHJcbndpbmRvd1tcIm9uRWZmZWN0NFwiXSA9ICgpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKFwiaW5zdGFsbCBlZmZlY3Q0IVwiKTtcclxuICAgIFxyXG4gIC8vLy8vLy8vLy8vLy8vXHJcbiAgLy8vLy8vLy8vIFlPVVIgQ09ERSBIRVJFIFRPIGNhdXNlIHRoZSBwcm9ncmFtIHRvIHVzZSB5b3VyIGZvdXJ0aCBzaGFkZXIgZWZmZWN0XHJcbiAgLy8vLy8vLy8vICh5b3UgY2FuIHByb2JhYmx5IGp1c3QgdXNlIHNvbWUgc29ydCBvZiBnbG9iYWwgdmFyaWFibGUgdG8gaW5kaWNhdGUgd2hpY2ggZWZmZWN0KVxyXG4gIC8vLy8vLy8vLy8vLy8vXHJcbiAgXHJcbiAgc2hhZGVyID0gNDtcclxuICBcclxufSBcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHNvbWUgc2ltcGxlIGludGVyYWN0aW9uIHVzaW5nIHRoZSBtb3VzZS5cclxuLy8gd2UgYXJlIGdvaW5nIHRvIGdldCBzbWFsbCBtb3Rpb24gb2Zmc2V0cyBvZiB0aGUgbW91c2UsIGFuZCB1c2UgdGhlc2UgdG8gcm90YXRlIHRoZSBvYmplY3RcclxuLy9cclxuLy8gb3VyIG9mZnNldCgpIGZ1bmN0aW9uIGZyb20gYXNzaWdubWVudCAwLCB0byBnaXZlIHVzIGEgZ29vZCBtb3VzZSBwb3NpdGlvbiBpbiB0aGUgY2FudmFzIFxyXG5mdW5jdGlvbiBvZmZzZXQoZTogTW91c2VFdmVudCk6IEdMTS5JQXJyYXkge1xyXG4gICAgZSA9IGUgfHwgPE1vdXNlRXZlbnQ+IHdpbmRvdy5ldmVudDtcclxuXHJcbiAgICB2YXIgdGFyZ2V0ID0gPEVsZW1lbnQ+IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudCxcclxuICAgICAgICByZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgICAgIG9mZnNldFggPSBlLmNsaWVudFggLSByZWN0LmxlZnQsXHJcbiAgICAgICAgb2Zmc2V0WSA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xyXG5cclxuICAgIHJldHVybiB2ZWMyLmZyb21WYWx1ZXMob2Zmc2V0WCwgb2Zmc2V0WSk7XHJcbn1cclxuXHJcbnZhciBtb3VzZVN0YXJ0ID0gdW5kZWZpbmVkOyAgLy8gcHJldmlvdXMgbW91c2UgcG9zaXRpb25cclxudmFyIG1vdXNlRGVsdGEgPSB1bmRlZmluZWQ7ICAvLyB0aGUgYW1vdW50IHRoZSBtb3VzZSBoYXMgbW92ZWRcclxudmFyIG1vdXNlQW5nbGVzID0gdmVjMi5jcmVhdGUoKTsgIC8vIGFuZ2xlIG9mZnNldCBjb3JyZXNwb25kaW5nIHRvIG1vdXNlIG1vdmVtZW50XHJcblxyXG4vLyBzdGFydCB0aGluZ3Mgb2ZmIHdpdGggYSBkb3duIHByZXNzXHJcbmNhbnZhcy5vbm1vdXNlZG93biA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgbW91c2VTdGFydCA9IG9mZnNldChldik7ICAgICAgICBcclxuICAgIG1vdXNlRGVsdGEgPSB2ZWMyLmNyZWF0ZSgpOyAgLy8gaW5pdGlhbGl6ZSB0byAwLDBcclxuICAgIHZlYzIuc2V0KG1vdXNlQW5nbGVzLCAwLCAwKTtcclxufVxyXG5cclxuLy8gc3RvcCB0aGluZ3Mgd2l0aCBhIG1vdXNlIHJlbGVhc2VcclxuY2FudmFzLm9ubW91c2V1cCA9IChldjogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgaWYgKG1vdXNlU3RhcnQgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29uc3QgY2xpY2tFbmQgPSBvZmZzZXQoZXYpO1xyXG4gICAgICAgIHZlYzIuc3ViKG1vdXNlRGVsdGEsIGNsaWNrRW5kLCBtb3VzZVN0YXJ0KTsgICAgICAgIC8vIGRlbHRhID0gZW5kIC0gc3RhcnRcclxuICAgICAgICB2ZWMyLnNjYWxlKG1vdXNlQW5nbGVzLCBtb3VzZURlbHRhLCAxMC9jYW52YXMuaGVpZ2h0KTsgIFxyXG5cclxuICAgICAgICAvLyBub3cgdG9zcyB0aGUgdHdvIHZhbHVlcyBzaW5jZSB0aGUgbW91c2UgaXMgdXBcclxuICAgICAgICBtb3VzZURlbHRhID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIG1vdXNlU3RhcnQgPSB1bmRlZmluZWQ7IFxyXG4gICAgfVxyXG59XHJcblxyXG4vLyBpZiB3ZSdyZSBtb3ZpbmcgYW5kIHRoZSBtb3VzZSBpcyBkb3duICAgICAgICBcclxuY2FudmFzLm9ubW91c2Vtb3ZlID0gKGV2OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICBpZiAobW91c2VTdGFydCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgbSA9IG9mZnNldChldik7XHJcbiAgICAgIHZlYzIuc3ViKG1vdXNlRGVsdGEsIG0sIG1vdXNlU3RhcnQpOyAgICAvLyBkZWx0YSA9IG1vdXNlIC0gc3RhcnQgXHJcbiAgICAgIHZlYzIuY29weShtb3VzZVN0YXJ0LCBtKTsgICAgICAgICAgICAgICAvLyBzdGFydCBiZWNvbWVzIGN1cnJlbnQgcG9zaXRpb25cclxuICAgICAgdmVjMi5zY2FsZShtb3VzZUFuZ2xlcywgbW91c2VEZWx0YSwgMTAvY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcIm1vdXNlbW92ZSBtb3VzZUFuZ2xlczogXCIgKyBtb3VzZUFuZ2xlc1swXSArIFwiLCBcIiArIG1vdXNlQW5nbGVzWzFdKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJtb3VzZW1vdmUgbW91c2VEZWx0YTogXCIgKyBtb3VzZURlbHRhWzBdICsgXCIsIFwiICsgbW91c2VEZWx0YVsxXSk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwibW91c2Vtb3ZlIG1vdXNlU3RhcnQ6IFwiICsgbW91c2VTdGFydFswXSArIFwiLCBcIiArIG1vdXNlU3RhcnRbMV0pO1xyXG4gICB9XHJcbn1cclxuXHJcbi8vIHN0b3AgdGhpbmdzIGlmIHlvdSBtb3ZlIG91dCBvZiB0aGUgd2luZG93XHJcbmNhbnZhcy5vbm1vdXNlb3V0ID0gKGV2OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICBpZiAobW91c2VTdGFydCAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgdmVjMi5zZXQobW91c2VBbmdsZXMsIDAsIDApO1xyXG4gICAgICBtb3VzZURlbHRhID0gdW5kZWZpbmVkO1xyXG4gICAgICBtb3VzZVN0YXJ0ID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBzdGFydCB0aGluZ3Mgb2ZmIGJ5IGNhbGxpbmcgaW5pdFdlYkdMXHJcbmluaXRXZWJHTCgpO1xyXG5cclxuZnVuY3Rpb24gaW5pdFdlYkdMKCkge1xyXG4gIC8vIGdldCB0aGUgcmVuZGVyaW5nIGNvbnRleHQgZm9yIHdlYkdMXHJcbiAgdmFyIGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSBnZXRXZWJHTENvbnRleHQoY2FudmFzKTtcclxuICBpZiAoIWdsKSB7XHJcbiAgICByZXR1cm47ICAvLyBubyB3ZWJnbCEgIEJ5ZSBieWVcclxuICB9XHJcblxyXG4gIC8vIHR1cm4gb24gYmFja2ZhY2UgY3VsbGluZyBhbmQgemJ1ZmZlcmluZ1xyXG4gIC8vZ2wuZW5hYmxlKGdsLkNVTExfRkFDRSk7XHJcbiAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG5cclxuICAvLyBhdHRlbXB0IHRvIGRvd25sb2FkIGFuZCBzZXQgdXAgb3VyIEdMU0wgc2hhZGVycy4gIFdoZW4gdGhleSBkb3dubG9hZCwgcHJvY2Vzc2VkIHRvIHRoZSBuZXh0IHN0ZXBcclxuICAvLyBvZiBvdXIgcHJvZ3JhbSwgdGhlIFwibWFpblwiIHJvdXRpbmdcclxuICAvLyBcclxuICAvLyBZT1UgU0hPVUxEIE1PRElGWSBUSElTIFRPIERPV05MT0FEIEFMTCBZT1VSIFNIQURFUlMgYW5kIHNldCB1cCBhbGwgZm91ciBTSEFERVIgUFJPR1JBTVMsXHJcbiAgLy8gVEhFTiBQQVNTIEFOIEFSUkFZIE9GIFBST0dSQU1TIFRPIG1haW4oKS4gIFlvdSdsbCBoYXZlIHRvIGRvIG90aGVyIHRoaW5ncyBpbiBtYWluIHRvIGRlYWxcclxuICAvLyB3aXRoIG11bHRpcGxlIHNoYWRlcnMgYW5kIHN3aXRjaCBiZXR3ZWVuIHRoZW1cclxuICBsb2FkZXIubG9hZEZpbGVzKFsnc2hhZGVycy9hMy1zaGFkZXIudmVydCcsICdzaGFkZXJzL2EzLXNoYWRlci5mcmFnJywgJ3NoYWRlcnMvYTQtc2hhZGVyMS52ZXJ0JywgJ3NoYWRlcnMvYTQtc2hhZGVyMS5mcmFnJyxcclxuICAgICdzaGFkZXJzL2E0LXNoYWRlcjIudmVydCcsICdzaGFkZXJzL2E0LXNoYWRlcjIuZnJhZycsICdzaGFkZXJzL2E0LXNoYWRlcjMudmVydCcsICdzaGFkZXJzL2E0LXNoYWRlcjMuZnJhZycsXHJcbiAgICAnc2hhZGVycy9hNC1zaGFkZXI0LnZlcnQnLCAnc2hhZGVycy9hNC1zaGFkZXI0LmZyYWcnXSwgZnVuY3Rpb24gKHNoYWRlclRleHQpIHtcclxuICAgIC8vdmFyIHByb2dyYW0gPSBjcmVhdGVQcm9ncmFtRnJvbVNvdXJjZXMoZ2wsIHNoYWRlclRleHQpO1xyXG4gICAgXHJcbiAgICAvL1NldCBlYWNoIHBhaXIgYXMgYSBzZXBhcmF0ZSBzdHJpbmdcclxuICAgIHZhciBzdHJpbmcwID0gW3NoYWRlclRleHRbMF0sIHNoYWRlclRleHRbMV1dO1xyXG4gICAgdmFyIHN0cmluZzEgPSBbc2hhZGVyVGV4dFsyXSwgc2hhZGVyVGV4dFszXV07XHJcbiAgICB2YXIgc3RyaW5nMiA9IFtzaGFkZXJUZXh0WzRdLCBzaGFkZXJUZXh0WzVdXTtcclxuICAgIHZhciBzdHJpbmczID0gW3NoYWRlclRleHRbNl0sIHNoYWRlclRleHRbN11dO1xyXG4gICAgdmFyIHN0cmluZzQgPSBbc2hhZGVyVGV4dFs4XSwgc2hhZGVyVGV4dFs5XV07XHJcbiAgICBcclxuICAgIC8vVXNlIHRoZSBzdHJpbmdzIHRvIGNyZWF0ZSBwcm9ncmFtc1xyXG4gICAgdmFyIHByb2dyYW0wID0gY3JlYXRlUHJvZ3JhbUZyb21Tb3VyY2VzKGdsLCBzdHJpbmcwKTtcclxuICAgIHZhciBwcm9ncmFtMSA9IGNyZWF0ZVByb2dyYW1Gcm9tU291cmNlcyhnbCwgc3RyaW5nMSk7XHJcbiAgICB2YXIgcHJvZ3JhbTIgPSBjcmVhdGVQcm9ncmFtRnJvbVNvdXJjZXMoZ2wsIHN0cmluZzIpO1xyXG4gICAgdmFyIHByb2dyYW0zID0gY3JlYXRlUHJvZ3JhbUZyb21Tb3VyY2VzKGdsLCBzdHJpbmczKTtcclxuICAgIHZhciBwcm9ncmFtNCA9IGNyZWF0ZVByb2dyYW1Gcm9tU291cmNlcyhnbCwgc3RyaW5nNCk7XHJcbiAgICBcclxuICAgIC8vU2V0IGFsbCB0aGUgcHJvZ3JhbXMgaW50byBhIHNpbmdsZSBhcnJheVxyXG4gICAgdmFyIHByb2dyYW1zID0gW3Byb2dyYW0wLCBwcm9ncmFtMSwgcHJvZ3JhbTIsIHByb2dyYW0zLCBwcm9ncmFtNF07XHJcbiAgICBcclxuICAgIC8vQ2FsbCBtYWluXHJcbiAgICBtYWluKGdsLCBwcm9ncmFtcyk7XHJcbiAgfSwgZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICBhbGVydCgnU2hhZGVyIGZhaWxlZCB0byBkb3dubG9hZCBcIicgKyB1cmwgKyAnXCInKTtcclxuICB9KTsgXHJcbn1cclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIHdlYkdMIGlzIHNldCB1cCwgYW5kIG91ciBTaGFkZXIgcHJvZ3JhbSBoYXMgYmVlbiBjcmVhdGVkLiAgRmluaXNoIHNldHRpbmcgdXAgb3VyIHdlYkdMIGFwcGxpY2F0aW9uICAgICAgIFxyXG5mdW5jdGlvbiBtYWluKGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIHByb2dyYW1zOiBXZWJHTFByb2dyYW0gW10pIHtcclxuICBcclxuICAvLyB1c2UgdGhlIHdlYmdsLXV0aWxzIGxpYnJhcnkgdG8gY3JlYXRlIHNldHRlcnMgZm9yIGFsbCB0aGUgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgaW4gb3VyIHNoYWRlcnMuXHJcbiAgLy8gSXQgZW51bWVyYXRlcyBhbGwgb2YgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzIGluIHRoZSBwcm9ncmFtLCBhbmQgY3JlYXRlcyB1dGlsaXR5IGZ1bmN0aW9ucyB0byBcclxuICAvLyBhbGxvdyBcInNldFVuaWZvcm1zXCIgYW5kIFwic2V0QXR0cmlidXRlc1wiIChiZWxvdykgdG8gc2V0IHRoZSBzaGFkZXIgdmFyaWFibGVzIGZyb20gYSBqYXZhc2NyaXB0IG9iamVjdC4gXHJcbiAgLy8gVGhlIG9iamVjdHMgaGF2ZSBhIGtleSBmb3IgZWFjaCB1bmlmb3JtIG9yIGF0dHJpYnV0ZSwgYW5kIGEgdmFsdWUgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBmb3IgdGhlXHJcbiAgLy8gc2V0dGVyIGZ1bmN0aW9uXHJcbiAgLy92YXIgdW5pZm9ybVNldHRlcnMgPSBjcmVhdGVVbmlmb3JtU2V0dGVycyhnbCwgcHJvZ3JhbSk7XHJcbiAgLy92YXIgYXR0cmliU2V0dGVycyAgPSBjcmVhdGVBdHRyaWJ1dGVTZXR0ZXJzKGdsLCBwcm9ncmFtKTtcclxuICBcclxuICAvKnZhciB1bmlmb3JtU2V0dGVycyA9IFtdO1xyXG4gIHZhciBhdHRyaWJTZXR0ZXJzID0gW107XHJcbiAgXHJcbiAgdmFyIGk7XHJcbiAgXHJcbiAgZm9yIChpID0gMDsgaSA8IDU7IGkrKykge1xyXG4gICAgXHJcbiAgICB1bmlmb3JtU2V0dGVyc1tpXSA9IGNyZWF0ZVVuaWZvcm1TZXR0ZXJzKGdsLCBwcm9ncmFtc1tpXSk7XHJcbiAgICBhdHRyaWJTZXR0ZXJzW2ldID0gY3JlYXRlQXR0cmlidXRlU2V0dGVycyhnbCwgcHJvZ3JhbXNbaV0pO1xyXG4gICAgXHJcbiAgfSovXHJcbiAgXHJcbiAgLy8gLy9HbyBiZXR3ZWVuIHggYW5kIHkgY29vcmRpbmF0ZXMgZm9yIHN1YmRpdmlzaW9uXHJcbiAgLy8gdmFyIHg7XHJcbiAgLy8gdmFyIHk7XHJcbiAgXHJcbiAgLy8gLy9TdG9yZSBuZXcgYXJyYXkgdmFsdWVzXHJcbiAgLy8gdmFyIG5ld1Bvc2l0aW9uID0gW107XHJcbiAgLy8gdmFyIG5ld1RleENvb3JkID0gW107XHJcbiAgLy8gdmFyIG5ld05vcm1hbHMgPSBbXTtcclxuICAvLyB2YXIgbmV3SW5kaWNlcyA9IFtdO1xyXG4gIFxyXG4gIC8vIC8vU2V0IHZhcmlhYmxlIGZvciBob3cgbXVjaCB3ZSB3YW50IHRvIGRpdmlkZSBieVxyXG4gIC8vIHZhciBkaXZpc2lvbiA9IDQ7XHJcbiAgXHJcbiAgLy8gLy9TaW5jZSB3ZSBzdGFydCB3aXRoIDEwLCB1c2UgdGhhdCB0byBkZXRlcm1pbmUgaW5jcmVtZW50c1xyXG4gIC8vIHZhciBpbmMgPSAxMCAvIGRpdmlzaW9uO1xyXG4gIFxyXG4gIC8vIC8vR28gZm9yIGFsbCBuZXcgeCBhbmQgeSB2YWx1ZXNcclxuICAvLyBmb3IgKHggPSAwOyB4IDw9IGRpdmlzaW9uOyB4KyspIHtcclxuICAgIFxyXG4gIC8vICAgZm9yICh5ID0gMDsgeSA8PSBkaXZpc2lvbjsgeSsrKSB7XHJcbiAgICAgIFxyXG4gIC8vICAgICAvL1VzZSBpbmNyZW1lbnQgdG8gbW9kaWZ5IHggYW5kIHlcclxuICAvLyAgICAgLy9IYXJkLXNldCB6IHRvIDBcclxuICAvLyAgICAgbmV3UG9zaXRpb24ucHVzaCh5ICogaW5jKTtcclxuICAvLyAgICAgbmV3UG9zaXRpb24ucHVzaCh4ICogaW5jKTtcclxuICAvLyAgICAgbmV3UG9zaXRpb24ucHVzaCgwKTtcclxuICAgICAgXHJcbiAgLy8gICAgIC8vU2luY2UgdGV4Y29vcmQgaXMgMC4uMSwgZGl2aWRlIGJ5IDEwIHRvIG5vcm1hbGl6ZVxyXG4gIC8vICAgICBuZXdUZXhDb29yZC5wdXNoKCh5ICogaW5jKSAvIDEwKTtcclxuICAvLyAgICAgbmV3VGV4Q29vcmQucHVzaCgoeCAqIGluYykgLyAxMCk7XHJcbiAgICAgIFxyXG4gIC8vICAgICAvL0hhcmQtc2V0ICgwLCAwLCAtMSksIGxpa2UgaW4gdGhlIGdpdmVuIGNvZGVcclxuICAvLyAgICAgbmV3Tm9ybWFscy5wdXNoKDApO1xyXG4gIC8vICAgICBuZXdOb3JtYWxzLnB1c2goMCk7XHJcbiAgLy8gICAgIG5ld05vcm1hbHMucHVzaCgtMSk7XHJcbiAgICAgIFxyXG4gIC8vICAgfVxyXG4gICAgXHJcbiAgLy8gfVxyXG4gIFxyXG4gIC8vIHZhciBpO1xyXG4gIFxyXG4gIC8vIGNvbnNvbGUubG9nKGRpdmlzaW9uICogZGl2aXNpb24pO1xyXG4gIFxyXG4gIC8vIC8vRm9yIHdoYXRldmVyIGRpdmlzaW9uIHZhbHVlLCBhZGQgMSBhbmQgc3F1YXJlIGl0IHRvIGdldCB0aGUgdG90YWwgbnVtYmVyIG9mIGluZGljZXNcclxuICAvLyBmb3IgKGkgPSAwOyBpIDw9IGRpdmlzaW9uICogZGl2aXNpb247IGkrKykge1xyXG4gICAgXHJcbiAgLy8gICAvLyhkaXZpc2lvbiArIDEpIHNldHMgdGhlIGVkZ2VcclxuICAvLyAgIC8vSWYgaSBtb2QgdGhpcyBlcXVhbHMgZGl2aXNpb24sIHRoZW4gd2UgaGF2ZSByZWFjaGVkIHRoZSBlZGdlLCBhbmQgZG9uJ3Qgd2FudCB0byBkbyBhbnl0aGluZ1xyXG4gIC8vICAgaWYgKGkgJSAoZGl2aXNpb24gKyAxKSA8IGRpdmlzaW9uKSB7XHJcbiAgICAgIFxyXG4gIC8vICAgICBjb25zb2xlLmxvZyhpICUgKGRpdmlzaW9uICsgMSkpO1xyXG4gICAgXHJcbiAgLy8gICAgIC8vTnVtIHdpbGwgYmUgd2hhdCB3ZSB1c2UgdG8gc25ha2UgYXJvdW5kIGV2ZXJ5d2hlcmVcclxuICAvLyAgICAgdmFyIG51bSA9IGk7XHJcbiAgICBcclxuICAvLyAgICAgLy9QdXNoIG51bSwgdGhlIG9uZSBhZnRlciBudW0sIGFuZCB0aGUgb25lIGFib3ZlIG51bVxyXG4gIC8vICAgICBuZXdJbmRpY2VzLnB1c2gobnVtKTtcclxuICAvLyAgICAgbmV3SW5kaWNlcy5wdXNoKG51bSArIDEpO1xyXG4gIC8vICAgICBudW0gPSBudW0gKyBkaXZpc2lvbiArIDE7XHJcbiAgLy8gICAgIG5ld0luZGljZXMucHVzaChudW0pO1xyXG4gICAgICBcclxuICAvLyAgICAgLy9Ob3cgd2UncmUgcmlnaHQgYWJvdmUgd2hlcmUgd2Ugc3RhcnRlZFxyXG4gIC8vICAgICAvL1B1c2ggdGhpcywgdGhlIG9uZSBuZXh0IHRvIGl0LCBhbmQgdGhlIG9uZSByaWdodCBiZWxvd1xyXG4gIC8vICAgICBuZXdJbmRpY2VzLnB1c2gobnVtKTtcclxuICAvLyAgICAgbmV3SW5kaWNlcy5wdXNoKG51bSArIDEpO1xyXG4gIC8vICAgICBudW0gPSBudW0gLSBkaXZpc2lvbjtcclxuICAvLyAgICAgbmV3SW5kaWNlcy5wdXNoKG51bSk7XHJcbiAgICAgIFxyXG4gIC8vICAgfVxyXG4gICAgXHJcbiAgLy8gfVxyXG4gIFxyXG4gIC8vVGhlIGNvZGUgYmVsb3cgaXMgY29waWVkIGRpcmVjdGx5IGZyb20gdGhlIGNvZGUgb2YgdGhlIHRvbWJzdG9uZSBleGFtcGxlLCB3aXRoXHJcbiAgLy90aGUgYXBwcm9wcmlhdGUgbW9kaWZpY2F0aW9ucy4gU2VlIGhlcmU6XHJcbiAgLy9odHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvbWFzdGVyL3NyYy9leHRyYXMvZ2VvbWV0cmllcy9QbGFuZUJ1ZmZlckdlb21ldHJ5LmpzXHJcbiAgLy9UaGUgYWJvdmUgY29tbWVudGVkLW91dCBjb2RlIGNvbnNpc3RzIG9mIG15IGF0dGVtcHQgdG8gY3JlYXRlIG15IG93biBzdWJkaXZpc2lvbiBjb2RlLlxyXG4gIC8vSXQgd291bGQgYWN0dWFsbHkgd29yayBzdWNjZXNzZnVsbHkgZm9yIGEgZGl2aXNpb24gb2YgMiwgYnV0IGJleW9uZCB0aGF0IGl0IGNvdWxkbid0IGNhbGN1bGF0ZVxyXG4gIC8vdGhlIGluZGljZXMgcHJvcGVybHksIGNyZWF0aW5nIHdoYXQgSSBjYWxsZWQgYSBcImNoaXBwZWQgdG9vdGhcIi5cclxuICBcclxuICB2YXIgd2lkdGhfaGFsZiA9IDEwIC8gMjtcclxuXHR2YXIgaGVpZ2h0X2hhbGYgPSAxMCAvIDI7XHJcblxyXG5cdHZhciBncmlkWCA9IE1hdGguZmxvb3IoIDEwMCApIHx8IDE7XHJcblx0dmFyIGdyaWRZID0gTWF0aC5mbG9vciggMTAwICkgfHwgMTtcclxuXHJcblx0dmFyIGdyaWRYMSA9IGdyaWRYICsgMTtcclxuXHR2YXIgZ3JpZFkxID0gZ3JpZFkgKyAxO1xyXG5cclxuXHR2YXIgc2VnbWVudF93aWR0aCA9IDEwIC8gZ3JpZFg7XHJcblx0dmFyIHNlZ21lbnRfaGVpZ2h0ID0gMTAgLyBncmlkWTtcclxuXHJcblx0dmFyIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSggZ3JpZFgxICogZ3JpZFkxICogMyApO1xyXG5cdHZhciBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheSggZ3JpZFgxICogZ3JpZFkxICogMyApO1xyXG5cdHZhciB1dnMgPSBuZXcgRmxvYXQzMkFycmF5KCBncmlkWDEgKiBncmlkWTEgKiAyICk7XHJcblxyXG5cdHZhciBvZmZzZXQgPSAwO1xyXG5cdHZhciBvZmZzZXQyID0gMDtcclxuXHJcblx0Zm9yICggdmFyIGl5ID0gMDsgaXkgPCBncmlkWTE7IGl5ICsrICkge1xyXG5cclxuXHRcdHZhciB5ID0gaXkgKiBzZWdtZW50X2hlaWdodCAtIGhlaWdodF9oYWxmO1xyXG5cclxuXHRcdGZvciAoIHZhciBpeCA9IDA7IGl4IDwgZ3JpZFgxOyBpeCArKyApIHtcclxuXHJcblx0XHRcdHZhciB4ID0gaXggKiBzZWdtZW50X3dpZHRoIC0gd2lkdGhfaGFsZjtcclxuXHJcblx0XHRcdHZlcnRpY2VzWyBvZmZzZXQgXSA9IHg7XHJcblx0XHRcdHZlcnRpY2VzWyBvZmZzZXQgKyAxIF0gPSAtIHk7XHJcblxyXG5cdFx0XHRub3JtYWxzWyBvZmZzZXQgKyAyIF0gPSAxO1xyXG5cclxuXHRcdFx0dXZzWyBvZmZzZXQyIF0gPSBpeCAvIGdyaWRYO1xyXG5cdFx0XHR1dnNbIG9mZnNldDIgKyAxIF0gPSAxIC0gKCBpeSAvIGdyaWRZICk7XHJcblxyXG5cdFx0XHRvZmZzZXQgKz0gMztcclxuXHRcdFx0b2Zmc2V0MiArPSAyO1xyXG5cclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxuXHRvZmZzZXQgPSAwO1xyXG5cclxuXHR2YXIgaW5kaWNlcyA9IG5ldyAoICggdmVydGljZXMubGVuZ3RoIC8gMyApID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5ICkoIGdyaWRYICogZ3JpZFkgKiA2ICk7XHJcblxyXG5cdGZvciAoIHZhciBpeSA9IDA7IGl5IDwgZ3JpZFk7IGl5ICsrICkge1xyXG5cclxuXHRcdGZvciAoIHZhciBpeCA9IDA7IGl4IDwgZ3JpZFg7IGl4ICsrICkge1xyXG5cclxuXHRcdFx0dmFyIGEgPSBpeCArIGdyaWRYMSAqIGl5O1xyXG5cdFx0XHR2YXIgYiA9IGl4ICsgZ3JpZFgxICogKCBpeSArIDEgKTtcclxuXHRcdFx0dmFyIGMgPSAoIGl4ICsgMSApICsgZ3JpZFgxICogKCBpeSArIDEgKTtcclxuXHRcdFx0dmFyIGQgPSAoIGl4ICsgMSApICsgZ3JpZFgxICogaXk7XHJcblxyXG5cdFx0XHRpbmRpY2VzWyBvZmZzZXQgXSA9IGE7XHJcblx0XHRcdGluZGljZXNbIG9mZnNldCArIDEgXSA9IGI7XHJcblx0XHRcdGluZGljZXNbIG9mZnNldCArIDIgXSA9IGQ7XHJcblxyXG5cdFx0XHRpbmRpY2VzWyBvZmZzZXQgKyAzIF0gPSBiO1xyXG5cdFx0XHRpbmRpY2VzWyBvZmZzZXQgKyA0IF0gPSBjO1xyXG5cdFx0XHRpbmRpY2VzWyBvZmZzZXQgKyA1IF0gPSBkO1xyXG5cclxuXHRcdFx0b2Zmc2V0ICs9IDY7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG4gIC8vIGFuIGluZGV4ZWQgcXVhZFxyXG4gIC8vQWxsIHZhcmlhYmxlcyBoYXZlIGJlZW4gbW9kaWZpZWQgdG8gdXNlIG91ciBuZXcgYXJyYXlzXHJcbiAgdmFyIGFycmF5cyA9IHtcclxuICAgICAvLyBwb3NpdGlvbjogeyBudW1Db21wb25lbnRzOiAzLCBkYXRhOiBbMCwgMCwgMCwgMTAsIDAsIDAsIDAsIDEwLCAwLCAxMCwgMTAsIDBdLCB9LFxyXG4gICAgIC8vIHRleGNvb3JkOiB7IG51bUNvbXBvbmVudHM6IDIsIGRhdGE6IFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgLy8gbm9ybWFsOiAgIHsgbnVtQ29tcG9uZW50czogMywgZGF0YTogWzAsIDAsIC0xLCAwLCAwLCAtMSwgMCwgMCwgLTEsIDAsIDAsIC0xXSwgfSxcclxuICAgICAvLyBpbmRpY2VzOiAgeyBudW1Db21wb25lbnRzOiAzLCBkYXRhOiBbMCwgMSwgMiwgMSwgMywgMl0sICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgIHBvc2l0aW9uOiB7IG51bUNvbXBvbmVudHM6IDMsIGRhdGE6IHZlcnRpY2VzLCB9LFxyXG4gICAgIHRleGNvb3JkOiB7IG51bUNvbXBvbmVudHM6IDIsIGRhdGE6IHV2cywgfSxcclxuICAgICBub3JtYWw6ICAgeyBudW1Db21wb25lbnRzOiAzLCBkYXRhOiBub3JtYWxzLCAgfSxcclxuICAgICBpbmRpY2VzOiAgeyBudW1Db21wb25lbnRzOiAzLCBkYXRhOiBpbmRpY2VzLCAgfSxcclxuICB9O1xyXG4gIHZhciBjZW50ZXIgPSBbMCwwLDBdO1xyXG4gIHZhciBzY2FsZUZhY3RvciA9IDIwO1xyXG4gIFxyXG4gIC8vQWxsIHRoZSBwb3NpdGlvbnMgZm9yIGFycmF5cyBoYXZlIGJlZW4gZml4ZWQgZm9yIHRoZSBuZXcgdmFyaWFibGVzLCBhbmQgY2VudGVyIGhhcyBiZWVuIHNsaWdodGx5XHJcbiAgLy9jaGFuZ2VkIHRvIG1ha2UgaXQgbG9vayByaWdodC4gSSBjb3VsZCBoYXZlIG1hbmlwdWxhdGVkIHNjYWxlRmFjdG9yIGFzIHdlbGwsIGJ1dCBsZWF2aW5nIGl0IGFzLWlzIGxvb2tlZFxyXG4gIC8vZ29vZCBlbm91Z2guXHJcbiAgXHJcbiAgdmFyIGJ1ZmZlckluZm8gPSBjcmVhdGVCdWZmZXJJbmZvRnJvbUFycmF5cyhnbCwgYXJyYXlzKTtcclxuICBcclxuICBmdW5jdGlvbiBkZWdUb1JhZChkKSB7XHJcbiAgICByZXR1cm4gZCAqIE1hdGguUEkgLyAxODA7XHJcbiAgfVxyXG5cclxuICB2YXIgY2FtZXJhQW5nbGVSYWRpYW5zID0gZGVnVG9SYWQoMCk7XHJcbiAgdmFyIGZpZWxkT2ZWaWV3UmFkaWFucyA9IGRlZ1RvUmFkKDYwKTtcclxuICB2YXIgY2FtZXJhSGVpZ2h0ID0gNTA7XHJcblxyXG4gIHZhciB1bmlmb3Jtc1RoYXRBcmVUaGVTYW1lRm9yQWxsT2JqZWN0cyA9IHtcclxuICAgIHVfbGlnaHRXb3JsZFBvczogICAgICAgICBbNTAsIDMwLCAtMTAwXSxcclxuICAgIHVfdmlld0ludmVyc2U6ICAgICAgICAgICBtYXQ0LmNyZWF0ZSgpLFxyXG4gICAgdV9saWdodENvbG9yOiAgICAgICAgICAgIFsxLCAxLCAxLCAxXSxcclxuICAgIHVfYW1iaWVudDogICAgICAgICAgICAgICBbMC4xLCAwLjEsIDAuMSwgMC4xXVxyXG4gIH07XHJcblxyXG4gIHZhciB1bmlmb3Jtc1RoYXRBcmVDb21wdXRlZEZvckVhY2hPYmplY3QgPSB7XHJcbiAgICB1X3dvcmxkVmlld1Byb2plY3Rpb246ICAgbWF0NC5jcmVhdGUoKSxcclxuICAgIHVfd29ybGQ6ICAgICAgICAgICAgICAgICBtYXQ0LmNyZWF0ZSgpLFxyXG4gICAgdV93b3JsZEludmVyc2VUcmFuc3Bvc2U6IG1hdDQuY3JlYXRlKCksXHJcbiAgfTtcclxuXHJcbiAgLy8gdmFyIHRleHR1cmUgPSAuLi4uIGNyZWF0ZSBhIHRleHR1cmUgb2Ygc29tZSBmb3JtXHJcbiAgXHJcbiAgLy91X3RpbWUgaGFzIGJlZW4gYWRkZWQgdG8gb2JqZWN0U3RhdGUgc28gdGhhdCB0aGUgc2hhZGVycyBjYW4gdXNlIGFzIG5lZWRlZFxyXG5cclxuICB2YXIgYmFzZUNvbG9yID0gcmFuZCgyNDApO1xyXG4gIHZhciBvYmplY3RTdGF0ZSA9IHsgXHJcbiAgICAgIG1hdGVyaWFsVW5pZm9ybXM6IHtcclxuICAgICAgICB1X2NvbG9yTXVsdDogICAgICAgICAgICAgY2hyb21hLmhzdihyYW5kKGJhc2VDb2xvciwgYmFzZUNvbG9yICsgMTIwKSwgMC41LCAxKS5nbCgpLFxyXG4gICAgICAgIC8vdV9kaWZmdXNlOiAgICAgICAgICAgICAgIHRleHR1cmUsXHJcbiAgICAgICAgdV9zcGVjdWxhcjogICAgICAgICAgICAgIFsxLCAxLCAxLCAxXSxcclxuICAgICAgICB1X3NoaW5pbmVzczogICAgICAgICAgICAgNDUwLFxyXG4gICAgICAgIHVfc3BlY3VsYXJGYWN0b3I6ICAgICAgICAwLjc1LFxyXG4gICAgICAgIHVfdGltZTogICAgICAgICAgICAgICAgICAwLFxyXG4gICAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gc29tZSB2YXJpYWJsZXMgd2UnbGwgcmV1c2UgYmVsb3dcclxuICB2YXIgcHJvamVjdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIHZpZXdNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xyXG4gIHZhciByb3RhdGlvbk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIG1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7ICAvLyBhIHNjcmF0Y2ggbWF0cml4XHJcbiAgdmFyIGludk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XHJcbiAgdmFyIGF4aXNWZWN0b3IgPSB2ZWMzLmNyZWF0ZSgpO1xyXG4gIFxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3U2NlbmUpO1xyXG4gIFxyXG4gIC8vIERyYXcgdGhlIHNjZW5lLlxyXG4gIGZ1bmN0aW9uIGRyYXdTY2VuZSh0aW1lOiBudW1iZXIpIHtcclxuICAgIHRpbWUgKj0gMC4wMDE7XHJcbiAgICBcclxuICAgIC8vUHV0IHRoZSB0aW1lIGludG8gdGhlIG9iamVjdCBzdGF0ZVxyXG4gICAgb2JqZWN0U3RhdGUubWF0ZXJpYWxVbmlmb3Jtcy51X3RpbWUgPSB0aW1lO1xyXG4gICAgXHJcbiAgICAvL1RoZXNlIHR3byBsaW5lcyBtb3ZlZCBkb3duIGludG8gZHJhd1NjZW5lLCBjYWxsaW5nIHRoZSBkZXNpcmVkIHByb2dyYW1zXHJcbiAgICB2YXIgdW5pZm9ybVNldHRlcnMgPSBjcmVhdGVVbmlmb3JtU2V0dGVycyhnbCwgcHJvZ3JhbXNbc2hhZGVyXSk7XHJcbiAgICB2YXIgYXR0cmliU2V0dGVycyAgPSBjcmVhdGVBdHRyaWJ1dGVTZXR0ZXJzKGdsLCBwcm9ncmFtc1tzaGFkZXJdKTsgXHJcbiAgIFxyXG4gICAgLy8gbWVhc3VyZSB0aW1lIHRha2VuIGZvciB0aGUgbGl0dGxlIHN0YXRzIG1ldGVyXHJcbiAgICBzdGF0cy5iZWdpbigpO1xyXG5cclxuICAgIC8vIGlmIHRoZSB3aW5kb3cgY2hhbmdlZCBzaXplLCByZXNldCB0aGUgV2ViR0wgY2FudmFzIHNpemUgdG8gbWF0Y2guICBUaGUgZGlzcGxheWVkIHNpemUgb2YgdGhlIGNhbnZhc1xyXG4gICAgLy8gKGRldGVybWluZWQgYnkgd2luZG93IHNpemUsIGxheW91dCwgYW5kIHlvdXIgQ1NTKSBpcyBzZXBhcmF0ZSBmcm9tIHRoZSBzaXplIG9mIHRoZSBXZWJHTCByZW5kZXIgYnVmZmVycywgXHJcbiAgICAvLyB3aGljaCB5b3UgY2FuIGNvbnRyb2wgYnkgc2V0dGluZyBjYW52YXMud2lkdGggYW5kIGNhbnZhcy5oZWlnaHRcclxuICAgIHJlc2l6ZUNhbnZhc1RvRGlzcGxheVNpemUoY2FudmFzKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIHZpZXdwb3J0IHRvIG1hdGNoIHRoZSBjYW52YXNcclxuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICBcclxuICAgIC8vIENsZWFyIHRoZSBjYW52YXMgQU5EIHRoZSBkZXB0aCBidWZmZXIuXHJcbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgcHJvamVjdGlvbiBtYXRyaXhcclxuICAgIHZhciBhc3BlY3QgPSBjYW52YXMuY2xpZW50V2lkdGggLyBjYW52YXMuY2xpZW50SGVpZ2h0O1xyXG4gICAgbWF0NC5wZXJzcGVjdGl2ZShwcm9qZWN0aW9uTWF0cml4LGZpZWxkT2ZWaWV3UmFkaWFucywgYXNwZWN0LCAxLCAyMDAwKTtcclxuXHJcbiAgICAvLyBDb21wdXRlIHRoZSBjYW1lcmEncyBtYXRyaXggdXNpbmcgbG9vayBhdC5cclxuICAgIHZhciBjYW1lcmFQb3NpdGlvbiA9IFswLCAwLCAtMjAwXTtcclxuICAgIHZhciB0YXJnZXQgPSBbMCwgMCwgMF07XHJcbiAgICB2YXIgdXAgPSBbMCwgMSwgMF07XHJcbiAgICB2YXIgY2FtZXJhTWF0cml4ID0gbWF0NC5sb29rQXQodW5pZm9ybXNUaGF0QXJlVGhlU2FtZUZvckFsbE9iamVjdHMudV92aWV3SW52ZXJzZSwgY2FtZXJhUG9zaXRpb24sIHRhcmdldCwgdXApO1xyXG5cclxuICAgIC8vIE1ha2UgYSB2aWV3IG1hdHJpeCBmcm9tIHRoZSBjYW1lcmEgbWF0cml4LlxyXG4gICAgbWF0NC5pbnZlcnQodmlld01hdHJpeCwgY2FtZXJhTWF0cml4KTtcclxuICAgIFxyXG4gICAgLy8gdGVsbCBXZWJHTCB0byB1c2Ugb3VyIHNoYWRlciBwcm9ncmFtICh3aWxsIG5lZWQgdG8gY2hhbmdlIHRoaXMpXHJcbiAgICBnbC51c2VQcm9ncmFtKHByb2dyYW1zW3NoYWRlcl0pO1xyXG4gICAgXHJcbiAgICAvL0lmIHN0b3AgaXMgMSwgdGhlbiB3ZSB3YW50IHNoYWRlciAzLCBhbmQgdGh1cyBuZWVkIHRvIHJlbmRlciB0aGUgaW1hZ2VzXHJcbiAgICBpZihzdG9wID09IDEpIHtcclxuICAgICAgXHJcbiAgICAgIC8vSW1tZWRpYXRlbHkgXCJ1bnByZXNzXCJcclxuICAgICAgc3RvcCA9IDA7XHJcbiAgICAgIFxyXG4gICAgICAvL0NyZWF0ZSB0d28gaW1hZ2VzXHJcbiAgICAgIFxyXG4gICAgICB2YXIgaW1hZ2UwID0gbmV3IEltYWdlKCk7XHJcbiAgICAgIGltYWdlMC5zcmMgPSBcIkdyZWVuU2NyZWVuLmpwZ1wiO1xyXG4gICAgICBpbWFnZTAub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVuZGVyMChpbWFnZTApO1xyXG4gICAgICB9XHJcbiAgXHJcbiAgICAgIHZhciBpbWFnZTEgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgaW1hZ2UxLnNyYyA9IFwiV2FyaGFtbWVyLmpwZ1wiO1xyXG4gICAgICBpbWFnZTEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVuZGVyMShpbWFnZTEpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvL1RoZSByZW5kZXIgZnVuY3Rpb25zIGFyZSB0YWtlbiBlbnRpcmVseSBmcm9tIHRoZSBXZWJHTCBGdW5kYW1lbnRhbHMgc2l0ZS4gU2VlIGhlcmU6XHJcbiAgICAgIC8vaHR0cDovL3dlYmdsZnVuZGFtZW50YWxzLm9yZy93ZWJnbC9sZXNzb25zL3dlYmdsLWltYWdlLXByb2Nlc3NpbmcuaHRtbFxyXG4gICAgICAvL1NvbWUgcGFydHMgaGF2ZSBiZWVuIGFkZGVkIGZvciB0aGUgc2FrZSBvZiBmdW5jdGlvbmFsaXR5LCBhbmQgZGVsZXRlZCBmb3IgdGhlIGxhY2sgb2YgbmVlZFxyXG4gICAgXHJcbiAgICAgIGZ1bmN0aW9uIHJlbmRlcjAoaW1hZ2UpIHtcclxuICAgIFxyXG4gICAgICAgIHZhciB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbXNbc2hhZGVyXSwgXCJhX3RleENvb3JkXCIpO1xyXG4gXHJcbiAgICAgICAgIC8vIENyZWF0ZSBhIHRleHR1cmUuXHJcbiAgICAgICAgdmFyIHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XHJcbiBcclxuICAgICAgICAvLyBTZXQgdGhlIHBhcmFtZXRlcnMgc28gd2UgY2FuIHJlbmRlciBhbnkgc2l6ZSBpbWFnZS5cclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gXHJcbiAgICAgICAgLy8gVXBsb2FkIHRoZSBpbWFnZSBpbnRvIHRoZSB0ZXh0dXJlLlxyXG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgaW1hZ2UpO1xyXG4gIFxyXG4gICAgICAgIHZhciB0ZXh0dXJlVW5pdEluZGV4ID0gIFwidV9pbWFnZVwiICsgMDtcclxuICAgICAgICB2YXIgdV9pbWFnZUxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtc1tzaGFkZXJdLCB0ZXh0dXJlVW5pdEluZGV4KTtcclxuICAgICAgICBnbC51bmlmb3JtMWkodV9pbWFnZUxvYywgMCk7XHJcbiAgXHJcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMSk7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UaGUgYmVsb3cgaXMgYWxzbyB0YWtlbiBmcm9tIHRoZSBzYW1lIGxpbmssIGluIG9yZGVyIHRvIHByb3ZpZGUgYSB1X3RleHR1cmVTaXplXHJcbiAgICAgICAgLy9mb3IgdGhlIGF0dGVtcHRlZCBibGVuZGluZyBpbiBzaGFkZXIgMy5cclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGV4dHVyZVNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtc1tzaGFkZXJdLCBcInVfdGV4dHVyZVNpemVcIik7XHJcbiAgICAgICAgZ2wudW5pZm9ybTJmKHRleHR1cmVTaXplTG9jYXRpb24sIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgXHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vVHdvIHNlcGFyYXRlIHJlbmRlciBmdW5jdGlvbnMgaGF2ZSBiZWVuIGNyZWF0ZWQgZm9yIGVhY2ggaW1hZ2UsIGR1ZSB0byB2ZXJ5IHNtYWxsXHJcbiAgICAgIC8vYnV0IG1ham9yIGRpZmZlcmVuY2VzIHRoYXQgY2FuIGJlIG1vcmUgZWFzaWx5IGhhbmRsZWQgc2VwYXJhdGVseS5cclxuICBcclxuICAgICAgZnVuY3Rpb24gcmVuZGVyMShpbWFnZSkge1xyXG4gICAgXHJcbiAgICAgICAgdmFyIHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtc1tzaGFkZXJdLCBcImFfdGV4Q29vcmRcIik7XHJcbiBcclxuICAgICAgICAvLyBDcmVhdGUgYSB0ZXh0dXJlLlxyXG4gICAgICAgIHZhciB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpO1xyXG4gXHJcbiAgICAgICAgLy8gU2V0IHRoZSBwYXJhbWV0ZXJzIHNvIHdlIGNhbiByZW5kZXIgYW55IHNpemUgaW1hZ2UuXHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuIFxyXG4gICAgICAgIC8vIFVwbG9hZCB0aGUgaW1hZ2UgaW50byB0aGUgdGV4dHVyZS5cclxuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltYWdlKTtcclxuICBcclxuICAgICAgICB2YXIgdGV4dHVyZVVuaXRJbmRleCA9IFwidV9pbWFnZVwiICsgMTtcclxuICAgICAgICB2YXIgdV9pbWFnZUxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtc1tzaGFkZXJdLCB0ZXh0dXJlVW5pdEluZGV4KTtcclxuICAgICAgICBnbC51bmlmb3JtMWkodV9pbWFnZUxvYywgMSk7XHJcbiAgXHJcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMSk7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UaGUgc2FtZSBjb2RlIGZvciB1X3RleHR1cmVTaXplIGlzIGNvbW1lbnRlZCBvdXQgaGVyZSwgYmVjYXVzZSBJIGZpZ3VyZSB0aGUgb25seVxyXG4gICAgICAgIC8vc2l6ZSBuZWVkZWQgaXMgZnJvbSBpbWFnZTAsIHRoZSBiYWNrZ3JvdW5kIGltYWdlLiBJdCdzIGxlZnQgaGVyZSBqdXN0IGluIGNhc2UuXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy92YXIgdGV4dHVyZVNpemVMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtc1tzaGFkZXJdLCBcInVfdGV4dHVyZVNpemVcIik7XHJcbiAgICAgICAgLy9nbC51bmlmb3JtMmYodGV4dHVyZVNpemVMb2NhdGlvbiwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgIFxyXG4gICAgICB9XHJcbiAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU2V0dXAgYWxsIHRoZSBuZWVkZWQgYXR0cmlidXRlcyBhbmQgYnVmZmVycy4gIFxyXG4gICAgc2V0QnVmZmVyc0FuZEF0dHJpYnV0ZXMoZ2wsIGF0dHJpYlNldHRlcnMsIGJ1ZmZlckluZm8pO1xyXG5cclxuICAgIC8vIFNldCB0aGUgdW5pZm9ybXMgdGhhdCBhcmUgdGhlIHNhbWUgZm9yIGFsbCBvYmplY3RzLiAgVW5saWtlIHRoZSBhdHRyaWJ1dGVzLCBlYWNoIHVuaWZvcm0gc2V0dGVyXHJcbiAgICAvLyBpcyBkaWZmZXJlbnQsIGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiB0aGUgdW5pZm9ybSB2YXJpYWJsZS4gIExvb2sgaW4gd2ViZ2wtdXRpbC5qcyBmb3IgdGhlXHJcbiAgICAvLyBpbXBsZW1lbnRhdGlvbiBvZiAgc2V0VW5pZm9ybXMgdG8gc2VlIHRoZSBkZXRhaWxzIGZvciBzcGVjaWZpYyB0eXBlcyAgICAgICBcclxuICAgIHNldFVuaWZvcm1zKHVuaWZvcm1TZXR0ZXJzLCB1bmlmb3Jtc1RoYXRBcmVUaGVTYW1lRm9yQWxsT2JqZWN0cyk7XHJcbiAgIFxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gQ29tcHV0ZSB0aGUgdmlldyBtYXRyaXggYW5kIGNvcnJlc3BvbmRpbmcgb3RoZXIgbWF0cmljZXMgZm9yIHJlbmRlcmluZy5cclxuICAgIFxyXG4gICAgLy8gZmlyc3QgbWFrZSBhIGNvcHkgb2Ygb3VyIHJvdGF0aW9uTWF0cml4XHJcbiAgICBtYXQ0LmNvcHkobWF0cml4LCByb3RhdGlvbk1hdHJpeCk7XHJcbiAgICBcclxuICAgIC8vIGFkanVzdCB0aGUgcm90YXRpb24gYmFzZWQgb24gbW91c2UgYWN0aXZpdHkuICBtb3VzZUFuZ2xlcyBpcyBzZXQgaWYgdXNlciBpcyBkcmFnZ2luZyBcclxuICAgIGlmIChtb3VzZUFuZ2xlc1swXSAhPT0gMCB8fCBtb3VzZUFuZ2xlc1sxXSAhPT0gMCkge1xyXG4gICAgICAvKlxyXG4gICAgICAgKiBvbmx5IHJvdGF0ZSBhcm91bmQgWSwgdXNlIHRoZSBzZWNvbmQgbW91c2UgdmFsdWUgZm9yIHNjYWxlLiAgTGVhdmluZyB0aGUgb2xkIGNvZGUgZnJvbSBBMyBcclxuICAgICAgICogaGVyZSwgY29tbWVudGVkIG91dFxyXG4gICAgICAgKiBcclxuICAgICAgLy8gbmVlZCBhbiBpbnZlcnNlIHdvcmxkIHRyYW5zZm9ybSBzbyB3ZSBjYW4gZmluZCBvdXQgd2hhdCB0aGUgd29ybGQgWCBheGlzIGZvciBvdXIgZmlyc3Qgcm90YXRpb24gaXNcclxuICAgICAgbWF0NC5pbnZlcnQoaW52TWF0cml4LCBtYXRyaXgpO1xyXG4gICAgICAvLyBnZXQgdGhlIHdvcmxkIFggYXhpc1xyXG4gICAgICB2YXIgeEF4aXMgPSB2ZWMzLnRyYW5zZm9ybU1hdDQoYXhpc1ZlY3RvciwgdmVjMy5mcm9tVmFsdWVzKDEsMCwwKSwgaW52TWF0cml4KTtcclxuXHJcbiAgICAgIC8vIHJvdGF0ZSBhYm91dCB0aGUgd29ybGQgWCBheGlzICh0aGUgWCBwYXJhbGxlbCB0byB0aGUgc2NyZWVuISlcclxuICAgICAgbWF0NC5yb3RhdGUobWF0cml4LCBtYXRyaXgsIC1tb3VzZUFuZ2xlc1sxXSwgeEF4aXMpO1xyXG4gICAgICAqL1xyXG4gICAgICAgICAgICBcclxuICAgICAgLy8gbm93IGdldCB0aGUgaW52ZXJzZSB3b3JsZCB0cmFuc2Zvcm0gc28gd2UgY2FuIGZpbmQgdGhlIHdvcmxkIFkgYXhpc1xyXG4gICAgICBtYXQ0LmludmVydChpbnZNYXRyaXgsIG1hdHJpeCk7XHJcbiAgICAgIC8vIGdldCB0aGUgd29ybGQgWSBheGlzXHJcbiAgICAgIHZhciB5QXhpcyA9IHZlYzMudHJhbnNmb3JtTWF0NChheGlzVmVjdG9yLCB2ZWMzLmZyb21WYWx1ZXMoMCwxLDApLCBpbnZNYXRyaXgpO1xyXG5cclxuICAgICAgLy8gcm90YXRlIGFib3V0IHRlaCB3b3JsZCBZIGF4aXNcclxuICAgICAgbWF0NC5yb3RhdGUobWF0cml4LCBtYXRyaXgsIG1vdXNlQW5nbGVzWzBdLCB5QXhpcyk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBzYXZlIHRoZSByZXN1bHRpbmcgbWF0cml4IGJhY2sgdG8gdGhlIGN1bXVsYXRpdmUgcm90YXRpb24gbWF0cml4IFxyXG4gICAgICBtYXQ0LmNvcHkocm90YXRpb25NYXRyaXgsIG1hdHJpeCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyB1c2UgbW91c2VBbmdsZXNbMV0gdG8gc2NhbGVcclxuICAgICAgc2NhbGVGYWN0b3IgKz0gbW91c2VBbmdsZXNbMV07XHJcbiAgICAgIFxyXG4gICAgICB2ZWMyLnNldChtb3VzZUFuZ2xlcywgMCwgMCk7ICAgICAgICBcclxuICAgIH0gICBcclxuXHJcbiAgICAvLyBhZGQgYSB0cmFuc2xhdGUgYW5kIHNjYWxlIHRvIHRoZSBvYmplY3QgV29ybGQgeGZvcm0sIHNvIHdlIGhhdmU6ICBSICogVCAqIFNcclxuICAgIG1hdDQudHJhbnNsYXRlKG1hdHJpeCwgcm90YXRpb25NYXRyaXgsIFstY2VudGVyWzBdKnNjYWxlRmFjdG9yLCAtY2VudGVyWzFdKnNjYWxlRmFjdG9yLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtY2VudGVyWzJdKnNjYWxlRmFjdG9yXSk7XHJcbiAgICBtYXQ0LnNjYWxlKG1hdHJpeCwgbWF0cml4LCBbc2NhbGVGYWN0b3IsIHNjYWxlRmFjdG9yLCBzY2FsZUZhY3Rvcl0pO1xyXG4gICAgbWF0NC5jb3B5KHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkLCBtYXRyaXgpO1xyXG4gICAgXHJcbiAgICAvLyBnZXQgcHJvaiAqIHZpZXcgKiB3b3JsZFxyXG4gICAgbWF0NC5tdWx0aXBseShtYXRyaXgsIHZpZXdNYXRyaXgsIHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkKTtcclxuICAgIG1hdDQubXVsdGlwbHkodW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0LnVfd29ybGRWaWV3UHJvamVjdGlvbiwgcHJvamVjdGlvbk1hdHJpeCwgbWF0cml4KTtcclxuXHJcbiAgICAvLyBnZXQgd29ybGRJbnZUcmFuc3Bvc2UuICBGb3IgYW4gZXhwbGFpbmF0aW9uIG9mIHdoeSB3ZSBuZWVkIHRoaXMsIGZvciBmaXhpbmcgdGhlIG5vcm1hbHMsIHNlZVxyXG4gICAgLy8gaHR0cDovL3d3dy51bmtub3ducm9hZC5jb20vcnRmbS9ncmFwaGljcy9ydF9ub3JtYWxzLmh0bWxcclxuICAgIG1hdDQudHJhbnNwb3NlKHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkSW52ZXJzZVRyYW5zcG9zZSwgXHJcbiAgICAgICAgICAgICAgICAgICBtYXQ0LmludmVydChtYXRyaXgsIHVuaWZvcm1zVGhhdEFyZUNvbXB1dGVkRm9yRWFjaE9iamVjdC51X3dvcmxkKSk7XHJcblxyXG4gICAgLy8gU2V0IHRoZSB1bmlmb3JtcyB3ZSBqdXN0IGNvbXB1dGVkXHJcbiAgICBzZXRVbmlmb3Jtcyh1bmlmb3JtU2V0dGVycywgdW5pZm9ybXNUaGF0QXJlQ29tcHV0ZWRGb3JFYWNoT2JqZWN0KTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIHVuaWZvcm1zIHRoYXQgYXJlIHNwZWNpZmljIHRvIHRoZSB0aGlzIG9iamVjdC5cclxuICAgIHNldFVuaWZvcm1zKHVuaWZvcm1TZXR0ZXJzLCBvYmplY3RTdGF0ZS5tYXRlcmlhbFVuaWZvcm1zKTtcclxuXHJcbiAgICAvLyBEcmF3IHRoZSBnZW9tZXRyeS4gICBFdmVyeXRoaW5nIGlzIGtleWVkIHRvIHRoZSBcIlwiXHJcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBidWZmZXJJbmZvLm51bUVsZW1lbnRzLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XHJcblxyXG4gICAgLy8gc3RhdHMgbWV0ZXJcclxuICAgIHN0YXRzLmVuZCgpO1xyXG5cclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3U2NlbmUpO1xyXG4gIH1cclxufVxyXG5cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
