// Re-group the array of FFT bins into an array of more meaningful values using the splitOctaves method.

var source, fft;
var shiftedPixels

function setup() {
  createCanvas(2000,1500);
  colorMode(HSB);
  noFill();
  //audio input
  source = new p5.AudioIn();
  source.start();
  //512= Data length
  fft = new p5.FFT(12, 512);
  //audio source
  fft.setInput(source);
  //amplitude = new p5.Amplitude();
  //shiftedPixels = new Uint8ClampedArray(height * width *    4*pixelDensity() )
}

  var k = 900;//conversion coefficient
  var c = 200;//start color

function draw() {
  //  spectrum analysis
  var spectrum = fft.analyze();
  //Butterfly Calculation Formula of FFT Transformation
  var newBuffer = [];

  // scaledSpectrum is a new, smaller array of more meaningful values
  //var scaledSpectrum = splitOctaves(spectrum, map(c, 0,360, 6,14));
  var scaledSpectrum = splitOctaves(spectrum, 50);
  var len = scaledSpectrum.length;
  var N = len - 5;
  //Transform coefficients, the return value is the result of two coefficient values (k/n) calculated by Euler's formula, and the return value type is also complex type
  var volume = max(scaledSpectrum/5);
  //var volume = map(amplitude.getLevel(), 0,1, 0,255);
  //var volume = fft.getEnergy("bass","treble");
  // draw shape
  beginShape();
  
  	c = map(fft.getCentroid(), 10,500, 0,360)
  	fill(c, volume*0.8, 250, 0.000);
  	//strokeWeight(scaledSpectrum[len/2]/16);
    stroke(c, volume, 1 - volume/5, 0.8);
    //noStroke();
    // one at the far corner
    curveVertex(x, y);
    translate(0,800);
    for (var i = 0; i < N; i++) {
      scaledSpectrum[i] = smoothPoint(scaledSpectrum, i, 1) * 0.6 + 6;
      var R = scaledSpectrum[i];
      var x = width /2+R*cos(radians(i*180/N+k));
      var y = height/2+R*sin(radians(i*180/N+k));
	  if(i===0) var x1=x, y1=y;
      curveVertex(x, y);
    }
    for (var i = N; i > 0; i--) {
      R = scaledSpectrum[i]
      x = width /2+R*cos(radians(i*180/N+k+180));
      y = height/2+R*sin(radians(i*180/N+k));
      curveVertex(x, y);
    }
    // one last point at the end
    curveVertex(x1, y1);
    curveVertex(x, y);

  endShape();
  
  loadPixels()
  	var d = pixelDensity()
  	var line = width*4*d
    //arrayCopy(pixels, line, pixels, 0)
  	for(var i = 0; i < height*d*line; i++){
      pixels[i] = pixels[i+line]
    }
    //arrayCopy(pixels, line, pixels, 0)
    //concat(shifted, new Uint8ClampedArray(line))
    //pixels = shiftedPixels
  updatePixels()
}
/**
 *  Divides an fft array into octaves with each
 *  divided by three, or by a specified "slicesPerOctave".
 *  
 *  There are 10 octaves in the range 20 - 20,000 Hz,
 *  so this will result in 10 * slicesPerOctave + 1
 */
function splitOctaves(spectrum, slicesPerOctave) {
  var scaledSpectrum = [];
  var len = spectrum.length;

  // default to thirds
  var n = slicesPerOctave|| 3;
  var nthRootOfTwo = Math.pow(2, 1/n);

  // the last N bins get their own 
  var lowestBin = slicesPerOctave;

  var binIndex = len - 1;
  var i = binIndex;

  while (i > lowestBin) {
    var nextBinIndex = round( binIndex/nthRootOfTwo );

    if (nextBinIndex === 1) return;

    var total = 0;
    var numBins = 0;

    // add up all of the values for the frequencies
    for (i = binIndex; i > nextBinIndex; i--) {
      total += spectrum[i];
      numBins++;
    }
    // divide total sum by number of bins
    var energy = total/numBins;
    scaledSpectrum.push(energy);
    // keep the loop going
    binIndex = nextBinIndex;
  }
  // add the lowest bins at the end
  for (var j = i; j > 0; j--) {
    //moving pixels
    scaledSpectrum.push(spectrum[j]);
  }
  // reverse so that array has same order as original array (low to high frequencies)
  scaledSpectrum.reverse();
  return scaledSpectrum;
}

// average a point in an array with its neighbors
function smoothPoint(spectrum, index, numberOfNeighbors) {
  // default to 2 neighbors on either side
  var neighbors = numberOfNeighbors || 2;
  var len = spectrum.length;
  var val = 0;
  // start below the index
  var indexMinusNeighbors = index - neighbors;
  var smoothedPoints = 0;
  for (var i = indexMinusNeighbors; i < (index+neighbors) && i < len; i++) {
    // if there is a point at spectrum[i], tally it
    if (typeof(spectrum[i]) !== 'undefined') {
      val += spectrum[i];
      smoothedPoints++;
    }
  }
  val = val/smoothedPoints;
  return val;
}