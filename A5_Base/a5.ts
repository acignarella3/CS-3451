///<reference path='./typings/tsd.d.ts'/>
///<reference path="./localTypings/webglutils.d.ts"/>

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

// get some of our canvas elements that we need
var canvas = <HTMLCanvasElement>document.getElementById("webgl");

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

//Letters is an array that will store up to 15 letters
//Textures is an array that will store all the textures

var letters = [];
var textures = [];

//The world width and height are saved globally

var worldHeight;
var worldWidth;

window["reset"] = () => {
  
  //When the button is pressed, just create a new array
  
  letters = [];
  
}

//Rectangle is the rect found in offset saved globally

var rectangle = undefined;

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
        
    rectangle = rect;

    return vec2.fromValues(offsetX, offsetY);
}

var mouseStart = undefined;  // previous mouse position
var mouseDelta = undefined;  // the amount the mouse has moved
//var mouseAngles = vec2.create();  // angle offset corresponding to mouse movement

var mouseClickVector = undefined; //The mouse position converted to world coordinates and put in a vector

// start things off with a down press
canvas.onmousedown = (ev: MouseEvent) => {
    mouseStart = offset(ev);        
    mouseDelta = vec2.create();  // initialize to 0,0
   //vec2.set(mouseAngles, 0, 0);
    
}

// // stop things with a mouse release
canvas.onmouseup = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      
        const clickEnd = offset(ev);
        vec2.sub(mouseDelta, clickEnd, mouseStart);        // delta = end - start
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
        temp[0] = temp[0] - (width/2);
        temp[1] = 1 - temp[1] + (height/2);
        
        //Get new x and y for the mouseClickVector
        var x = (temp[0] / width) * worldWidth;
        var y = (temp[1] / height) * worldHeight;
        
        //Make a vec4 (x is negated for correcting issues)
        mouseClickVector = vec4.fromValues(-x, y, 0, 1);
        
    }
}

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

window.onkeydown = (ev: KeyboardEvent) => {
  
  var flag = 0;           //Flag to see if a valid key has been pressed
  var isShifted = 0;      //Check to see if shift is held
  var code;               //Storing the proper keycode
  
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
    
    } else if (ev.keyCode == 32) {
      
      //Saving keycode for space
      code = ev.keyCode;
    
    } else if (ev.keyCode == 49) {
      
      //This is the exclamation point, so we need to check for shift
      if (ev.shiftKey) {
    
        isShifted = 1;
    
        code = ev.keyCode;
        
      } else {
        
        //Flag for hitting 1
        flag = 1;
        
      }
    
    } else {
      
      //Flag for not hitting a valid key
      flag = 1;
    
    }
    
  } else {
    
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
    
  } else {
    
    //Even if flagged, we could just be holding shift
    //If not, play the buzzer sound
    if (!ev.shiftKey) {
      
      var badSound = new Howl({
        urls: ['buzzer.mp3']
      }).play();
      
    }
    
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
  loader.loadFiles(['shaders/a3-shader.vert', 'shaders/a3-shader.frag'], function (shaderText) {
    var program = createProgramFromSources(gl, shaderText);
    main(gl, program);
  }, function (url) {
      alert('Shader failed to download "' + url + '"');
  }); 
}

// webGL is set up, and our Shader program has been created.  Finish setting up our webGL application       
function main(gl: WebGLRenderingContext, program: WebGLProgram) {
  
  // use the webgl-utils library to create setters for all the uniforms and attributes in our shaders.
  // It enumerates all of the uniforms and attributes in the program, and creates utility functions to 
  // allow "setUniforms" and "setAttributes" (below) to set the shader variables from a javascript object. 
  // The objects have a key for each uniform or attribute, and a value containing the parameters for the
  // setter function
  var uniformSetters = createUniformSetters(gl, program);
  var attribSetters  = createAttributeSetters(gl, program);

  // an indexed quad
  var arrays = {
     position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
     //texcoord: { numComponents: 2, data: [0, 0, 1, 0, 0, 1, 1, 1],                 },
     //texcoord: { numComponents: 2, data: [0, 1, 1, 1, 0, 0, 1, 0],                 },
     texcoord: { numComponents: 2, data: [1, 1, 0, 1, 1, 0, 0, 0],                   },
     normal:   { numComponents: 3, data: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], },
     indices:  { numComponents: 3, data: [0, 1, 2, 1, 3, 2],                       },
  };
  var center = [5,5,0];
  var scaleFactor = 2;
  
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

  var baseColor = rand(240);
  var objectState = { 
      materialUniforms: {
        u_colorMult:             chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        //u_colorMult:             [0, 1, 0, 1],
        //u_diffuse:               null,//texture,
        u_specular:              [1, 1, 1, 1],
        u_shininess:             450,
        u_specularFactor:        0.75,
        u_image:                 undefined,
        //u_lineColor:             [0, 0, 0, 0],
      }
  };

  // some variables we'll reuse below
  var projectionMatrix = mat4.create();
  var viewMatrix = mat4.create();
  var rotationMatrix = mat4.create();
  var matrix = mat4.create();  // a scratch matrix
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
  lowercaseA.onload = function() {
    render(lowercaseA, 0);
  }
  
  var lowercaseB = new Image();
  lowercaseB.src = "fixedImages/LowercaseB.png";
  lowercaseB.onload = function() {
    render(lowercaseB, 1);
  }
  
  var lowercaseC = new Image();
  lowercaseC.src = "fixedImages/LowercaseC.png";
  lowercaseC.onload = function() {
    render(lowercaseC, 2);
  }
  
  var lowercaseD = new Image();
  lowercaseD.src = "fixedImages/LowercaseD.png";
  lowercaseD.onload = function() {
    render(lowercaseD, 3);
  }
  
  var lowercaseE = new Image();
  lowercaseE.src = "fixedImages/LowercaseE.png";
  lowercaseE.onload = function() {
    render(lowercaseE, 4);
  }
  
  var lowercaseF = new Image();
  lowercaseF.src = "fixedImages/LowercaseF.png";
  lowercaseF.onload = function() {
    render(lowercaseF, 5);
  }
  
  var lowercaseG = new Image();
  lowercaseG.src = "fixedImages/LowercaseG.png";
  lowercaseG.onload = function() {
    render(lowercaseG, 6);
  }
  
  var lowercaseH = new Image();
  lowercaseH.src = "fixedImages/LowercaseH.png";
  lowercaseH.onload = function() {
    render(lowercaseH, 7);
  }
  
  var lowercaseI = new Image();
  lowercaseI.src = "fixedImages/LowercaseI.png";
  lowercaseI.onload = function() {
    render(lowercaseI, 8);
  }
  
  var lowercaseJ = new Image();
  lowercaseJ.src = "fixedImages/LowercaseJ.png";
  lowercaseJ.onload = function() {
    render(lowercaseJ, 9);
  }
  
  var lowercaseK = new Image();
  lowercaseK.src = "fixedImages/LowercaseK.png";
  lowercaseK.onload = function() {
    render(lowercaseK, 10);
  }
  
  var lowercaseL = new Image();
  lowercaseL.src = "fixedImages/LowercaseL.png";
  lowercaseL.onload = function() {
    render(lowercaseL, 11);
  }
  
  var lowercaseM = new Image();
  lowercaseM.src = "fixedImages/LowercaseM.png";
  lowercaseM.onload = function() {
    render(lowercaseM, 12);
  }
  
  var lowercaseN = new Image();
  lowercaseN.src = "fixedImages/LowercaseN.png";
  lowercaseN.onload = function() {
    render(lowercaseN, 13);
  }
  
  var lowercaseO = new Image();
  lowercaseO.src = "fixedImages/LowercaseO.png";
  lowercaseO.onload = function() {
    render(lowercaseO, 14);
  }
  
  var lowercaseP = new Image();
  lowercaseP.src = "fixedImages/LowercaseP.png";
  lowercaseP.onload = function() {
    render(lowercaseP, 15);
  }
  
  var lowercaseQ = new Image();
  lowercaseQ.src = "fixedImages/LowercaseQ.png";
  lowercaseQ.onload = function() {
    render(lowercaseQ, 16);
  }
  
  var lowercaseR = new Image();
  lowercaseR.src = "fixedImages/LowercaseR.png";
  lowercaseR.onload = function() {
    render(lowercaseR, 17);
  }
  
  var lowercaseS = new Image();
  lowercaseS.src = "fixedImages/LowercaseS.png";
  lowercaseS.onload = function() {
    render(lowercaseS, 18);
  }
  
  var lowercaseT = new Image();
  lowercaseT.src = "fixedImages/LowercaseT.png";
  lowercaseT.onload = function() {
    render(lowercaseT, 19);
  }
  
  var lowercaseU = new Image();
  lowercaseU.src = "fixedImages/LowercaseU.png";
  lowercaseU.onload = function() {
    render(lowercaseU, 20);
  }
  
  var lowercaseV = new Image();
  lowercaseV.src = "fixedImages/LowercaseV.png";
  lowercaseV.onload = function() {
    render(lowercaseV, 21);
  }
  
  var lowercaseW = new Image();
  lowercaseW.src = "fixedImages/LowercaseW.png";
  lowercaseW.onload = function() {
    render(lowercaseW, 22);
  }
  
  var lowercaseX = new Image();
  lowercaseX.src = "fixedImages/LowercaseX.png";
  lowercaseX.onload = function() {
    render(lowercaseX, 23);
  }
  
  var lowercaseY = new Image();
  lowercaseY.src = "fixedImages/LowercaseY.png";
  lowercaseY.onload = function() {
    render(lowercaseY, 24);
  }
  
  var lowercaseZ = new Image();
  lowercaseZ.src = "fixedImages/LowercaseZ.png";
  lowercaseZ.onload = function() {
    render(lowercaseZ, 25);
  }
  
  var uppercaseA = new Image();
  uppercaseA.src = "fixedImages/UppercaseA.png";
  uppercaseA.onload = function() {
    render(uppercaseA, 26);
  }
  
  var uppercaseB = new Image();
  uppercaseB.src = "fixedImages/UppercaseB.png";
  uppercaseB.onload = function() {
    render(uppercaseB, 27);
  }
  
  var uppercaseC = new Image();
  uppercaseC.src = "fixedImages/UppercaseC.png";
  uppercaseC.onload = function() {
    render(uppercaseC, 28);
  }
  
  var uppercaseD = new Image();
  uppercaseD.src = "fixedImages/UppercaseD.png";
  uppercaseD.onload = function() {
    render(uppercaseD, 29);
  }
  
  var uppercaseE = new Image();
  uppercaseE.src = "fixedImages/UppercaseE.png";
  uppercaseE.onload = function() {
    render(uppercaseE, 30);
  }
  
  var uppercaseF = new Image();
  uppercaseF.src = "fixedImages/UppercaseF.png";
  uppercaseF.onload = function() {
    render(uppercaseF, 31);
  }
  
  var uppercaseG = new Image();
  uppercaseG.src = "fixedImages/UppercaseG.png";
  uppercaseG.onload = function() {
    render(uppercaseG, 32);
  }
  
  var uppercaseH = new Image();
  uppercaseH.src = "fixedImages/UppercaseH.png";
  uppercaseH.onload = function() {
    render(uppercaseH, 33);
  }
  
  var uppercaseI = new Image();
  uppercaseI.src = "fixedImages/UppercaseI.png";
  uppercaseI.onload = function() {
    render(uppercaseI, 34);
  }
  
  var uppercaseJ = new Image();
  uppercaseJ.src = "fixedImages/UppercaseJ.png";
  uppercaseJ.onload = function() {
    render(uppercaseJ, 35);
  }
  
  var uppercaseK = new Image();
  uppercaseK.src = "fixedImages/UppercaseK.png";
  uppercaseK.onload = function() {
    render(uppercaseK, 36);
  }
  
  var uppercaseL = new Image();
  uppercaseL.src = "fixedImages/UppercaseL.png";
  uppercaseL.onload = function() {
    render(uppercaseL, 37);
  }
  
  var uppercaseM = new Image();
  uppercaseM.src = "fixedImages/UppercaseM.png";
  uppercaseM.onload = function() {
    render(uppercaseM, 38);
  }
  
  var uppercaseN = new Image();
  uppercaseN.src = "fixedImages/UppercaseN.png";
  uppercaseN.onload = function() {
    render(uppercaseA, 39);
  }
  
  var uppercaseO = new Image();
  uppercaseO.src = "fixedImages/UppercaseO.png";
  uppercaseO.onload = function() {
    render(uppercaseO, 40);
  }
  
  var uppercaseP = new Image();
  uppercaseP.src = "fixedImages/UppercaseP.png";
  uppercaseP.onload = function() {
    render(uppercaseP, 41);
  }
  
  var uppercaseQ = new Image();
  uppercaseQ.src = "fixedImages/UppercaseQ.png";
  uppercaseQ.onload = function() {
    render(uppercaseQ, 42);
  }
  
  var uppercaseR = new Image();
  uppercaseR.src = "fixedImages/UppercaseR.png";
  uppercaseR.onload = function() {
    render(uppercaseR, 43);
  }
  
  var uppercaseS = new Image();
  uppercaseS.src = "fixedImages/UppercaseS.png";
  uppercaseS.onload = function() {
    render(uppercaseS, 44);
  }
  
  var uppercaseT = new Image();
  uppercaseT.src = "fixedImages/UppercaseT.png";
  uppercaseT.onload = function() {
    render(uppercaseT, 45);
  }
  
  var uppercaseU = new Image();
  uppercaseU.src = "fixedImages/UppercaseU.png";
  uppercaseU.onload = function() {
    render(uppercaseU, 46);
  }
  
  var uppercaseV = new Image();
  uppercaseV.src = "fixedImages/UppercaseV.png";
  uppercaseV.onload = function() {
    render(uppercaseV, 47);
  }
  
  var uppercaseW = new Image();
  uppercaseW.src = "fixedImages/UppercaseW.png";
  uppercaseW.onload = function() {
    render(uppercaseW, 48);
  }
  
  var uppercaseX = new Image();
  uppercaseX.src = "fixedImages/UppercaseX.png";
  uppercaseX.onload = function() {
    render(uppercaseX, 49);
  }
  
  var uppercaseY = new Image();
  uppercaseY.src = "fixedImages/UppercaseY.png";
  uppercaseY.onload = function() {
    render(uppercaseY, 50);
  }
  
  var uppercaseZ = new Image();
  uppercaseZ.src = "fixedImages/UppercaseZ.png";
  uppercaseZ.onload = function() {
    render(uppercaseZ, 51);
  }
  
  var exclamation = new Image();
  exclamation.src = "fixedImages/ExclamationPoint.png";
  exclamation.onload = function() {
    render(exclamation, 52);
  }
  
  var space = new Image();
  space.src = "fixedImages/Space.png";
  space.onload = function() {
    render(space, 53);
  }
  
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
  function drawScene(time: number) {
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
    mat4.perspective(projectionMatrix,fieldOfViewRadians, aspect, 1, 2000);

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
            
          } else {
            
            //If shifted, then add 26 to correct
            n = letters[i].keycode - 65 + 26;
            
          }
          
        } else if (letters[i].keycode == 49 && letters[i].shift == 1) {
          
          //If these conditions are satisifed, then we have an exclamation point
          //(there shouldn't be a case where one is but the other isn't)
          n = 52;
          
        } else {
          
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
          
        } else {
          
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
              
            } else {
              
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
            
          } else {
            
            spins = 4;
            
          }
          
          //Janky way of controlling time spun
          if (letters[i].time < spins) {
            
            //Janky way of creating deceleration
            if (letters[i].time < letters[i].degree) {
            
              mat4.rotateY(matrix, matrix, degToRad(360 * (letters[i].time / letters[i].degree)));
              
            } else if (letters[i].time < 2 * letters[i].degree) {
              
              mat4.rotateY(matrix, matrix, degToRad((360 * (letters[i].time / (letters[i].degree * 2))) + 180));
              
            } else {
              
              mat4.rotateY(matrix, matrix, degToRad(360 * ((letters[i].time / (letters[i].degree * 4)))));
              
            }
            
            //Increment time
            letters[i].time += 0.01;
            
          } else {
            
            //If we're done spinning, then set all these values back to 0
            
            letters[i].time = 0;
            
            letters[i].isSpinning = 0;
            
            letters[i].degree = 0;
            
          }
          
        }

        // add a translate and scale to the object World xform, so we have:  R * T * S
        mat4.translate(matrix, matrix, [-center[0]*scaleFactor, -center[1]*scaleFactor, 
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
        
        //This array doesn't necessarily need to be enabled, but it's good just in case
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "a_position"));
        
        //This code for drawing lines is taken from here:
        //http://www.codeproject.com/Articles/594222/LineplusinplusWebGLplusandpluswhyplusyouplusgonnap
        //5.0 seems to be the magic number, both for keeping the line centered and
        //for having the least noticeable effect during y-rotation
        var vtx = new Float32Array(
                [5.0, 0.0, 0.0, 
                 5.0, worldHeight, 0.0]
            );
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
class Letter {
  
  isSpinning:   number;       //States whether or not it's currently spinning
  degree:       number;       //States which degree it's spinning (0 if not)
  time:         number;       //Saves the time used to keep track of spins (0 if not)
  x:            number;       //X-coordinate
  y:            number;       //Y-coordinate
  shift:        number;       //Flag for whether or not shift was held
  keycode:      number;       //Integer code corresponding to a key
  tilt:         number;       //Degree of tilting
  
  constructor(shift, keycode) {
    
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

}

//This helper function sets up the x coordinate for each letter
//This is called every time a new letter is added, since the x values need to be updated
//to create the desired positioning
var setX = function(i: number) {
    
    letters[i].x = -(((worldWidth / (letters.length + 1)) * (i + 1)) - (worldWidth / 2));
    
 }