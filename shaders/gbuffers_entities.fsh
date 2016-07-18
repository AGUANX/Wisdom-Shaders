// Copyright 2016 bobcao3 <bobcaocheng@163.com>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#version 130

uniform int fogMode;
uniform int entityHurt;
uniform sampler2D texture;
uniform sampler2D lightmap;

in vec4 color;
in vec4 texcoord;
in vec4 lmcoord;
flat in vec2 normal;

/* DRAWBUFFERS:024 */
void main() {
	if (entityHurt > 0) {
		gl_FragData[0] = texture2D(texture, texcoord.st) * color * vec4(1.0,0.5,0.5,1.0);
	} else {
		gl_FragData[0] = texture2D(texture, texcoord.st) * color;
	}
	gl_FragData[1] = vec4(normal, 0.0, 1.0);
	gl_FragData[2] = vec4(lmcoord.t, 0.74, lmcoord.s, 1.0);
}
