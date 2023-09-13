type createdCanvasShipType = (color: string[]) => HTMLCanvasElement | undefined;

const drawCanvasPerson: createdCanvasShipType = function ([headColor, bodyColor]) {
  // 人
  const width = 30;
  const height = 50;
  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    // 绘制头部
    ctx.fillStyle = headColor;
    ctx.strokeStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(15, 10, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // 绘制身体
    ctx.fillRect(10, 20, 10, 15);

    // 绘制左胳膊
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, 22.5);
    ctx.lineTo(10, 25);
    ctx.stroke();

    // 绘制右胳膊
    ctx.beginPath();
    ctx.moveTo(20, 22.5);
    ctx.lineTo(27, 25);
    ctx.stroke();

    // 绘制左腿
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 35);
    ctx.lineTo(6, 42.5);
    ctx.stroke();

    // 绘制右腿
    ctx.beginPath();
    ctx.moveTo(20, 35);
    ctx.lineTo(24, 42.5);
    ctx.stroke();
  }
  return canvas;
};

export { drawCanvasPerson };
