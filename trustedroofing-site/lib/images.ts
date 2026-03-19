const placeholderImages = [
  "/projects/project-1.svg",
  "/projects/project-2.svg",
  "/projects/project-3.svg"
];

export function getPlaceholderProjectImage(seed: string) {
  const index = Math.abs(seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % placeholderImages.length;
  return placeholderImages[index];
}
