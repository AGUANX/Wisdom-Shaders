#ifndef _INCLUDE_EFFECTS
#define _INCLUDE_EFFECTS

#ifdef MOTION_BLUR

#define MOTIONBLUR_MAX 0.1
#define MOTIONBLUR_STRENGTH 0.5
#define MOTIONBLUR_SAMPLE 6

const float dSample = 1.0 / float(MOTIONBLUR_SAMPLE);

void motion_blur(in sampler2D screen, inout vec3 color, in vec2 uv, in vec3 viewPosition) {
	vec4 worldPosition = gbufferModelViewInverse * vec4(viewPosition, 1.0) + vec4(cameraPosition, 0.0);
	vec4 prevClipPosition = gbufferPreviousProjection * gbufferPreviousModelView * (worldPosition - vec4(previousCameraPosition, 0.0));
	vec4 prevNdcPosition = prevClipPosition / prevClipPosition.w;
	vec2 prevUv = prevNdcPosition.st * 0.5 + 0.5;
	vec2 delta = uv - prevUv;
	float dist = length(delta) * 0.25;
	if (dist < 0.000025) return;
	delta = normalize(delta);
	dist = min(dist, MOTIONBLUR_MAX);
	int num_sams = int(dist / MOTIONBLUR_MAX * MOTIONBLUR_SAMPLE) + 1;
	dist *= MOTIONBLUR_STRENGTH;
	delta *= dist * dSample;
	for(int i = 1; i < num_sams; i++) {
		uv += delta;
		color += texture2D(screen, uv).rgb;
	}
	color /= float(num_sams);
}
#endif

vec3 applyEffect(float total, float size,
	float a00, float a01, float a02,
	float a10, float a11, float a12,
	float a20, float a21, float a22,
	sampler2D sam, vec2 uv) {
	
	vec3 color = texture2D(sam, uv).rgb * a11;

	color += texture2D(sam, uv + size * vec2(-pixel.x, pixel.y)).rgb * a00;
	color += texture2D(sam, uv + size * vec2(0.0, pixel.y)).rgb * a01;
	color += texture2D(sam, uv + size * pixel).rgb * a00;
	color += texture2D(sam, uv + size * vec2(-pixel.x, 0.0)).rgb * a00;
	color += texture2D(sam, uv + size * vec2(pixel.x, 0.0)).rgb * a00;
	color += texture2D(sam, uv - size * pixel).rgb * a00;
	color += texture2D(sam, uv + size * vec2(0.0, -pixel.y)).rgb * a01;
	color += texture2D(sam, uv + size * vec2(pixel.x, -pixel.y)).rgb * a00;
	
	return clamp(color / total, vec3(0.0), vec3(3.0));
}

#ifdef BLOOM

// 4x4 bicubic filter using 4 bilinear texture lookups 
// See GPU Gems 2: "Fast Third-Order Texture Filtering", Sigg & Hadwiger:
// http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter20.html

// w0, w1, w2, and w3 are the four cubic B-spline basis functions
float w0(float a)
{
    return (1.0/6.0)*(a*(a*(-a + 3.0) - 3.0) + 1.0);
}

float w1(float a)
{
    return (1.0/6.0)*(a*a*(3.0*a - 6.0) + 4.0);
}

float w2(float a)
{
    return (1.0/6.0)*(a*(a*(-3.0*a + 3.0) + 3.0) + 1.0);
}

float w3(float a)
{
    return (1.0/6.0)*(a*a*a);
}

// g0 and g1 are the two amplitude functions
float g0(float a)
{
    return w0(a) + w1(a);
}

float g1(float a)
{
    return w2(a) + w3(a);
}

// h0 and h1 are the two offset functions
float h0(float a)
{
    return -1.0 + w1(a) / (w0(a) + w1(a));
}

float h1(float a)
{
    return 1.0 + w3(a) / (w2(a) + w3(a));
}

vec4 texture_Bicubic(sampler2D tex, vec2 uv)
{

	uv = uv * vec2(viewWidth, viewHeight) + 0.5;
	vec2 iuv = floor( uv );
	vec2 fuv = fract( uv );

    float g0x = g0(fuv.x);
    float g1x = g1(fuv.x);
    float h0x = h0(fuv.x);
    float h1x = h1(fuv.x);
    float h0y = h0(fuv.y);
    float h1y = h1(fuv.y);

	vec2 texelSize = 1.0 / vec2(viewWidth, viewHeight);
	vec2 p0 = (vec2(iuv.x + h0x, iuv.y + h0y) + 0.5) * texelSize;
	vec2 p1 = (vec2(iuv.x + h1x, iuv.y + h0y) + 0.5) * texelSize;
	vec2 p2 = (vec2(iuv.x + h0x, iuv.y + h1y) + 0.5) * texelSize;
	vec2 p3 = (vec2(iuv.x + h1x, iuv.y + h1y) + 0.5) * texelSize;
	
    return g0(fuv.y) * (g0x * texture2D(tex, p0)  +
                        g1x * texture2D(tex, p1)) +
           g1(fuv.y) * (g0x * texture2D(tex, p2)  +
                        g1x * texture2D(tex, p3));
}

vec3 bloom() {
	vec2 tex_offset = vec2(1.0f / viewWidth, 1.0f / viewHeight);

	vec2 tex = (texcoord.st - tex_offset * 0.5f) * 0.25;
	vec3 color = texture_Bicubic(gcolor, tex).rgb;
	tex = texcoord.st * 0.125      + vec2(0.0f, 0.25f)	  + vec2(0.000f, 0.025f);
	color +=  texture_Bicubic(gcolor, tex).rgb;
	tex = (texcoord.st - tex_offset) * 0.0625     + vec2(0.125f, 0.25f)  + vec2(0.025f, 0.025f);
	color +=  texture_Bicubic(gcolor, tex).rgb;
	tex = (texcoord.st - tex_offset) * 0.03125    + vec2(0.1875f, 0.25f)	+ vec2(0.050f, 0.025f);
	color +=  texture_Bicubic(gcolor, tex).rgb * 0.8125;
	tex = (texcoord.st - tex_offset) * 0.015625   + vec2(0.21875f, 0.25f)+ vec2(0.075f, 0.025f);
	color +=  texture_Bicubic(gcolor, tex).rgb * 0.625;
	tex = (texcoord.st - tex_offset) * 0.0078125  + vec2(0.25f, 0.25f)   + vec2(0.100f, 0.025f);
	color +=  texture_Bicubic(gcolor, tex).rgb * 0.5;

	color *= 0.2;
	return color * smoothstep(0.0, 1.0, luma(color));
}
#endif

#endif