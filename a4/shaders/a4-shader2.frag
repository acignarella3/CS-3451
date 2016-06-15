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
uniform float u_time; //Added for use

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              abs(l),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  // we aren't doing anything with texture coordinates, but can use them
  // as part of rendering
  
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((u_lightColor * (litR.y * vec4(0, 1, 0, 0.5) +
                                        u_specular * litR.z * u_specularFactor)).rgb,
                        1.0);
                        
  //u_colorMult has been replaced with a single vec4 in order to ensure a consistent scenario,
  //since originally the effect would change depending on the default color..
  //You need to flip it around to see the effect, but that makes sense. The light starts behind the object,
  //and the "x-ray" should only be "one-way" since it's from the light.

  //Determine the "lightness", using the equation described for brightness checking
  float lightness = (0.2 * outColor.r) + (0.7 * outColor.g) + (0.1 * outColor.b);
  
  //The sine wave is arbitrarily calculated to create the best effect
  //If this value is less than our "lightness", remove it.
  if ((sin(u_time) * 0.1 + 0.89) < lightness) {
    discard;
  }

  // use this one to color the surface grey based on the dot between the lights and normal     
  //gl_FragColor = vec4(dot(a_normal, surfaceToLight),dot(a_normal, surfaceToLight),dot(a_normal, surfaceToLight), 1);
  
  // the actual computed color
  gl_FragColor = outColor + u_ambient;
  //gl_FragColor = vec4(0, 1, 0, 1);
}
