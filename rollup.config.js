import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { dts } from "rollup-plugin-dts";

const sets = [
  {
    input: "src/index.ts", //入口文件
    output: {
      file: "dist/index.js", //打包后的存放文件
      format: "cjs", //输出
    },
    plugins: [],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default sets.map(({ input, output, plugins }) => ({
  input,
  output,
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
    ...plugins,
  ],
  external: ['browserslist','sass','lightningcss'],
}));
