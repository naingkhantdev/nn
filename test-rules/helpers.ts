import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'

const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

export let env: RulesTestEnvironment

export async function setup() {
  env = await initializeTestEnvironment({
    projectId: 'demo-mochi',
    firestore: {
      rules: readFileSync(rulesPath, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
}

type Db = ReturnType<
  RulesTestEnvironment['unauthenticatedContext']
>['firestore'] extends () => infer D
  ? D
  : never

export async function seed(extra?: (db: Db) => Promise<void>) {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'config/members'), { uids: ['owner', 'her'] })
    await setDoc(doc(db, 'config/features'), { sulk: false })
    if (extra) await extra(db)
  })
}

export const asOwner = () => env.authenticatedContext('owner').firestore()
export const asHer = () => env.authenticatedContext('her').firestore()
export const asStranger = () => env.authenticatedContext('stranger').firestore()
export const signedOut = () => env.unauthenticatedContext().firestore()
