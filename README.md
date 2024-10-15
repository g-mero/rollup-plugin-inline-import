# rollup-plugin-inline-import

- import file content as string
- support css, scss, sass file automatically convert to css string and minify powered by sass and lightingcss
- custimized prefix、transformer

```bash
pnpm i rollup-plugin-inline-import -D
```

```js
// rollup.config.js
import inline from "rollup-plugin-inline-import";
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
    inline(),
  ],
};
```

## config

```

```
