const starCanvas = document.querySelector(".hero__stars");

if (starCanvas) {
  const context = starCanvas.getContext("2d", { alpha: true });
  const hero = starCanvas.closest(".hero");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0 };
  const stars = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let animationFrame = null;
  let isVisible = true;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const createStar = (layer) => {
    const settings = {
      far: { radius: [0.25, 0.75], speed: [0.003, 0.012], alpha: [0.25, 0.6] },
      mid: { radius: [0.65, 1.25], speed: [0.018, 0.038], alpha: [0.38, 0.78] },
      near: { radius: [1.1, 1.9], speed: [0.045, 0.085], alpha: [0.55, 0.95] },
    }[layer];

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      z: randomBetween(0.2, 1),
      radius: randomBetween(settings.radius[0], settings.radius[1]),
      speed: randomBetween(settings.speed[0], settings.speed[1]),
      alpha: randomBetween(settings.alpha[0], settings.alpha[1]),
      twinkle: layer === "near" || Math.random() > 0.86,
      phase: Math.random() * Math.PI * 2,
      layer,
    };
  };

  const buildStars = () => {
    stars.length = 0;
    const area = width * height;
    const mobileFactor = width < 768 ? 0.56 : 1;
    const total = Math.floor(Math.min(1300, Math.max(360, Math.floor(area / 1050) * mobileFactor)));
    const farCount = Math.floor(total * 0.9);
    const midCount = Math.floor(total * 0.09);
    const nearCount = Math.max(10, Math.min(15, total - farCount - midCount));

    for (let index = 0; index < farCount; index += 1) stars.push(createStar("far"));
    for (let index = 0; index < midCount; index += 1) stars.push(createStar("mid"));
    for (let index = 0; index < nearCount; index += 1) stars.push(createStar("near"));
  };

  const resize = () => {
    const rect = starCanvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    starCanvas.width = Math.floor(width * pixelRatio);
    starCanvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildStars();
  };

  const render = (time = 0) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(2, 3, 8, 0.34)";
    context.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const driftX = pointer.x * 2;
    const driftY = pointer.y * 2;

    for (const star of stars) {
      if (!reduceMotion.matches) {
        star.x += (star.x - centerX) * star.speed * 0.0018;
        star.y += (star.y - centerY) * star.speed * 0.0018;
        star.z += star.speed * 0.0012;
      }

      if (star.x < -20 || star.x > width + 20 || star.y < -20 || star.y > height + 20 || star.z > 1.35) {
        const next = createStar(star.layer);
        star.x = centerX + randomBetween(-18, 18);
        star.y = centerY + randomBetween(-18, 18);
        star.z = 0.2;
        star.radius = next.radius;
        star.speed = next.speed;
        star.alpha = next.alpha;
        star.twinkle = next.twinkle;
        star.phase = next.phase;
      }

      const depth = star.layer === "far" ? 0.25 : star.layer === "mid" ? 0.58 : 1;
      const x = star.x + (reduceMotion.matches ? 0 : driftX * depth);
      const y = star.y + (reduceMotion.matches ? 0 : driftY * depth);
      const pulse = star.twinkle && !reduceMotion.matches ? Math.sin(time * 0.0012 + star.phase) * 0.22 : 0;
      const alpha = Math.max(0.14, Math.min(1, star.alpha + pulse));
      const radius = star.radius * (0.8 + star.z * 0.45);

      context.beginPath();
      context.fillStyle = `rgba(165, 226, 255, ${alpha})`;
      context.shadowBlur = star.layer === "near" ? 10 : star.layer === "mid" ? 5 : 0;
      context.shadowColor = "rgba(56, 189, 248, 0.55)";
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.shadowBlur = 0;
    if (isVisible && !reduceMotion.matches) animationFrame = window.requestAnimationFrame(render);
  };

  const start = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
  };

  const stop = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  };

  window.addEventListener("resize", resize);
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  hero.addEventListener("pointerleave", () => {
    pointer.x = 0;
    pointer.y = 0;
  });

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) {
      start();
      return;
    }
    stop();
  });

  resize();
  start();
  observer.observe(hero);
}
