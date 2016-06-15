///<reference path='./typings/tsd.d.ts'/>
///<reference path="./localTypings/webglutils.d.ts"/>

/*
 * Portions of this code are
 * Copyright 2015, Blair MacIntyre.
 * 
 * Portions of this code taken from http://webglfundamentals.org, at https://github.com/greggman/webgl-fundamentals
 * and are subject to the following license.  In particular, from 
 *    http://webglfundamentals.org/webgl/webgl-less-code-more-fun.html
 *    http://webglfundamentals.org/webgl/resources/primitives.js
 * 
 * Those portions Copyright 2014, Gregg Tavares.
 * All rights reserved.
 */

import loader = require('./loader');

////////////////////////////////////////////////////////////////////////////////////////////
// stats module by mrdoob (https://github.com/mrdoob/stats.js) to show the performance 
// of your graphics
var stats = new Stats();
stats.setMode( 1 ); // 0: fps, 1: ms, 2: mb

stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild( stats.domElement );

////////////////////////////////////////////////////////////////////////////////////////////
// utilities
var rand = function(min: number, max?: number) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};

var randInt = function(range) {
  return Math.floor(Math.random() * range);
};

////////////////////////////////////////////////////////////////////////////////////////////
// get some of our canvas elements that we need
var canvas = <HTMLCanvasElement>document.getElementById("webgl");

//This is a global variable for the programs array
//It starts off at 0, and it won't come back to 0 ever, not that we care
var shader = 0;  

//This is exclusively for the image rendering, ensuring that the images only render once
var stop = 0;

//For every window, if the window is clicked, simply change the global variable to the appropriate value

window["onEffect1"] = () => {
    console.log("install effect1!");
    
  //////////////
  ///////// YOUR CODE HERE TO cause the program to use your first shader effect
  ///////// (you can probably just use some sort of global variable to indicate which effect)
  //////////////
  
  shader = 1;
  
} 

window["onEffect2"] = () => {
    console.log("install effect2!");
    
  //////////////
  ///////// YOUR CODE HERE TO cause the program to use your second shader effect
  ///////// (you can probably just use some sort of global variable to indicate which effect)
  //////////////
  
  shader = 2;
  
} 

window["onEffect3"] = () => {
    console.log("install effect3!");
    
  //////////////
  ///////// YOUR CODE HERE TO cause the program to use your third shader effect
  ///////// (you can probably just use some sort of global variable to indicate which effect)
  //////////////
  
  shader = 3;
  stop = 1;
  
} 

window["onEffect4"] = () => {
    console.log("install effect4!");
    
  //////////////
  ///////// YOUR CODE HERE TO cause the program to use your fourth shader effect
  ///////// (you can probably just use some sort of global variable to indicate which effect)
  //////////////
  
  shader = 4;
  
} 

////////////////////////////////////////////////////////////////////////////////////////////
// some simple interaction using the mouse.
// we are going to get small motion offsets of the mouse, and use these to rotate the object
//
// our offset() function from assignment 0, to give us a good mouse position in the canvas 
function offset(e: MouseEvent): GLM.IArray {
    e = e || <MouseEvent> window.event;

    var target = <Element> e.target || e.srcElement,
        rect = target.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

    return vec2.fromValues(offsetX, offsetY);
}

var mouseStart = undefined;  // previous mouse position
var mouseDelta = undefined;  // the amount the mouse has moved
var mouseAngles = vec2.create();  // angle offset corresponding to mouse movement

// start things off with a down press
canvas.onmousedown = (ev: MouseEvent) => {
    mouseStart = offset(ev);        
    mouseDelta = vec2.create();  // initialize to 0,0
    vec2.set(mouseAngles, 0, 0);
}

// stop things with a mouse release
canvas.onmouseup = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
        const clickEnd = offset(ev);
        vec2.sub(mouseDelta, clickEnd, mouseStart);        // delta = end - start
        vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);  

        // now toss the two values since the mouse is up
        mouseDelta = undefined;
        mouseStart = undefined; 
    }
}

// if we're moving and the mouse is down        
canvas.onmousemove = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      const m = offset(ev);
      vec2.sub(mouseDelta, m, mouseStart);    // delta = mouse - start 
      vec2.copy(mouseStart, m);               // start becomes current position
      vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);

      // console.log("mousemove mouseAngles: " + mouseAngles[0] + ", " + mouseAngles[1]);
      // console.log("mousemove mouseDelta: " + mouseDelta[0] + ", " + mouseDelta[1]);
      // console.log("mousemove mouseStart: " + mouseStart[0] + ", " + mouseStart[1]);
   }
}

// stop things if you move out of the window
canvas.onmouseout = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      vec2.set(mouseAngles, 0, 0);
      mouseDelta = undefined;
      mouseStart = undefined;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////
// start things off by calling initWebGL
initWebGL();

function initWebGL() {
  // get the rendering context for webGL
  var gl: WebGLRenderingContext = getWebGLContext(canvas);
  if (!gl) {
    return;  // no webgl!  Bye bye
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
function main(gl: WebGLRenderingContext, programs: WebGLProgram []) {
  
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

	var gridX = Math.floor( 100 ) || 1;
	var gridY = Math.floor( 100 ) || 1;

	var gridX1 = gridX + 1;
	var gridY1 = gridY + 1;

	var segment_width = 10 / gridX;
	var segment_height = 10 / gridY;

	var vertices = new Float32Array( gridX1 * gridY1 * 3 );
	var normals = new Float32Array( gridX1 * gridY1 * 3 );
	var uvs = new Float32Array( gridX1 * gridY1 * 2 );

	var offset = 0;
	var offset2 = 0;

	for ( var iy = 0; iy < gridY1; iy ++ ) {

		var y = iy * segment_height - height_half;

		for ( var ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;

			vertices[ offset ] = x;
			vertices[ offset + 1 ] = - y;

			normals[ offset + 2 ] = 1;

			uvs[ offset2 ] = ix / gridX;
			uvs[ offset2 + 1 ] = 1 - ( iy / gridY );

			offset += 3;
			offset2 += 2;

		}

	}

	offset = 0;

	var indices = new ( ( vertices.length / 3 ) > 65535 ? Uint32Array : Uint16Array )( gridX * gridY * 6 );

	for ( var iy = 0; iy < gridY; iy ++ ) {

		for ( var ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iy;
			var b = ix + gridX1 * ( iy + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
			var d = ( ix + 1 ) + gridX1 * iy;

			indices[ offset ] = a;
			indices[ offset + 1 ] = b;
			indices[ offset + 2 ] = d;

			indices[ offset + 3 ] = b;
			indices[ offset + 4 ] = c;
			indices[ offset + 5 ] = d;

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
     normal:   { numComponents: 3, data: normals,  },
     indices:  { numComponents: 3, data: indices,  },
  };
  var center = [0,0,0];
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
    u_lightWorldPos:         [50, 30, -100],
    u_viewInverse:           mat4.create(),
    u_lightColor:            [1, 1, 1, 1],
    u_ambient:               [0.1, 0.1, 0.1, 0.1]
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection:   mat4.create(),
    u_world:                 mat4.create(),
    u_worldInverseTranspose: mat4.create(),
  };

  // var texture = .... create a texture of some form
  
  //u_time has been added to objectState so that the shaders can use as needed

  var baseColor = rand(240);
  var objectState = { 
      materialUniforms: {
        u_colorMult:             chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        //u_diffuse:               texture,
        u_specular:              [1, 1, 1, 1],
        u_shininess:             450,
        u_specularFactor:        0.75,
        u_time:                  0,
      }
  };

  // some variables we'll reuse below
  var projectionMatrix = mat4.create();
  var viewMatrix = mat4.create();
  var rotationMatrix = mat4.create();
  var matrix = mat4.create();  // a scratch matrix
  var invMatrix = mat4.create();
  var axisVector = vec3.create();
  
  requestAnimationFrame(drawScene);
  
  // Draw the scene.
  function drawScene(time: number) {
    time *= 0.001;
    
    //Put the time into the object state
    objectState.materialUniforms.u_time = time;
    
    //These two lines moved down into drawScene, calling the desired programs
    var uniformSetters = createUniformSetters(gl, programs[shader]);
    var attribSetters  = createAttributeSetters(gl, programs[shader]); 
   
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
    mat4.perspective(projectionMatrix,fieldOfViewRadians, aspect, 1, 2000);

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
    if(stop == 1) {
      
      //Immediately "unpress"
      stop = 0;
      
      //Create two images
      
      var image0 = new Image();
      image0.src = "GreenScreen.jpg";
      image0.onload = function() {
        render0(image0);
      }
  
      var image1 = new Image();
      image1.src = "Warhammer.jpg";
      image1.onload = function() {
        render1(image1);
      }
      
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
  
        var textureUnitIndex =  "u_image" + 0;
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
      var yAxis = vec3.transformMat4(axisVector, vec3.fromValues(0,1,0), invMatrix);

      // rotate about teh world Y axis
      mat4.rotate(matrix, matrix, mouseAngles[0], yAxis);
      
      // save the resulting matrix back to the cumulative rotation matrix 
      mat4.copy(rotationMatrix, matrix);
      
      // use mouseAngles[1] to scale
      scaleFactor += mouseAngles[1];
      
      vec2.set(mouseAngles, 0, 0);        
    }   

    // add a translate and scale to the object World xform, so we have:  R * T * S
    mat4.translate(matrix, rotationMatrix, [-center[0]*scaleFactor, -center[1]*scaleFactor, 
                                            -center[2]*scaleFactor]);
    mat4.scale(matrix, matrix, [scaleFactor, scaleFactor, scaleFactor]);
    mat4.copy(uniformsThatAreComputedForEachObject.u_world, matrix);
    
    // get proj * view * world
    mat4.multiply(matrix, viewMatrix, uniformsThatAreComputedForEachObject.u_world);
    mat4.multiply(uniformsThatAreComputedForEachObject.u_worldViewProjection, projectionMatrix, matrix);

    // get worldInvTranspose.  For an explaination of why we need this, for fixing the normals, see
    // http://www.unknownroad.com/rtfm/graphics/rt_normals.html
    mat4.transpose(uniformsThatAreComputedForEachObject.u_worldInverseTranspose, 
                   mat4.invert(matrix, uniformsThatAreComputedForEachObject.u_world));

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

