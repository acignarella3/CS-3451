precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_colorMult;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;
uniform vec4 u_ambient;

uniform sampler2D u_image0;
uniform sampler2D u_image1;
uniform vec2 u_textureSize;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              abs(l),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  // we aren't doing anything with texture coordinates, but can use them
  // as part of rendering
  
  //Since v_texCoord cannot be directly manipulated, create a temp vec2 for subtraction
  //Without this change, the images come up upside-down
  
  vec2 temp;
  
  temp.x = 1.0 - v_texCoord.x;
  temp.y = 1.0 - v_texCoord.y;
  
  //Attempted code for creating blends have been left in but commented out
  
  //vec4 color0 = texture2D(u_image0, temp);
  //vec4 color1 = texture2D(u_image1, temp);
  
  /*vec4 useColor;
  
  if (color0.r + color0.b <= color0.g) {
  
    useColor = color1;
    
  } else {
  
    useColor = color0;
    
  }*/
  
  //vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
  
  //Get the colors for both images at this point
  vec4 colorB = texture2D(u_image0, temp);
  vec4 colorF = texture2D(u_image1, temp);
  
  /*vec4 color1 = texture2D(u_image0, v_texCoord + onePixel * vec2(-1, -1));
  vec4 color2 = texture2D(u_image0, v_texCoord + onePixel * vec2(0, -1));
  vec4 color3 = texture2D(u_image0, v_texCoord + onePixel * vec2(1, -1));
  vec4 color4 = texture2D(u_image0, v_texCoord + onePixel * vec2(-1, 0));
  vec4 color5 = texture2D(u_image0, v_texCoord + onePixel * vec2(1, 0));
  vec4 color6 = texture2D(u_image0, v_texCoord + onePixel * vec2(-1, 1));
  vec4 color7 = texture2D(u_image0, v_texCoord + onePixel * vec2(0, 1));
  vec4 color8 = texture2D(u_image0, v_texCoord + onePixel * vec2(1, 1));
  
  vec4 neighborhood[8] = [color1, color2, color3, color4, color5, color6, color7, color 8];
  
  float g = 0.0;
  
  for (int i = 0; i < 8; i++) {
  
    if (neighborhood[i].r + neighborhood[i].b <= neighborhood[i].g) {
    
      g++;
      
    }
    
  }*/
  
  vec4 useColor;
  
  //Simple check: use the background color if it's more green than anything else,
  //and the foreground color otherwise.
  
  if (colorB.r + colorB.b <= colorB.g) {
  
    useColor = colorF;  // + ((g / 8.0) * colorB);
    
  } else {
  
    useColor = colorB;  // + ((g / 8.0) * colorF);
    
  }
  
  /*if (colorB.r + colorB.b <= colorB.g) {
  
    useColor = (0.5 * colorB) + (0.5 * colorB * colorB) + ((0.5 - 0.5 * colorB) * colorF);
    
  } else {
  
    useColor = (0.5 * colorF) + (0.5 * colorF * colorF) + ((0.5 - 0.5 * colorF) * colorB);
    
  }*/
  
  //Same code, but replace u_colorMult again
  
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((u_lightColor * (litR.y * useColor +
                                        u_specular * litR.z * u_specularFactor)).rgb,
                        1.0);

  // use this one to color the surface grey based on the dot between the lights and normal     
  //gl_FragColor = vec4(dot(a_normal, surfaceToLight),dot(a_normal, surfaceToLight),dot(a_normal, surfaceToLight), 1);
  
  // the actual computed color
  gl_FragColor = outColor + u_ambient;
  //gl_FragColor = vec4(0, 0, 1, 1);
}
