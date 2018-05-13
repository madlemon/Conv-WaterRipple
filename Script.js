let stop = false;
let canvas = document.getElementById("canvas");
const width = canvas.width;
const height = canvas.height;

let buffer1 = tf.zeros([height, width, 1]);
let buffer2 = tf.zeros([height, width, 1]);

let damping = tf.scalar(0.99);

let kernel = tf.tensor2d(
  [0.0, 0.5, 0.0,
  0.5, 0.0, 0.5,
  0.0, 0.5, 0.0],
  [3, 3, 1, 1]
);

/**
   * Computes the water ripple effect.
   */
function computeWater() {
   buffer1 = tf.tidy(() => {
     let temp1 = tf.conv2d(buffer1, kernel, 1, 'same');
     let temp2 = temp1.sub(buffer2).mul(damping);
     buffer2.dispose();
     buffer2 = buffer1;
     return tf.clipByValue(temp2, 0, 1);
  });

}

/**
   * Draws a `Tensor` of pixel values to the canvas.
   *
   * @param img A rank-2 tensor.
   */
function draw(img) {
  const data = img.dataSync();
  const multiplier = 500;
  const imageData = new ImageData(width, height);

  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    imageData.data[j + 0] = data[i] * multiplier;
    imageData.data[j + 1] = data[i] * multiplier;
    imageData.data[j + 2] = data[i] * multiplier;
    imageData.data[j + 3] = 255;

  }

  if (canvas != null) {
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
   * Puts a value of 1 into the buffer1 to spawn a ripple.
   *
   * @param x x-position
   * @param y y-position
   */
function spawnRipple(x, y){
  let spawnTens = buffer1.buffer();
  spawnTens.set(1, y, x, 0);
}

var mouseDown = 0;
document.body.onmousedown = function(evt) {
    mouseDown = 1;
    let rect = canvas.getBoundingClientRect();
    let x = evt.clientX - rect.left;
    let y = evt.clientY - rect.top;
    spawnRipple(x, y);
}
document.body.onmouseup = function() {
    mouseDown = 0;
}

canvas.addEventListener('mousemove', function(evt) {
  if(mouseDown == 1){
    let rect = canvas.getBoundingClientRect();
    let x = evt.clientX - rect.left;
    let y = evt.clientY - rect.top;
    spawnRipple(x, y);
  }
}, false);

/**
   * main loop for the simulation
   *
   */
function mainLoop() {
  if(!stop){
    computeWater();
    tf.tidy(() => ( draw(buffer2), null));
    //tf.tidy(() => (tf.toPixels(buffer2, canvas), null));
    requestAnimationFrame(mainLoop);
  }
}
// Start things off
requestAnimationFrame(mainLoop);
