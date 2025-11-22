import './style.css'
import { Game } from './Game'

const canvas = document.querySelector('canvas')
const startGameBtn = document.querySelector('#startGameBtn')
const modalEl = document.querySelector('#modalEl') as HTMLElement

if (canvas) {
  const game = new Game(canvas)

  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      game.start()
      if (modalEl) modalEl.style.display = 'none'
    })
  }
}
