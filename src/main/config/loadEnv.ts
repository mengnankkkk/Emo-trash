import { existsSync } from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'

const candidateFiles = ['.env.local', '.env']

export function loadEnvConfig(): void {
  candidateFiles.forEach((fileName) => {
    const filePath = resolve(process.cwd(), fileName)
    if (!existsSync(filePath)) {
      return
    }

    dotenv.config({
      path: filePath,
      override: false
    })
  })
}
