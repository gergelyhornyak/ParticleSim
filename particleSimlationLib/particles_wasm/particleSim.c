#include <stdlib.h>
#include <time.h>

#define SCREEN_WIDTH 800
#define SCREEN_HEIGHT 600
#define NUM_PARTICLES 100

typedef struct {
    float x, y;
    float vx, vy;
} Particle;

Particle particles[NUM_PARTICLES];

void initParticles() {
    srand(time(NULL));  
    for (int i = 0; i < NUM_PARTICLES; i++) {
        particles[i].x = rand() % SCREEN_WIDTH;
        particles[i].y = rand() % SCREEN_HEIGHT;
        particles[i].vx = (rand() % 5 - 2) / 2.0f;
        particles[i].vy = (rand() % 5 - 2) / 2.0f;
    }
}

void updateParticles() {
    for (int i = 0; i < NUM_PARTICLES; i++) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        
        if (particles[i].x < 0 || particles[i].x > SCREEN_WIDTH) particles[i].vx = -particles[i].vx;
        if (particles[i].y < 0 || particles[i].y > SCREEN_HEIGHT) particles[i].vy = -particles[i].vy;
    }
}

Particle* getParticles() {
    return particles;
}


// emcc particleSim.c -o particles.js -s EXPORTED_FUNCTIONS='["_initParticles", "_updateParticles", "_getParticles"]' -s MODULARIZE=1 -s ENVIRONMENT=web