uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying vec2 v_texCoord;

uniform float u_time; //Added in

void main() {

  //Attempted code to fix normals has been left

  /*vec3 temp = a_normal;
  
  vec2 tan = (1, cos(temp.x)) / sqrt(1 + (cos(x))^2);
  
  temp.x = tan.x;
  temp.z = tan.y;
  
  temp = normalize(temp);*/
  
  //The only addition has been creating a temp vec4 for a_position, and then
  //modifying that temp's z based on the sine of it's x and time

  v_texCoord = a_texcoord;
  vec4 use = a_position;
  use.y += sin(use.x + u_time); //Add-on for warble
  v_position = (u_worldViewProjection * use);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  //v_normal = (u_worldInverseTranspose * vec4(temp, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * use).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * use)).xyz;
  gl_Position = v_position;
}