#include <stdio.h>
#include <stdlib.h>
#include <emscripten.h>

#define SCREEN_WIDTH 800
#define SCREEN_HEIGHT 600
#define SQUARE_SIZE 50

// Global variable for square position
int posX = 0;

// Function to move the square and update its position
void move_square() {
    posX += 5;
    if (posX > SCREEN_WIDTH) {
        posX = 0;
    }
}

// Exposed to JavaScript to render the square
void render_square() {
    move_square();
    EM_ASM({
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, $0, $1); // Clear the canvas
        ctx.fillStyle = "red";
        ctx.fillRect($2, $3, 50, 50); // Draw the square
    }, SCREEN_WIDTH, SCREEN_HEIGHT, posX, SCREEN_HEIGHT / 2 - SQUARE_SIZE / 2);
}

// Function to set up the game loop
void game_loop() {
    render_square();
}

// Main function
int main() {
    // Initialize the game loop (called continuously)
    emscripten_set_main_loop(game_loop, 0, 1);
    return 0;
}
