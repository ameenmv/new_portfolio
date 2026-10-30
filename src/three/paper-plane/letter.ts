import { HALF_H, HALF_W } from "./crease";

export type LetterCopy = {
  to: string;
  title: string[]; // one entry per line
  body: string;
  signature: string;
  stamp: string;
};

const WIDTH = 1024;
const HEIGHT = Math.round((WIDTH * HALF_H) / HALF_W);
const INK = "#2d2a24";
const ORANGE = "#ff8400";
const CYAN = "#34bfff";

/** Draws the letter (ink only, transparent paper) onto `canvas`. */
export const drawLetter = (canvas: HTMLCanvasElement, copy: LetterCopy) => {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, WIDTH, HEIGHT);

  // air-mail border in the portfolio colours
  g.save();
  g.beginPath();
  g.rect(0, 0, WIDTH, HEIGHT);
  g.rect(34, 34, WIDTH - 68, HEIGHT - 68);
  g.clip("evenodd");
  for (let i = -HEIGHT, n = 0; i < WIDTH + HEIGHT; i += 56, n++) {
    g.fillStyle = n % 2 === 0 ? ORANGE : CYAN;
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 28, 0);
    g.lineTo(i + 28 - HEIGHT, HEIGHT);
    g.lineTo(i - HEIGHT, HEIGHT);
    g.fill();
  }
  g.restore();

  // ruled lines
  g.strokeStyle = "rgba(45,42,36,0.07)";
  g.lineWidth = 2;
  for (let y = 560; y < HEIGHT - 120; y += 58) {
    g.beginPath();
    g.moveTo(90, y);
    g.lineTo(WIDTH - 90, y);
    g.stroke();
  }

  // stamp
  g.save();
  g.translate(WIDTH - 200, 190);
  g.rotate(0.08);
  g.strokeStyle = ORANGE;
  g.lineWidth = 5;
  g.setLineDash([12, 8]);
  g.strokeRect(-80, -95, 160, 190);
  g.setLineDash([]);
  g.fillStyle = ORANGE;
  g.textAlign = "center";
  g.font = "900 78px Urbanist";
  g.fillText("MV", 0, 20);
  g.font = "700 22px Urbanist";
  g.fillText(copy.stamp, 0, 65, 150);
  g.restore();

  // copy
  const left = 96;
  const maxWidth = WIDTH - 200;
  g.fillStyle = "rgba(45,42,36,0.55)";
  g.font = "700 34px Urbanist";
  g.fillText(copy.to, left, 170);

  // the title shrinks to fit (longer languages, the stamp on the right)
  let titleSize = 82;
  g.font = `900 ${titleSize}px Urbanist`;
  const longest = Math.max(...copy.title.map((l) => g.measureText(l).width));
  const titleMax = WIDTH - left - 280;
  if (longest > titleMax) titleSize = Math.floor(titleSize * (titleMax / longest));
  g.font = `900 ${titleSize}px Urbanist`;
  g.fillStyle = INK;
  copy.title.forEach((l, i) => g.fillText(l, left - 4, 330 + i * titleSize * 1.05));

  g.font = "700 36px Urbanist";
  g.fillStyle = "#3d3930";
  let y = 650;
  let current = "";
  for (const word of copy.body.split(" ")) {
    const test = current ? `${current} ${word}` : word;
    if (g.measureText(test).width > maxWidth && current) {
      g.fillText(current, left, y);
      y += 58;
      current = word;
    } else {
      current = test;
    }
  }
  g.fillText(current, left, y);

  g.fillStyle = ORANGE;
  g.font = "900 64px Urbanist";
  g.fillText(copy.signature, left, HEIGHT - 150);
};
