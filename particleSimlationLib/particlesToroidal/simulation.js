
const canvas = document.getElementById("simCanvas");
const terminal = document.getElementById("commandOutput");
const ctx = canvas.getContext("2d");

canvas.width = 1600;
canvas.height = 950;

let aliveParticles = 0;
let detectRadius = 500;
let numOfParticles = 100;  
let minMass = 10;
let maxMass = 20;
let GRAVITY = 0.5;
let minRadius = 7;
let maxRadius = 10;
let numOfGroups = 5;
let colours = ["#39FF14","yellow","orange","cyan", "#f000ff", "#2323FF", "white"];
let bunchSize=0;
let otherBunchSize=0;
let paused=false; // boolean
let step=false;
let clearCanvas=true;
let killerInSquare = 6;
let killerOnAxis = 10;
let mouseX = 0;
let mouseY = 0;
let selectedParticle = {pid:0};
let particleSelected = false;
let fullscreen = false;
let vertices = false;


// instead of class, use single 1D array

let particles = [];

//const physicsWorker = new Worker("physicsWorker.js");
//const renderWorker = new Worker("renderWorker.js");

// const offscreen = canvas.transferControlToOffscreen();
//renderWorker.postMessage({ canvas: ctx });

function selectParticle() {
    let minDistance=100;
    let minPID=0;
    for(let i=0; i<numOfParticles; i++){
        let dx = particles[i].x - mouseX;
        let dy = particles[i].y - mouseY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if(distance<minDistance){
            minDistance = distance;
            minPID = particles[i].pid;
        }
    }
    selectedParticle = particles[minPID];
    //drawSelection(selectedParticle);
    particleSelected = true;
}

function draw(particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.colour;
    ctx.fill();
    ctx.closePath();
    // draw lines to other particle to show relation
}

function drawSelection(particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius+10, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
}

function drawRelation(particleA,midpoint) {
    ctx.beginPath();
    ctx.moveTo(particleA.x, particleA.y);
    ctx.lineTo(midpoint.x, midpoint.y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = particleA.colour;
    ctx.stroke();
}

function toroidalVector(p1, p2) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;

    if (dx > canvas.width / 2) dx -= canvas.width;
    if (dx < -1*canvas.width / 2) dx += canvas.width;

    if (dy > canvas.height / 2) dy -= canvas.height;
    if (dy < -1*canvas.height / 2) dy += canvas.height;

    let centreDistance = Math.sqrt(dx * dx + dy * dy);
    let combinedRadius = p1.radius + p2.radius;
    let edgeDistance = centreDistance - combinedRadius;
    edgeDistance = Math.max(0, edgeDistance);
    // Adjust dx and dy to represent movement from edge to edge
    if (centreDistance > 0) { // Avoid division by zero
        let scale = edgeDistance / centreDistance;
        dx *= scale;
        dy *= scale;
    } else {
        dx = 0;
        dy = 0;
    }
    let distance = edgeDistance;
    return { dx, dy, distance };
}

//* Resolve Elastic Collision Between Two Particles
function resolveCollision(p1, p2) {

    let { dx, dy, distance } = toroidalVector(p1, p2);

    const combinedRadius = p1.radius + p2.radius;

    // Normalized collision axis
    let nx = dx / distance;
    let ny = dy / distance;

    // Relative velocity
    let dvx = p2.xVelocity - p1.xVelocity;
    let dvy = p2.yVelocity - p1.yVelocity;

    // Velocity along normal
    let velocityAlongNormal = dvx * nx + dvy * ny;

    //  if (velocityAlongNormal > 0) return; // Ignore separating particles

    // Elastic collision response
    // Perfectly elastic collision
    let impulse = (2 * velocityAlongNormal) / (p1.mass + p2.mass);

    if (velocityAlongNormal > 0) return { xV: 0, yV: 0 };

    let xV,yV;

    // Apply impulse
    xV = impulse * p2.mass * nx;
    yV = impulse * p2.mass * ny;

    // Separate overlapping particles
    
    let correction = (1 / (p1.mass + p2.mass)) * 0.5;
    xV -= nx * correction * p2.mass;
    yV -= ny * correction * p2.mass;
    
    return {xV,yV};
}

function updateParticle(particleA) {
    particleA.distances = {};
    let bunchSize = 1;

    //* Screen Wrapping
    // left
    if( particleA.x+particleA.radius < 0 ){
        particleA.x += canvas.width + particleA.radius*2;
    }
    // right
    if( particleA.x-particleA.radius > canvas.width ){
        particleA.x -= canvas.width + particleA.radius*2;
    }
    // top
    if( particleA.y+particleA.radius < 0 ){
        particleA.y += canvas.height + particleA.radius*2;
    }
    // bottom
    if( particleA.y-particleA.radius > canvas.height){
        particleA.y -= canvas.height + particleA.radius*2;
    }

    for (let particleB of particles) {
        if (particleA.pid == particleB.pid) continue;
            
        let { dx, dy, distance } = toroidalVector(particleA, particleB);

        //* ignore distant particles
        if(distance <= detectRadius){

            //* calculate gravity
            if (distance >= 5) { // Avoid singularities at very close distances
                let particleA_localMass = particleA.mass;// * (1+ ((bunchSize-1)*(1/maxMass)));
                particleA.localMass = particleA_localMass;
                let force = (GRAVITY * particleA_localMass * particleB.mass) / (distance * distance);
                let ax = (force / particleA_localMass) * (dx / distance);
                let ay = (force / particleA_localMass) * (dy / distance);
                if(particleA.group == particleB.group){ // ( particleA.group+1 )%numOfGroups
                    if(distance < 5){
                        bunchSize ++;
                    }
                    // attract
                    particleA.xVelocity += ax;
                    particleA.yVelocity += ay;
                }
                if(particleA.group != particleB.group){
                    // repel
                    particleA.xVelocity -= ax;
                    particleA.yVelocity -= ay;
                }
            }

            //* log neighbour particles if list is smaller than 10
            if(Object.keys(particleA.distances).length <= 10){
                particleA.distances[particleB.pid] = distance;    
            }

            /*  DRAW NEIGHBOUR LINE
            let distanceA = distance*particleA.mass / (particleA.mass+particleB.mass); // multiply or add ?
            let midpoint = getPointOnLine(particleA.x,particleA.y,particleB.x,particleB.y,distanceA);
            if(vertices){
                drawRelation(particleA,midpoint);
            }
            */   
            //* collision detection AND elastic bounce effect
            if (distance < 5) {
                let {xV,yV} = resolveCollision(particleA,particleB);
                particleA.xVelocity -= xV;
                particleA.yVelocity -= yV;
            }
        }
    }
    let tempX = particleA.x;
    let tempY = particleA.y;
    particleA.x += particleA.xVelocity;
    particleA.y += particleA.yVelocity;
    if(isNaN(particleA.x)){
        //console.log("xVelocity",particleA.xVelocity);
        particleA.x = tempX;
    }
    if(isNaN(particleA.y)){
        //console.log("yVelocity",particleA.yVelocity);
        particleA.y = tempY;
    }
}

function init() {
    const cols = Math.ceil(Math.sqrt(numOfParticles));
    const rows = Math.ceil(numOfParticles / cols);
    const spacingX = canvas.width / (cols + 1);
    const spacingY = canvas.height / (rows + 1);

    for(let i=0; i<numOfParticles; i++){

        let randMass = Math.random()*maxMass+minMass; // kg
        let randX = (i%cols) * spacingX + canvas.width*0.025;//Math.random()*(canvas.width*0.90)+canvas.width*0.05;
        let randY = (i/cols) * spacingY + canvas.height*0.025;//Math.random()*(canvas.height*0.90)+canvas.height*0.05;
        let Radius = Math.round( ((1)/(4))*(randMass-1) + 2 );
        let randRadius = Math.floor(Math.random()*maxRadius+minRadius);
        let randColor = colours[i%numOfGroups]//"#" + Math.floor(Math.random()*16777215).toString(16);
        if(i==0){
            randColor = "white";
        }
        let newXVelocity = Math.random();
        let newYVelocity = Math.random();
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
            distances:{}
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
                if(isNaN(particles[i].x)){
                    console.log(particles[i]);
                    particles[i].alive = false; // kill it
                }
                //let region = 0;
                //physicsWorker.postMessage({ particles, section: region, particleA: particles[i] });
                //renderWorker.postMessage({particleA: particles[i]});
                //physicsWorker02.postMessage({ particles, section: numOfParticles-region, particleA: particles[i+1]});
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
    selectParticle();
});
canvas.addEventListener("click", function () {
    //selectParticle();
});

init();
update();
