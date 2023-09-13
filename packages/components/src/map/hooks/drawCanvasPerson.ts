type createdCanvasShipType = (color: string[]) => HTMLCanvasElement | undefined;

const drawCanvasPerson: createdCanvasShipType = function (color: string[]) {
  // 人
  const width = 40;
  const height = 80; // 调整为更短的高度
  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    // 绘制头部
    ctx.fillStyle = color[0];
    ctx.strokeStyle = color[0];
    ctx.beginPath();
    ctx.arc(20, 15, 10, 0, Math.PI * 2);
    ctx.fill();

    // 绘制身体
    ctx.fillRect(15, 30, 10, 30);

    // 绘制左胳膊
    ctx.lineWidth = 4; // 设置胳膊粗度
    ctx.beginPath();
    ctx.moveTo(5, 35);
    ctx.lineTo(15, 45);
    ctx.stroke();

    // 绘制右胳膊
    ctx.beginPath();
    ctx.moveTo(25, 35);
    ctx.lineTo(35, 45);
    ctx.stroke();

    // 绘制左腿
    ctx.lineWidth = 4; // 设置腿粗度
    ctx.beginPath();
    ctx.moveTo(15, 60);
    ctx.lineTo(10, 75); // 修改腿下圈圈的位置
    ctx.stroke();

    // 绘制右腿
    ctx.beginPath();
    ctx.moveTo(25, 60);
    ctx.lineTo(30, 75); // 修改腿下圈圈的位置
    ctx.stroke();
  }
  return canvas;
};

export { drawCanvasPerson };
