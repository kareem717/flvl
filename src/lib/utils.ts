import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function stringToGradient(str: string) {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate three colors from the hash
  const color1 = `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
  const color2 = `hsl(${(Math.abs(hash) + 120) % 360}, 70%, 60%)`;
  const color3 = `hsl(${(Math.abs(hash) + 240) % 360}, 70%, 60%)`;

  // Return a linear gradient
  return `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;
}