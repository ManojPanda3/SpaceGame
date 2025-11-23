import { Player } from '../Player';

export class UIManager {
    updateScore(score: number) {
        const scoreEl = document.getElementById('scoreEl');
        if (scoreEl) scoreEl.innerHTML = score.toString();
    }

    updateHP(hp: number, maxHP: number) {
        const hpBarEl = document.getElementById('hpBarEl');
        if (hpBarEl) {
            const hpPercent = Math.max(0, (hp / maxHP) * 100);
            hpBarEl.style.width = `${hpPercent}%`;
        }
    }

    updatePowerUpUI(player: Player) {
        const shieldContainer = document.getElementById('shieldContainer');
        const doubleContainer = document.getElementById('doubleContainer');
        const speedContainer = document.getElementById('speedContainer');

        const shieldBar = document.getElementById('shieldBar');
        const doubleBar = document.getElementById('doubleBar');
        const speedBar = document.getElementById('speedBar');

        if (shieldContainer) shieldContainer.style.display = player.shieldTimer > 0 ? 'block' : 'none';
        if (doubleContainer) doubleContainer.style.display = player.doubleShotTimer > 0 ? 'block' : 'none';
        if (speedContainer) speedContainer.style.display = player.speedBoostTimer > 0 ? 'block' : 'none';

        const maxDuration = 300; // 5 seconds * 60 fps

        if (shieldBar) shieldBar.style.width = `${(player.shieldTimer / maxDuration) * 100}%`;
        if (doubleBar) doubleBar.style.width = `${(player.doubleShotTimer / maxDuration) * 100}%`;
        if (speedBar) speedBar.style.width = `${(player.speedBoostTimer / maxDuration) * 100}%`;
    }

    showPauseModal() {
        const pauseModalEl = document.getElementById('pauseModalEl');
        if (pauseModalEl) pauseModalEl.style.display = 'flex';
    }

    hidePauseModal() {
        const pauseModalEl = document.getElementById('pauseModalEl');
        if (pauseModalEl) pauseModalEl.style.display = 'none';
    }

    showGameOverModal(score: number) {
        const modalEl = document.getElementById('modalEl');
        const bigScoreEl = document.getElementById('bigScoreEl');
        if (modalEl) modalEl.style.display = 'flex';
        if (bigScoreEl) bigScoreEl.innerHTML = score.toString();
    }

    hideGameOverModal() {
        const modalEl = document.getElementById('modalEl');
        if (modalEl) modalEl.style.display = 'none';
    }

    resetUI() {
        const scoreEl = document.getElementById('scoreEl');
        const hpBarEl = document.getElementById('hpBarEl');
        const pauseModalEl = document.getElementById('pauseModalEl');
        const modalEl = document.getElementById('modalEl');

        if (scoreEl) scoreEl.innerHTML = '0';
        if (modalEl) modalEl.style.display = 'none';
        if (pauseModalEl) pauseModalEl.style.display = 'none';
        if (hpBarEl) hpBarEl.style.width = '100%';
        this.hideLeaderboard();
    }

    updateHighScoreUI(highScore: number) {
        const highScoreEl = document.getElementById('highScoreEl');
        if (highScoreEl) highScoreEl.innerHTML = highScore.toString();
    }

    showLeaderboard(data: any) {
        const leaderboardModal = document.getElementById('leaderboardModal');
        const leaderboardList = document.getElementById('leaderboardList');

        if (leaderboardModal) leaderboardModal.style.display = 'flex';

        if (leaderboardList) {
            let html = '';

            // Top Players
            data.top.forEach((item: any, index: number) => {
                const rank = index + 1;
                const isPlayer = item.isPlayer;
                const rowClass = isPlayer ? 'bg-purple-900/50 border border-purple-500' : 'border-b border-gray-800';
                const textClass = isPlayer ? 'text-yellow-300' : 'text-white';

                html += `
                <div class="flex justify-between ${rowClass} p-2 rounded items-center">
                    <span class="text-purple-400 w-12">#${rank}</span>
                    <span class="${textClass} flex-1 font-bold">${item.name}</span>
                    <span class="text-yellow-400">${Math.floor(item.score).toLocaleString()}</span>
                </div>`;
            });

            // Separator if needed
            if (data.context && data.context.length > 0) {
                html += `<div class="text-center text-gray-600 my-2">...</div>`;

                // Context Players (around user)
                data.context.forEach((item: any, index: number) => {
                    const rank = data.contextStartIndex + index + 1;
                    const isPlayer = item.isPlayer;
                    const rowClass = isPlayer ? 'bg-purple-900/50 border border-purple-500' : 'border-b border-gray-800';
                    const textClass = isPlayer ? 'text-yellow-300' : 'text-white';

                    html += `
                    <div class="flex justify-between ${rowClass} p-2 rounded items-center">
                        <span class="text-purple-400 w-12">#${rank}</span>
                        <span class="${textClass} flex-1 font-bold">${item.name}</span>
                        <span class="text-yellow-400">${Math.floor(item.score).toLocaleString()}</span>
                    </div>`;
                });
            }

            leaderboardList.innerHTML = html;
        }
    }

    hideLeaderboard() {
        const leaderboardModal = document.getElementById('leaderboardModal');
        if (leaderboardModal) leaderboardModal.style.display = 'none';
    }
}
