#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

uniform vec2 u_resolution;
uniform float u_time;

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

#define NUM_OCTAVES 7

float fbm(in vec2 _st){
    float v= 2.*abs(sin(.01*u_time));
    float a=2.;//*length(_st);
    vec2 shift=vec2(100.);
    // Rotate to reduce axial bias
    mat2 rot=mat2(cos(.5),sin(.5),
    -sin(.5),cos(.50));
    for(int i=0;i<NUM_OCTAVES;++i){
        v+=a*noise(_st);
        _st=rot*_st*2.+shift;
        a*=.5;
    }
    return v;
}


float lines(in vec2 pos,float b){
    float scale=2.+(u_time*0.002);
    pos*=scale;
    float time_factor = sin(u_time*0.5)*0.4;

    return smoothstep(0.,
            .07+b*0.02,
            abs((sin(pos.x*PI*0.2)+noise(vec2(b*2.)))));
}
    
void main(void){
    vec2 st=gl_FragCoord.xy/u_resolution.x;
    st.y*=u_resolution.y/u_resolution.x;

    vec3 color_bg=vec3(0.0157, 0.1451, 0.1725);
    vec3 color_gold=vec3(0.8118, 0.7137, 0.1569);
    vec3 color_brown = vec3(0.4078, 0.3333, 0.0941);

    float angle = fbm(st)*7.;
    vec2 pos = rotate2d(angle)*st; 
    vec3 color_lines=vec3(lines(pos, 0.2));
    vec3 color = mix(max(color_lines, color_bg), color_brown, 3.);
    
    gl_FragColor=vec4(color,(random(st)+.85));
}
