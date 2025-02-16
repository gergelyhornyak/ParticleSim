#include <emscripten.h>
#include <SDL3-3.2.4/include/SDL3/sdl.h>
#include <vector>
#include <cstdlib>
#include <ctime>

const int SCREEN_WIDTH = 800;
const int SCREEN_HEIGHT = 600;
const int NUM_PARTICLES = 100;

struct Particle {
    float x, y;
    float vx, vy;
};

std::vector<Particle> particles;
SDL_Window* window = nullptr;
SDL_Renderer* renderer = nullptr;

void initParticles() {
    particles.resize(NUM_PARTICLES);
    for (auto& p : particles) {
        p.x = rand() % SCREEN_WIDTH;
        p.y = rand() % SCREEN_HEIGHT;
        p.vx = (rand() % 5 - 2) / 2.0f;
        p.vy = (rand() % 5 - 2) / 2.0f;
    }
}

void updateParticles() {
    for (auto& p : particles) {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > SCREEN_WIDTH) p.vx = -p.vx;
        if (p.y < 0 || p.y > SCREEN_HEIGHT) p.vy = -p.vy;
    }
}

void renderParticles() {
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
    SDL_RenderClear(renderer);
    
    SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);
    for (const auto& p : particles) {
        SDL_RenderDrawPoint(renderer, static_cast<int>(p.x), static_cast<int>(p.y));
    }
    
    SDL_RenderPresent(renderer);
}

void mainLoop() {
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        if (event.type == SDL_QUIT) {
            emscripten_cancel_main_loop();
        }
    }
    
    updateParticles();
    renderParticles();
}

int main() {
    srand(time(nullptr));
    SDL_Init(SDL_INIT_VIDEO);
    window = SDL_CreateWindow("Particle Simulation", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, SCREEN_WIDTH, SCREEN_HEIGHT, SDL_WINDOW_SHOWN);
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    
    initParticles();
    
    emscripten_set_main_loop(mainLoop, 0, 1);
    
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
    
    return 0;
}
