document.querySelectorAll("[data-reveal]").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = document.getElementById(button.dataset.reveal);
    const isHidden = answer.hasAttribute("hidden");
    answer.toggleAttribute("hidden", !isHidden);
    button.textContent = isHidden ? "收起答案" : "想好后再揭晓";
  });
});

document.querySelectorAll("[data-checklist]").forEach((list) => {
  const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
  const output = list.querySelector("[data-progress]");
  const update = () => {
    const done = boxes.filter((box) => box.checked).length;
    output.textContent = `${done} / ${boxes.length}`;
  };
  boxes.forEach((box) => box.addEventListener("change", update));
  update();
});
