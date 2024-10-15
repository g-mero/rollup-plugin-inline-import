import type { Plugin } from 'rollup'
import { readFile } from 'node:fs/promises'
import { transform as lightCss } from 'lightningcss'
import { compileAsync } from 'sass'
import browersTarget from './browserslist.ts'

export interface Transformer {
  prefix: string
  handler: (code: string, id: string) => Promise<string> | string
}

export interface Options {
  /**
   *  Custom transformer
   */
  transformer?: Transformer | Transformer[]
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

// remove old duplicate
function pushUnique(arr: Transformer[], ...item: Transformer[]) {
  // remove old duplicate
  for (const i of item) {
    const index = arr.findIndex(v => v.prefix === i.prefix)
    if (index !== -1) {
      arr.splice(index, 1)
    }
    arr.push(i)
  }
  return arr
}

export default function inline(opts: Options = {}): Plugin {
  const options = Object.assign({}, opts)
  const { transformer } = options

  const transFormers: Transformer[] = []

  transFormers.push(
    { prefix: 'inline:', handler: (code: string) => code },
    {
      prefix: 'css:',
      handler: cssTransformer,
    },
    {
      prefix: 'scss:',
      handler: cssTransformer,
    },
    {
      prefix: 'sass:',
      handler: cssTransformer,
    },
  )

  if (transformer) {
    if (Array.isArray(transformer)) {
      pushUnique(transFormers, ...transformer)
    }
    else {
      pushUnique(transFormers, transformer)
    }
  }

  const paths = new Map()

  return {
    name: 'rollup-plugin-inline-import',

    resolveId: (sourcePath, importer) => {
      for (const transformer of transFormers) {
        if (sourcePath.startsWith(transformer.prefix)) {
          const path = sourcePath.slice(transformer.prefix.length)
          paths.set(path, { importer, handle: transformer.handler })
          return `${path}__viteSafe__`
        }
      }

      return null
    },

    async load(id) {
      const p = id.replace(/__viteSafe__$/, '')
      if (!paths.has(p)) {
        return null
      }
      const args = paths.get(p)
      const ids = await this.resolve(p, args.importer)
      if (!ids) {
        return null
      }

      let code = await readFile(ids.id, 'utf8')
      code = await args.handle(code, ids.id)

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
