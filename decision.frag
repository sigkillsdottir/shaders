#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// how much the space is warped
#define FBM_OCTAVES 1
// speed of the warping
#define FBM_TIME_FACTOR .0 // 0.5-0.9
// how much lines are inside the warps
#define TURBULENCE_OCTAVES 1 // 3, 20
// switch beat
#define ENABLE_BEAT 1
// beat scatter
#define BEAT_SCATTER 2.
// how much red is there, 0 is full red, 1. is black
// over 1. green
#define MIX_FACTOR 1. // def 0.4, go to 1., then 1.4
#define GREEN_BEAT .05 // 0.08
// final output, use to fade out, min 0.1
#define OUTPUT_ALPHA .2



float noise(in vec2 p)
{
    return sin(p.x)*sin(p.y);
}

float random(in vec2 st){
    return fract(sin(dot(st.xy,
                vec2(12.9898,78.233)))
            *43758.5453123);
}
        

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
    sin(angle),cos(angle));
}
// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

//
// Description : GLSL 2D simplex noise function
//      Author : Ian McEwan, Ashima Arts
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License :
//  Copyright (C) 2011 Ashima Arts. All rights reserved.
//  Distributed under the MIT License. See LICENSE file.
//  https://github.com/ashima/webgl-noise
//
float snoise(vec2 v) {

    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

float fbm(in vec2 _st){
    float time_factor = FBM_TIME_FACTOR*u_time;
    float inner_f = 10.*(_st)/_st;
  
    float v= .1*snoise(3.*_st+time_factor)+inner_f;
    float a=.5;
    vec2 shift=vec2(length(_st));
    // Rotate to reduce axial bias
    mat2 rot=mat2(cos(.5),sin(.5),
    -sin(.5),cos(.50));

    for(int i=0;i<FBM_OCTAVES;++i){
        v+=a*noise(_st);
        _st=rot*_st*2.+shift;
        a*=.5; // more jagged with 0.6
    }
    return v;
}


// #define OCTAVES 3
float turbulence (in vec2 st) {
    // Initial values
    float value = 0.;
    float amplitude = .4;
    float frequency = 0.;

    for (int i = 0; i < TURBULENCE_OCTAVES; i++) {
        // value += amplitude * abs(snoise(st));
        value += amplitude * abs(snoise(st));
        st *= 2.;
        amplitude *= .5;
    }

    return value;
}

void main() {

    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    st.x = st.x -1.5;
    st.y = st.y +.5;

    float beat = ENABLE_BEAT*mod(BEAT_SCATTER,abs(sin(u_time)));

    float red_value = (0.6+beat);
    vec3 color_red = vec3(red_value, .0, .0);
    vec3 color_dark = vec3(0., GREEN_BEAT*beat, 0.);

    vec2 p = st;
    float angle = fbm(p + fbm(p));
    vec2 pos = rotate2d(angle)*st;
    
    vec3 color_p = mix(color_red, color_dark, MIX_FACTOR);
    vec3 color = color_p + turbulence(pos);
    
    gl_FragColor = vec4(color, OUTPUT_ALPHA);
}
