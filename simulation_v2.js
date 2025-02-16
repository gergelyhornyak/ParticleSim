
const canvas = document.getElementById("simCanvas");
const terminal = document.getElementById("commandOutput");
const ctx = canvas.getContext("2d");

canvas.width = 1600;
canvas.height = 950;

let aliveParticles = 0;
let detectRadius = 500;
let numOfParticles = 4000;  
let minMass = 1;
let maxMass = 5;
let GRAVITY = 0.5;
let minRadius = 7;
let maxRadius = 10;
let numOfGroups = 5;
let colours = ["#39FF14","yellow","orange","cyan", "#f000ff", "#2323FF", "white"];
let paused=false; // boolean
let step=false;
let clearCanvas=true;
let mouseX = 0;
let mouseY = 0;
let selectedParticle = {pid:0};
let particleSelected = false;
let fullscreen = false;
let vertices = false;
let particles = [];

function draw(particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 1+Math.floor(particle.power/2), 0, Math.PI * 2);
    ctx.fillStyle = particle.colour;
    ctx.fill();
    ctx.closePath();
    // draw lines to other particle to show relation
}

function updateParticle(particleA) {
    if( particleA.x < 0 ){
        particleA.x = 1 ;
    }
    // right
    if( particleA.x > canvas.width ){
        particleA.x = canvas.width-1;
    }
    // top
    if( particleA.y < 0 ){
        particleA.y = 1;
    }
    // bottom
    if( particleA.y > canvas.height){
        particleA.y = canvas.height-1;
    }
    particleA.xVelocity = (Math.random()*2-1)*5;
    particleA.yVelocity = (Math.random()*2-1)*5;
    particleA.x += particleA.xVelocity;
    particleA.y += particleA.yVelocity;
    
    for (let particleB of particles) {
        if (particleA.pid == particleB.pid) continue;
        let dx = particleB.x - particleA.x;
        let dy = particleB.y - particleA.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if(distance < 10){
            if(particleA.group != particleB.group){
                if(particleA.power>particleB.power){
                    particleB.colour = particleA.colour;
                    particleA.power--;
                }
                else if (particleA.power<particleB.power){
                    particleA.colour = particleB.colour;
                    particleB.power--;
                }
            }
        }
    }
    if(particleA.power<0){
        particleA.power = 0;
    }
    particleA.power+=0.2;
}

function init() {
    const cols = Math.ceil(Math.sqrt(numOfParticles));
    const rows = Math.ceil(numOfParticles / cols);
    const spacingX = canvas.width / (cols + 1);
    const spacingY = canvas.height / (rows + 1);

    for(let i=0; i<numOfParticles; i++){

        let randMass = 5//Math.random()*maxMass+minMass; // kg
        let randX = (i%cols) * spacingX + canvas.width*0.025;//Math.random()*(canvas.width*0.90)+canvas.width*0.05;
        let randY = (i/cols) * spacingY + canvas.height*0.025;//Math.random()*(canvas.height*0.90)+canvas.height*0.05;
        let Radius = 2//Math.round( ((1)/(4))*(randMass-1) + 2 );
        let randRadius = Math.floor(Math.random()*maxRadius+minRadius);
        let randColor = colours[i%numOfGroups]//"#" + Math.floor(Math.random()*16777215).toString(16);
        if(i==0){
            randColor = "white";
        }
        let newXVelocity = Math.random();
        let newYVelocity = Math.random();
        let powerCell =  (Math.random()+5)*2;
        let particle = {
            pid:i,
            group: i%numOfGroups,
            colour: randColor,
            x:randX,
            y:randY,
            xVelocity:newXVelocity,
            yVelocity:newYVelocity,
            radius:Radius,
            mass:randMass,
            localMass:randMass,
            alive:true,
            distances:{},
            power:powerCell
        }
        
        particles[i] = particle;
    }
}

function update(currentTime) {
    document.getElementById("commandOutput").innerText = 
    `Elapsed time: ${ Math.round(currentTime/1000) }s\n
    Number of Particles: ${aliveParticles}\n
    Pause simulation: SPACEBAR
    Cancel canvas clearing: C
    Show links / vertices: L
    Frame-by-frame steps: F\n`;
    if(particleSelected){
        document.getElementById("commandOutput").innerText += `\nSelected particle: \n
        PID: ${selectedParticle.pid}    
        X: ${selectedParticle.x.toFixed(2)}
        Y: ${selectedParticle.y.toFixed(2)}
        X-Vel: ${selectedParticle.xVelocity.toFixed(2)}
        Y-Vel: ${selectedParticle.yVelocity.toFixed(2)}
        Mass: ${selectedParticle.mass.toFixed(2)}
        Radius: ${selectedParticle.radius.toFixed(2)}
        Local Mass: ${selectedParticle.localMass.toFixed(2)}\n
        Neighbours:\n`;
        for (const [key, value] of Object.entries(selectedParticle.distances)) {
            document.getElementById("commandOutput").innerText += `${key}: ${value.toFixed(2)}\n`;
        }
    }
    
    if(!paused && !step) {
        ctx.fillStyle = "#000000";
        if(clearCanvas){
            ctx.fillRect(0, 0, canvas.width, canvas.height); // turn off to see traces
        }
        if(particleSelected){
            //drawSelection(selectedParticle);
        }
        aliveParticles=0;
        for(let i=0; i<numOfParticles; i++){ // Math.floor(numOfParticles/2)
            if(particles[i].alive){// && particles[i+1].alive){
                aliveParticles++;
                updateParticle(particles[i]);
                draw(particles[i]);
            }
        }
    }
    requestAnimationFrame(update);
}
function stepFrame() {
    if (step) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height); // turn off to see traces
        aliveParticles=0;
        for (let i=0; i<numOfParticles; i++) {
            if(particles[i].alive){
                aliveParticles++;
                updateParticle(particles[i]);
                draw(particles[i]);
            }
        }
        step = false;
    }
}
window.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
        paused = !paused;
        step = false;
    }
    if (e.code === "KeyF") {
        if(paused){
            step = true; // Step forward one frame
            stepFrame();
        }
    }
    if (e.code === "KeyC") {
        clearCanvas = !clearCanvas;
    }
    if (e.code === "ArrowUp") {
        speedFactor += 0.02;
    }
    if (e.code === "ArrowDown") {
        speedFactor -= 0.02;
    }
    if (e.code === "KeyL") {
        vertices = !vertices;
    }
    if (e.code === "KeyT") {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        }
    }
    if (e.code === "KeyS") {
        const jsonData = JSON.stringify(particles.map(p => ({
            pid: p.pid,
            x: p.x,
            y: p.y,
            vx: p.xVelocity,
            vy: p.yVelocity,
            mass: p.mass,
            colour: p.colour,
            radius: p.radius,
            group: p.group,
            alive: p.alive
        })), null, 2); // Pretty-print with indentation
        const blob = new Blob([jsonData], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "particles.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
canvas.addEventListener("mousemove", (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    //selectParticle();
});
canvas.addEventListener("click", function () {
    //selectParticle();
});

init();
update();