export const HERO_GLOBE_VERTEX_SHADER = `
  attribute float aRand;
  uniform float uSize;
  uniform vec3 uHover;
  uniform float uHoverActive;
  uniform float uHoverRadius;
  uniform float uHoverPush;
  varying float vT;
  varying float vFace;
  varying float vR;
  varying float vLift;
  void main(){
    float dH = distance(position, uHover);
    float infl = uHoverActive * smoothstep(uHoverRadius, 0.0, dH);
    vLift = infl;
    vec3 n = normalize(position);
    vec3 dir = position - uHover;
    dir = dir - n * dot(dir, n);
    float dl = length(dir);
    vec3 pos = position + (dl > 0.0001 ? dir / dl : vec3(0.0)) * infl * uHoverPush;
    vec4 wp = modelMatrix * vec4(pos,1.0);
    vT = clamp((wp.x/2.0 + 1.0)*0.5, 0.0, 1.0);
    vec3 wn = normalize(mat3(modelMatrix)*normalize(pos));
    vec3 vd = normalize(cameraPosition - wp.xyz);
    vFace = dot(wn, vd);
    vR = aRand;
    vec4 mv = modelViewMatrix * vec4(pos,1.0);
    gl_PointSize = uSize * (1.0 + aRand*0.5) * (3.6 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`

export const HERO_GLOBE_FRAGMENT_SHADER = `
  varying float vT;
  varying float vFace;
  varying float vR;
  varying float vLift;
  vec3 grad(float t){
    vec3 c0=vec3(0.94,0.24,0.48);
    vec3 c1=vec3(0.95,0.29,0.30);
    vec3 c2=vec3(0.96,0.38,0.18);
    vec3 c3=vec3(0.98,0.50,0.12);
    vec3 c4=vec3(1.00,0.62,0.20);
    if(t<0.25) return mix(c0,c1,t/0.25);
    if(t<0.50) return mix(c1,c2,(t-0.25)/0.25);
    if(t<0.75) return mix(c2,c3,(t-0.50)/0.25);
    return mix(c3,c4,(t-0.75)/0.25);
  }
  void main(){
    vec2 uv = gl_PointCoord-0.5;
    float d = length(uv);
    float circle = smoothstep(0.5,0.18,d);
    float face = mix(0.14, 1.0, smoothstep(-0.7,0.5,vFace));
    float a = circle*face*(0.55+vR*0.45);
    if(a<0.015) discard;
    gl_FragColor = vec4(grad(vT), a);
  }`

/** Screen-space offsets for multi-pass arc thickness (px). */
export const HERO_GLOBE_ARC_LINE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.6, 0],
  [-0.6, 0],
  [0, 0.6],
  [0, -0.6],
]

export const HERO_GLOBE_ARC_VERTEX_SHADER = `
  attribute vec3 aRadial;
  uniform vec2 uPxOffset;
  uniform vec2 uResolution;
  varying float vFace;
  void main(){
    vec4 wp = modelMatrix * vec4(position,1.0);
    vec3 wn = normalize(mat3(modelMatrix) * aRadial);
    vec3 vd = normalize(cameraPosition - wp.xyz);
    vFace = dot(wn, vd);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    clip.xy += uPxOffset * (2.0 / uResolution) * clip.w;
    gl_Position = clip;
  }`

export const HERO_GLOBE_ARC_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFace;
  void main(){
    float face = mix(0.12, 1.0, smoothstep(-0.6, 0.45, vFace));
    gl_FragColor = vec4(uColor, uOpacity * face);
  }`
