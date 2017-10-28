#ifndef _INCLUDE_MATERIAL
#define _INCLUDE_MATERIAL

//==============================================================================
// Material
//==============================================================================

struct Material {
	vec3 vpos;
	vec3 nvpos;
	vec3 wpos;
	float cdepth;
	float cdepthN;
	vec3 N;
	vec3 Nflat;

	vec3 albedo;

	float skylight;
	float torchlight;

	float metalic;
	float roughness;
	float emmisive;
	float opaque;
};

void material_build(
	out Material mat,
	in vec3 vpos, in vec3 wpos, in vec3 N, in vec3 N2,
	in vec3 albedo, in vec3 specular, in vec2 lmcoord
) {
	mat.vpos = vpos;
	mat.nvpos = normalize(vpos);
	mat.wpos = wpos;
	mat.N = N;
	mat.Nflat = N2;

	mat.albedo = albedo;

	mat.skylight = lmcoord.y;
	mat.torchlight = lmcoord.x;

	mat.cdepth = length(vpos);
	mat.cdepthN = length(vpos) / far;

	mat.roughness = clamp(1.0 - specular.r, 0.0001f, 0.9999f);
	mat.metalic = clamp(specular.g, 0.0001f, 0.9999f);
	mat.emmisive = specular.b;
}

void material_sample(out Material mat, in vec2 uv, out float flag) {
	vec4 vpos = fetch_vpos(uv, depthtex1);
	vec3 normal = texture2D(gaux1, uv).rgb;
  flag = normal.b;
  normal = normalDecode(normal.rg);
	vec4 spec = texture2D(colortex1, uv);
	vec4 color = texture2D(colortex0, uv);
	vec4 n2 = texture2D(colortex2, uv);
	material_build(
		mat,
		vpos.xyz, (gbufferModelViewInverse * vpos).xyz, normal, normalDecode(n2.rg),
		fromGamma(color.rgb), spec.rgb, n2.ba
	);
	mat.opaque = color.a;
}

//==============================================================================
// Mask
//==============================================================================

struct Mask {
	float flag;

	bool is_valid;
	bool is_water;
	bool is_trans;
	bool is_plant;
	bool is_sky;
	bool is_entity;
};

void init_mask(inout Mask m, in float flag, in vec2 uv) {
	m.flag = flag;

	m.is_sky = maskFlag(flag, airFlag);
	m.is_water = maskFlag(flag, waterFlag);
	m.is_trans = maskFlag(flag, transparentFlag);
	m.is_valid = flag > 0.01;
	m.is_plant = maskFlag(flag, foilage1Flag) || maskFlag(flag, foilage2Flag);
	m.is_entity = maskFlag(flag, entityFlag);
}
#endif