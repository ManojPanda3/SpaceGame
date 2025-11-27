import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: '/SpaceGame/',  // this is for github page so that i will use /SpaceGame url and not request assets from / route
    plugins: [
        tailwindcss(),
    ],
})
