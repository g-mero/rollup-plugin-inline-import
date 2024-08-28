import { readFile } from 'node:fs/promises'
import type { Plugin } from 'rollup'
import { compileAsync } from 'sass'
import { transform as lightCss } from 'lightningcss'
import browersTarget from './browserslist'

export type Transformer = (code: string, id: string) => string | Promise<string>

export interface Options {
  /**
   *  Defaults to imports that start with `inline:`, e.g.
   *  import 'inline:./file.ext';
   */
  prefix?: string

  /**
   *  Enable the CSS transformer
   *  @default true
   */
  enableCSSTransformer?: boolean

  /**
   *  Custom transformer
   */
  transformer?: Transformer
}

async function cssTransformer(code: string, id: string) {
  const includes = ['.css', '.scss', '.sass']
  if (!includes.some(ext => id.toLowerCase().endsWith(ext)))
    return code
  if (!id.toLowerCase().endsWith('.css')) {
    code = (await compileAsync(id)).css
  }

  code = lightCss({
    // eslint-disable-next-line node/prefer-global/buffer
    code: Buffer.from(code),
    minify: true,
    sourceMap: false,
    targets: browersTarget,
    filename: id,
  }).code.toString()

  return code
}

const defaults: Required<Omit<Options, 'transformer'>> = {
  prefix: 'inline:',
  enableCSSTransformer: true,
}

export default function inline(opts: Options = {}): Plugin {
  const options = Object.assign({}, defaults, opts)
  const { prefix, enableCSSTransformer, transformer } = options

  const transFormers: Transformer[] = []

  if (enableCSSTransformer) {
    transFormers.push(cssTransformer)
  }
  if (transformer) {
    transFormers.push(transformer)
  }

  const paths = new Map()

  return {
    name: 'rollup-plugin-inline-import',

    resolveId: (sourcePath, importer) => {
      if (sourcePath.startsWith(prefix)) {
        const path = sourcePath.slice(prefix.length)
        // target - name
        paths.set(path, importer)
        return path
      }
      return null
    },

    async load(id) {
      if (!paths.has(id)) {
        return null
      }
      const ids = await this.resolve(id, paths.get(id))
      if (!ids) {
        return null
      }

      let code = await readFile(ids.id, 'utf8')
      for (const transformer of transFormers) {
        code = await transformer(code, ids.id)
      }

      return `export default ${JSON.stringify(code.trim())};`
    },

    /*     async transform(content, id) {
          if (!extensions.some((ext) => id.toLowerCase().endsWith(ext)))
            return null;

          let data = content;

          if (id.toLowerCase().endsWith(".scss")) {
            data = (await compileAsync(id)).css;
          }

          data = lightCss({
            code: Buffer.from(data),
            minify: true,
            sourceMap: false,
            targets: browersTarget,
            filename: id,
          }).code.toString();

          const code = `var data = ${toSource(data)};\n\n`;
          const exports = ["export default data;"];

          return {
            code: code + exports,
            map: { mappings: "" },
          };
        }, */
  }
}
