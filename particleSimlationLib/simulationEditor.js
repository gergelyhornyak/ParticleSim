
let newCanvas = document.createElement("canvas");
newCanvas.id = "canvas01";
newCanvas.width = 400;
newCanvas.height = 400;
newCanvas.style.border = "1px solid black";
document.body.appendChild(newCanvas);
const ctx = newCanvas.getContext("2d");

let colours = ["#39FF14","yellow","orange","cyan", "#f000ff", "#2323FF", "white"];
let numOfGroups = 3;
let numOfParticles = 100;

let particles = [];
function init(){
    const cols = Math.ceil(Math.sqrt(numOfParticles));
    const rows = Math.ceil(numOfParticles / cols);
    const spacingX = newCanvas.width / (cols + 1);
    const spacingY = newCanvas.height / (rows + 1);
    for(let i=0; i<numOfParticles; i++){
        let randX = (i%cols) * spacingX + newCanvas.width*0.025;
        let randY = (i/cols) * spacingY + newCanvas.height*0.025;
        let randColour = colours[i%numOfGroups];
        particles[i] = {pid:i,x:randX,y:randY,colour:randColour};
    }
}

function update() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height); // turn off to see traces
    for(let i=0; i<numOfParticles; i++){
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, 2, 0, Math.PI * 2);
        ctx.fillStyle = particles[i].colour;
        ctx.fill();
        ctx.closePath();
        particles[i].x += (Math.random() * 2)-1;
        particles[i].y += (Math.random() * 2)-1;
    }
    
    requestAnimationFrame(update);
}

init();
        
update();