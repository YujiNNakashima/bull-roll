import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/main.ts",
  output: {
    dir: "dist",
    format: "cjs", // CommonJS, for Node.js
  },
  plugins: [typescript()],
};