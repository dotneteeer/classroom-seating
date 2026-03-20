import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Если репозиторий называется иначе — измени base ниже
// Например: base: '/my-repo-name/'
export default defineConfig({
  plugins: [react()],
  base: '/ClassroomSeating/',
})
