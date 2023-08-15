// ⤵ type
type colorArrType = string[];
type createdCanvasShipType = (flag: boolean, colorArr: colorArrType) => HTMLCanvasElement | undefined;

/******************************************************************************************************/

const createdCanvasShip: createdCanvasShipType = function (flag, [fillColor, circleColor]) {
  // 船
  const width = 26;
  const height = 46;
  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  if (ctx) {
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 1; //设置线
    ctx.beginPath();
    ctx.moveTo(12.5, 20.5);
    ctx.lineTo(22.5, 44.5);
    ctx.lineTo(3.5, 44.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (fillColor !== circleColor && ctx) {
    ctx.beginPath();
    ctx.arc(13, 36, 4, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = circleColor;
    ctx.fill();
    ctx.stroke();
  }

  if (flag && ctx) {
    //  船首线
    ctx.beginPath();
    ctx.moveTo(12.5, 0.5);
    ctx.lineTo(12.5, 20.5);
    ctx.closePath();
    ctx.stroke();
  }

  return canvas;
};

export { createdCanvasShip };
