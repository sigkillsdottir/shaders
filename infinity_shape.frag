#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;


mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
    sin(angle),cos(angle));
}



float sine_curve(vec2 base, float freq, float amp, float offset) {
    vec2 _uv = amp * sin(base * freq) + offset;
    return _uv.x*_uv.y;
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



#define OCTAVES 5
// #define OCTAVES 3
float turbulence (in vec2 st) {
    // Initial values
    float value = 0.;
    float amplitude = 0.5;
    float frequency = 0.;

    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * abs(snoise(st));
        st *= 2.;
        amplitude *= .5;
    }

    return value;
}

float lines(in vec2 pos,float b){
    float scale=2.;
    pos*=scale;

    return smoothstep(0.,
            turbulence(pos)*0.6+b*0.02,
            abs((sin(pos.x*PI*0.28)+snoise(vec2(b*2.)))));
}


void main(void){
    vec2 st=gl_FragCoord.xy/u_resolution.x;
    st.y*=0.9*u_resolution.x/u_resolution.y;
    st *= 3.;
    
    vec2 p = vec2(1.5, 1.25)-st;
    float r = length(p);
    float a = atan(p.x,p.y);
    st = vec2(r, a);
    
    float angle = sine_curve(st, 3., .5, 0.18);
    vec2 pos = rotate2d(angle)*st;

    float lines1 = lines(pos, 0.);
    vec3 color=vec3(lines1);

    gl_FragColor=vec4(color,1.0);
}
