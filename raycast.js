var SIZE_X = 64;
var SIZE_Y = 64;
var K_FOV = 1;

var gX0 = 3;
var gY0 = 6;
var gA = 0.86;

var STORE_LIN = SIZE_Y;
var MID = Math.floor(SIZE_Y / 2);

var UPPER_BG_COLOR = 0xDEE6FF;
var LOWER_BG_COLOR = 0x33CC00;

var colors = new Array(SIZE_X);
var sizes = new Array(SIZE_X);

var sheet;
var side;

var map =
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

function Vector(x, y) {
  this.x = x;
  this.y = y;
}

function readMap_(y, x) {
  return (map[Math.floor(y)][Math.floor(x)]);
}

function getMapFromSheet_() {
    var sheet = SpreadsheetApp.getActiveSheet();
    var tmp;

    for (var line = 1; line <= 10; line++) {
	for (var col = 1; col <= 10; col++) {
            tmp = sheet.getRange(line, col, 1, 1).getValue();
	    if (tmp)
		map[line - 1][col - 1] = tmp;
	}
    }
}

function savePlayerToSheet_() {
  sheet.getRange(STORE_LIN, 1, 1, 1).setValue(gX0);
  sheet.getRange(STORE_LIN, 2, 1, 1).setValue(gY0);
  sheet.getRange(STORE_LIN, 3, 1, 1).setValue(gA);
}

function initMapFromSheet_() {

  getMapFromSheet_();
  initPlayerFromSheet_();
}

function initPlayerFromSheet_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  gX0 = sheet.getRange(STORE_LIN, 1, 1, 1).getValue();
  gY0 = sheet.getRange(STORE_LIN, 2, 1, 1).getValue();
  gA = sheet.getRange(STORE_LIN, 3, 1, 1).getValue();
}

function refresh_() {
  initMapFromSheet_();
  raycast_();
}

function right_() {
  initMapFromSheet_();
  gA = gA - 0.25;
  if (gA < 0) {
    gA += (2 * Math.PI);
  }
  raycast_();
}

function left_() {
  initMapFromSheet_();
  gA = gA + 0.25;
  if (gA > (2 * Math.PI)) {
    gA -= (2 * Math.PI);
  }
  raycast_();
}

function up_() {
  initMapFromSheet_();
  gX0 += Math.cos(gA) / 4;
  gY0 += Math.sin(gA) / 4;
  raycast_();
}

function down_() {
  initMapFromSheet_();
  gX0 -= Math.cos(gA) / 4;
  gY0 -= Math.sin(gA) / 4;
  raycast_();
}

function initSheet_() {
  var sheet = sheet = SpreadsheetApp.getActiveSheet();

  if(SIZE_X > sheet.getMaxColumns()) {
    sheet.insertColumns(1, SIZE_X - sheet.getMaxColumns());
  }

  if(SIZE_X < sheet.getMaxColumns()) {
    sheet.deleteColumns(1, sheet.getMaxColumns() - SIZE_X);
  }

  if(SIZE_Y > sheet.getMaxRows()) {
    sheet.insertRows(2, SIZE_Y - sheet.getMaxRows());
  }

  if(SIZE_Y < sheet.getMaxRows()) {
    sheet.deleteRows(2, sheet.getMaxRows() - SIZE_Y - 1);
  }

  for(var row = 1; row <= SIZE_Y; row++) {
    sheet.setRowHeight(row, 10);
  }

  for(var col = 1; col <= SIZE_X; col++) {
    sheet.setColumnWidth(col, 10);
  }

  sheet.clear();
}

function drawBackground_() {
  sheet.getRange(1, 1, MID, SIZE_X).setBackgroundColor("#" + UPPER_BG_COLOR.toString(16));
  sheet.getRange(MID, 1, MID + !(SIZE_Y % 2), SIZE_X).setBackgroundColor("#" + LOWER_BG_COLOR.toString(16));
}

var isSizeDecreasing;
var runLength;
function smoothenColors_(x) {
  var sizeDecrease = (sizes[x] < sizes[x - 1]);

  var decrement = 1 / (runLength + 1);
  var blendIntensity = 1 - decrement;

  if (sizeDecrease) {
    var decrement = -decrement;
    var blendIntensity = -decrement;
  }

  x = x - 1;
  var col = x;
  while (col > x - runLength) {
    var size = sizes[col];
    var color = colors[col];

    var upperR = ((color >> 16) & 0xFF) * blendIntensity;
    upperR += (1 - blendIntensity) * ((UPPER_BG_COLOR >> 16) & 0xFF);
    upperR &= 0xFF;
    var upperG = ((color >> 8) & 0xFF) * blendIntensity;
    upperG += (1 - blendIntensity) * ((UPPER_BG_COLOR >> 8) & 0xFF);
    upperG &= 0xFF;
    var upperB = (color & 0xFF) * blendIntensity;
    upperB += (1 - blendIntensity) * (UPPER_BG_COLOR & 0xFF);
    upperB &= 0xFF;

    var lowerR = ((color >> 16) & 0xFF) * blendIntensity;
    lowerR += (1 - blendIntensity) * ((LOWER_BG_COLOR >> 16) & 0xFF);
    lowerR &= 0xFF;
    var lowerG = ((color >> 8) & 0xFF) * blendIntensity;
    lowerG += (1 - blendIntensity) * ((LOWER_BG_COLOR >> 8) & 0xFF);
    lowerG &= 0xFF;
    var lowerB = (color & 0xFF) * blendIntensity;
    lowerB += (1 - blendIntensity) * (LOWER_BG_COLOR & 0xFF);
    lowerB &= 0xFF;

    var upperColor = (upperR << 16) | (upperG << 8) | upperB;
    var lowerColor = (lowerR << 16) | (lowerG << 8) | lowerB;

    sheet.getRange(Math.max(1, MID - size), col + 1, 1, 1).setBackgroundColor("#" + upperColor.toString(16));
    sheet.getRange(Math.min(SIZE_Y, MID + size), col + 1, 1, 1).setBackgroundColor("#" + lowerColor.toString(16));
    col -= 1;

    blendIntensity -= decrement;
    if (blendIntensity < 0) {
      blendIntensity = 0;
    }

  }
}

function getColor_(k) {
  k = 1 - (k / 12);
  var r,g,b, color;
  if (side) r=0xff, g=0x99, b=0x66;
  else      r=0xff, g=0x66, b=0x66;
  r = Math.round(r * k);
  g = Math.round(g * k);
  b = Math.round(b * k);
  color = (r << 16) | (g << 8) | (b);
  return color;
}

function drawWallX_(x, k) {
  var size;

  size = (k <= 0 ? MID : SIZE_Y / (4*k));
  size = Math.min(MID, Math.max(1, size));

  size = Math.round(size);
  sizes[x] = size;

  color = getColor_(k);
  colors[x] = color;

  sheet.getRange(MID, x + 1, size + 1, 1).setBackgroundColor("#" + color.toString(16));
  sheet.getRange(Math.max(1, MID - size), x + 1, size, 1).setBackgroundColor("#" + color.toString(16));

  if (x > 1) {
    var sizeDecrease = (size < sizes[x - 1]);
    var invalid = (sizeDecrease != isSizeDecreasing);

    if (!invalid && size == sizes[x - 1]) {
      runLength += 1;
    } else {
      smoothenColors_(x);
      runLength = 1;
    }
    isSizeDecreasing = sizeDecrease;

  } else {
    runLengh = 1;
    isSizeDecreasing = false;
  }
}

function getRay(x) {
  var cos = Math.cos(gA);
  var sin = Math.sin(gA);
  var y1 = SIZE_X / 2;

  y1 = y1 - x;
  y1 = y1 / SIZE_X;

  return new Vector(
    cos / 2 - y1 * sin * K_FOV,
    sin / 2 + y1 * cos * K_FOV
  );
}

function castRay(mapCoord, delta, dist, step) {
  var hit = 0;

  while (!hit) {
    if (dist.x < dist.y) {
      dist.x      += delta.x;
      mapCoord.x  += step.x;
      hit = readMap_(mapCoord.x, mapCoord.y) * 1;
    } else {
      dist.y     += delta.y;
      mapCoord.y += step.y;
      hit = readMap_(mapCoord.x, mapCoord.y) * 2;
    }
  }
  return side = hit - 1;
}

function getWallHeight(ray) {
  var mapCoord = new Vector(
      Math.floor(gX0),
      Math.floor(gY0)
  );

  var delta = new Vector(
      Math.sqrt(1. + (ray.y * ray.y) / (ray.x * ray.x)),
      Math.sqrt(1. + (ray.x * ray.x) / (ray.y * ray.y))
  );

  var dist = new Vector(
      delta.x * (gX0 - mapCoord.x), // Distance from next hit on the x axis
      delta.y * (gY0 - mapCoord.y)  // Distance from next hit on the y axis
  );

  var step = new Vector(
      Math.floor(1 - 2 * (ray.x < 0)),
      Math.floor(1 - 2 * (ray.y < 0))
  );

  if (ray.x >= 0) dist.x = delta.x - dist.x;
  if (ray.y >= 0) dist.y = delta.y - dist.y;

  var ret = castRay(mapCoord, delta, dist, step);

  if (ret) {
    return Math.abs((mapCoord.y - gY0 + (1. - step.y) / 2.) / ray.y);
  } else {
    return Math.abs((mapCoord.x - gX0 + (1. - step.x) / 2.) / ray.x);
  }
}

function raycast_() {
  sheet = SpreadsheetApp.getActiveSheet();
  drawBackground_();
  for (var x = 0; x < SIZE_X; x++) {
    ray = getRay(x);
    var k = getWallHeight(ray);
    drawWallX_(x, k);
  }
  savePlayerToSheet_();
}

function onOpen() {
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var subMenus = [
      {name:"Reset",functionName:"onOpen"},
      {name:"Refresh",functionName:"refresh_"},
      {name:"Move forward",functionName:"up_"},
      {name:"Look left",functionName:"left_"},
      {name:"Look right",functionName:"right_"},
      {name:"Move backward",functionName:"down_"},
  ];
  spreadsheet.addMenu("Sheetcaster", subMenus);

  sheet = SpreadsheetApp.getActiveSheet();
  initSheet_();
  raycast_();
}
