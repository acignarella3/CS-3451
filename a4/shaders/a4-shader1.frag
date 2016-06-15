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

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              abs(l),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

//vec2 c = vec2(-1, 1);

void main() {
  // we aren't doing anything with texture coordinates, but can use them
  // as part of rendering
  
  //Instantiate c and z
  
  vec2 c = (v_texCoord * vec2(4, 4)) - vec2(2, 2);
  
  vec2 z = vec2(0, 0);
  
  //We will calculate the 20th value of the Mandlebrot series, for the sake
  //of consistency with what's been provided on T-Square
  for (int i = 0; i < 20; i++) {
    
    //Multiply z by itself, treating it as a complex number
    
    float F = z.x * z.x;
    float O = z.x * z.y;
    float I = z.y * z.x;
    float L = -(z.y * z.y); //-i * -i = -1, so negate
    
    z.x = F + L;
    z.y = O + I;
    
    //Add c onto z;
    z = z + c;
    
  }
  
  //Checking for if it's within our Mandlebrot set
  
  float check =  (z.x * z.x) + (z.y * z.y);
  
  vec4 newColor;
  
  if (check <= 4.0) {
    newColor = vec4(1, 0, 0, 1);
  } else {
    newColor = vec4(0, 0, 1, 1);
  }
  
  //No matter which color, implementing it is the same, except newColor replaces u_colorMult
  
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((u_lightColor * (litR.y * newColor +
                                        u_specular * litR.z * u_specularFactor)).rgb,
                        1.0);

  // use this one to color the surface grey based on the dot between the lights and normal     
  //gl_FragColor = vec4(dot(a_normal, surfaceToLight),dot(a_normal, surfaceToLight),dot(a_normal, surfaceToLight), 1);
  
  // the actual computed color
  gl_FragColor = outColor + u_ambient;
  //gl_FragColor = vec4(1, 0, 0, 1);
}
