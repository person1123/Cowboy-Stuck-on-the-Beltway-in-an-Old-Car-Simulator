var road;
var player;
var car;
var tree;
var hood;

var honk;
var font;

var carLocations = [];
var treeLocations = [];

var printed = false;

var lastTime;

var trafficOffset = 0;
var trafficMoving = true;
var trafficSpeed = 0;

var playerOffset = 0;
var playerMoving = false;
var playerSpeed = 0;

var keySequence = [];
var counter = 4;

var lost = false;

const playerAccel = 3000;
const playerMaxSpeed = 10;
const trafficMaxSpeed = 7;
const carScale = 1;
const warningThreshold = 0.3;

function preload() {
  road = loadImage("assets/road.png");
  player = loadImage("assets/player.png");
  car = loadImage("assets/car.png");
  tree = loadImage("assets/tree.png");
  hood = loadImage("assets/hood.png");

  honk = loadSound('assets/honk.mp3');
  font = loadFont('assets/countryside.ttf');
}

function setup() {
  //createCanvas(window.innerHeight, window.innerHeight);
  createCanvas(window.innerWidth, window.innerHeight);
  // SIZE = height;
  
  pixelDensity(1);

  for (var i = 10; i > 1; i--) {
    var x = random(-.2, .2) + random([0, 0.5, 1]);
    var c = color('hsl(' + int(random(360)) + ', 25%, 50%)');
    carLocations.push([x, i / 10.0, c, 0]);
  }

  for (var i = 100; i > 1; i-=10) {
    var x = random(-.2, .2) + random([-1.6, 2.2]);
    var c = color('hsl(' + int(random(360)) + ', 25%, 50%)');
    treeLocations.push([x, i / 100.0, c, random(0.5, 1.5)]);
  }

  textFont(font);
  textSize(200);
  textAlign(CENTER, CENTER);

  lastTime = millis();
}

function draw() {
  if (lost) {
    background(0);
    return;
  }

  background("#d0fef6");

  var delta = (millis() - lastTime) / 1000.0;

  noStroke();
  fill('#1c4f08');
  rect(0, height*.52, width, height/2);

  for (var i = 0; i < treeLocations.length; i++) {
    var offset = treeLocations[i][1] - playerOffset;
    if (offset < 0) {
      offset -= floor(offset);
    }
    drawTree(
      treeLocations[i][0],
      offset,
      treeLocations[i][2],
      treeLocations[i][3]
    );
  }

  image(road, (width - road.width) / 2, 0);

  for (var i = 0; i < carLocations.length; i++) {
    drawCar(
      carLocations[i][0],
      carLocations[i][1] + trafficOffset - playerOffset,
      carLocations[i][2]
    );
    if (trafficMoving) {
      carLocations[i][0] += carLocations[i][3] * delta;
      carLocations[i][3] += random(-0.1, 0.1);
      carLocations[i][0] = constrain(carLocations[i][0], 0, 1);
    }
  }


  image(
    player,
    (width - player.width * .7) / 2 + width * .05,
    height - player.height * .7,
    player.width * .7,
    player.height * .7
  );

  printed = true;

  if (playerMoving) {
    playerSpeed += playerAccel * delta;
  } else {
    playerSpeed -= playerAccel * delta;
  }
  playerSpeed = constrain(playerSpeed, 0, playerMaxSpeed);
  playerOffset += playerSpeed * delta;

  if (trafficMoving) {
    trafficSpeed += playerAccel * delta;
  } else {
    trafficSpeed -= playerAccel * delta;
  }
  trafficSpeed = constrain(trafficSpeed, 0, trafficMaxSpeed);
  trafficOffset += trafficSpeed * delta;

  if (random(100) < 2) {
    trafficMoving = !trafficMoving;
  }

  if (trafficOffset - playerOffset > warningThreshold) {
    image(
      hood,
      (width - hood.width * 1.2) / 2 + width * .05,
      height - hood.height * .7 + hood.height * (warningThreshold + playerOffset - trafficOffset),
      hood.width * 1.2,
      hood.height * 1.2
    );
  }

  if (trafficOffset - playerOffset > warningThreshold ||
    playerOffset > trafficOffset) {
    honk.play();
  } else {
    honk.stop();
  }
  if (trafficOffset - playerOffset > warningThreshold * 2 ||
    playerOffset - .2 > trafficOffset) {
      honk.stop();
      lost = true;
  }

  if (keySequence.length > 0) {
    fill(0);
    text(keySequence[keySequence.length - 1], width/2, height/2);
  }

  lastTime = millis();
}

function drawCar(x, y, color) {
  const leftEdge = -0.1;
  const rightEdge = 0.35;
  const vanishingX = 0;
  const minDisp = 0.2;
  const vanishingY = 0.5;
  const minScale = 0.2;
  const maxScale = 1.5;

  if (y > 1) {
    return;
  }

  depth = pow(y, 1/3);

  var center = createVector(
    lerp(lerp(leftEdge, rightEdge, x), vanishingX, lerp(0, 1 - minDisp, depth)),
    lerp(1, vanishingY, depth)
  );
  var scale = lerp(maxScale, minScale, depth);

  tint(color);
  image(
    car,
    (width - car.width * scale) / 2 + center.x * road.width,
    -(car.height * scale) /2 + center.y * height,
    scale * car.width,
    scale * car.height
  );
  noTint();
}

function drawTree(x, y, color, s) {
  const leftEdge = -0.1;
  const rightEdge = 0.35;
  const vanishingX = 0;
  const minDisp = 0.2;
  const vanishingY = 0.5;
  const minScale = 0.2;
  const maxScale = 1.5;

  depth = pow(y, 1/3);

  var center = createVector(
    lerp(lerp(leftEdge, rightEdge, x), vanishingX, lerp(0, 1 - minDisp, depth)),
    lerp(1, vanishingY, depth)
  );
  var scale = lerp(maxScale, minScale, depth) * s;

  tint(color);
  image(
    tree,
    (width - tree.width * scale) / 2 + center.x * road.width,
    -(tree.height * scale) /2 + center.y * height,
    scale * tree.width,
    scale * tree.height
  );
  noTint();
}

function keyPressed() {
  if (keySequence.length > 0) {
    console.log(key);
    if (key === keySequence[keySequence.length - 1]) {
      console.log('pressed!');
      keySequence.pop();
    }
  } else {
    if (key === ' ') {
      playerMoving = true;
    }
  }
}

function keyReleased() {
  if (key === ' ') {
    playerMoving = false;

    if (keySequence.length == 0) {
      for (var i = 0; i < counter/4; i++) {
        keySequence.push(random(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M']));
      }
      counter += int(random(3));
    }
  }
}