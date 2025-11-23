export interface LeaderboardEntry {
    name: string;
    score: number;
    isPlayer?: boolean;
}

export class LeaderboardManager {
    entries: LeaderboardEntry[] = [];
    private lastUpdate: number = 0;
    private updateInterval: number = 1000; // Update every second

    constructor() {
        this.generateDummyData();
    }

    private generateDummyData() {
        // Generate ~120 dummy entries
        const names = [
            'CosmicAce', 'StarLord', 'NebulaNinja', 'VoidWalker', 'GalaxyGuardian',
            'SpaceCadet', 'RocketMan', 'AlienHunter', 'MeteorMasher', 'CometChaser',
            'PlanetPilot', 'StellarSurfer', 'AstroBoy', 'LunarLegend', 'SolarSoldier',
            'OrbitOperator', 'GravityGuru', 'BlackHoleBoss', 'QuasarQueen', 'PulsarPrince'
        ];

        for (let i = 0; i < 120; i++) {
            const name = names[i % names.length] + Math.floor(Math.random() * 1000);
            // Scores distributed to put player around #115 initially (low scores)
            // Top scores around 50k, dropping off
            let score = 0;
            if (i < 5) score = 50000 - i * 1000; // Top 5
            else score = Math.max(0, 50000 - i * 400 - Math.random() * 500);

            this.entries.push({ name, score });
        }

        this.sortEntries();
    }

    update(playerScore: number) {
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = now;

        // Update Player Entry
        const playerEntryIndex = this.entries.findIndex(e => e.isPlayer);
        if (playerEntryIndex !== -1) {
            this.entries[playerEntryIndex].score = playerScore;
        } else {
            this.entries.push({ name: 'YOU', score: playerScore, isPlayer: true });
        }

        // Simulate other players increasing their scores
        this.entries.forEach(entry => {
            if (!entry.isPlayer) {
                // Randomly increase score (active players)
                if (Math.random() > 0.7) {
                    entry.score += Math.floor(Math.random() * 50);
                }
            }
        });

        this.sortEntries();
    }

    private sortEntries() {
        this.entries.sort((a, b) => b.score - a.score);
    }

    getLeaderboardView() {
        const playerIndex = this.entries.findIndex(e => e.isPlayer);
        const top5 = this.entries.slice(0, 5);

        // If player is in top 5, just return top 5 (or slightly more)
        if (playerIndex < 5) {
            return { top: this.entries.slice(0, 8), playerRank: playerIndex + 1 };
        }

        // Otherwise return Top 5 + Player Context (e.g., #49, #50 (YOU), #51)
        const contextStart = Math.max(5, playerIndex - 1);
        const contextEnd = Math.min(this.entries.length, playerIndex + 2);
        const context = this.entries.slice(contextStart, contextEnd);

        return {
            top: top5,
            context: context,
            playerRank: playerIndex + 1,
            contextStartIndex: contextStart
        };
    }
}
