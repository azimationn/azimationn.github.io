#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;
in vec3 normal;
in vec2 texCoord;
in vec4 v_color;

struct Material {
    sampler2D diffuse; // diffuse map (unused now)
    vec3 specular;    // surface specular color
    float shininess;  // specular shininess factor
};

struct Light {
    vec3 direction;
    vec3 ambient;  // ambient light strength
    vec3 diffuse;  // diffuse light strength
    vec3 specular; // specular light strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int toonLevels;

// Simple quantization function as requested
float quantize(float value, int levels) {
    if (levels <= 1) return 0.0;
    float step = 1.0 / float(levels);
    float color = floor(value / step) * step + step / 2.0;
    return color * 0.8;
}

void main() {
    // Base color from vertex attribute
    vec3 rgb = v_color.rgb;
    
    // ambient
    vec3 ambient = light.ambient * rgb;
    
    // diffuse with quantization
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    diff = quantize(diff, toonLevels);
    vec3 diffuse = light.diffuse * diff * rgb;
    
    // specular with quantization
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    spec = quantize(spec, toonLevels);
    vec3 specular = light.specular * spec * material.specular;
    
    // combine all lighting components
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}