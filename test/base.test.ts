import { rollup, type RollupOptions } from "rollup";
import css from "../src/index";
import { test, expect } from "bun:test";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const inputOptions: RollupOptions = {
  input: "./test/test.ts",
  output: {
    file: "./test/out/test.js",
    format: "iife",
    name: "test",
  },
  plugins: [
   
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    }),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      exclude: "mode_modules/**",
    }),
    css(),
    
  ],
};

async function build() {
  const bundle = await rollup(inputOptions);
  await bundle.write({
    file: "./test/out/test.js",
    format: "iife",
    name: "test",
  });
  await bundle.close();
}

test("build", async () => {
  await build();
});
