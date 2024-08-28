import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

const browers = browserslist()

const browersTarget = browserslistToTargets(browers)

export default browersTarget
