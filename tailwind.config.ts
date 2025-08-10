// DELETE?


// The purpose of this file is to customize the configuration of Tailwind.
import type { Config } from "tailwindcss";

const config: Config = {

  // Lists the directories and file types Tailwind should scan for class 
  // names so Tailwind knows which files to process and which utility classes to generate.
  content: [
    "./src/**/*.{ts,tsx,js,jsx}", 
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
  ],

  // A place to add custom theme value to Tailwind in the future.
  theme: {
    extend: {},
  },

  // A place to add Tailwind plugins.
  plugins: [],
};

export default config;
