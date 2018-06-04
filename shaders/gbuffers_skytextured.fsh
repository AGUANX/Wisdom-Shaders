/*
 * Copyright 2017 Cheng Cao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// =============================================================================
//  PLEASE FOLLOW THE LICENSE AND PLEASE DO NOT REMOVE THE LICENSE HEADER
// =============================================================================
//  ANY USE OF THE SHADER ONLINE OR OFFLINE IS CONSIDERED AS INCLUDING THE CODE
//  IF YOU DOWNLOAD THE SHADER, IT MEANS YOU AGREE AND OBSERVE THIS LICENSE
// =============================================================================

#version 120
#pragma optimize(on)

uniform sampler2D tex;

varying vec2 texcoord;

#include "libs/encoding.glsl"

/* DRAWBUFFERS:04 */
void main() {
	vec4 color = texture2D(tex, texcoord);
	color.rgb = pow(color.rgb, vec3(2.2));
	
	gl_FragData[0] = color;
	gl_FragData[1] = vec4(0.0, 0.0, airFlag, 1.0);
}
