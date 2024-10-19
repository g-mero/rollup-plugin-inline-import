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

    async resolveId(sourcePath, importer) {
      for (const transformer of transFormers) {
        if (sourcePath.startsWith(transformer.prefix)) {
          const path = sourcePath.slice(transformer.prefix.length)
          const ids = await this.resolve(path, importer)
          if (!ids) {
            return null
          }
          paths.set(ids.id, { handle: transformer.handler, importer })
          return `__viteSafe__${ids.id}__viteSafe__`
        }
      }

      return null
    },

    async load(id) {
      const p = id.replace(/__viteSafe__$/, '').replace(/^__viteSafe__/, '')
      if (!paths.has(p)) {
        return null
      }

      const args = paths.get(p)

      let code = await readFile(p, 'utf8')
      code = await args.handle(code, p)
      this.addWatchFile(p)

      return `export default ${JSON.stringify(code.trim())};`
    },
  }
}
