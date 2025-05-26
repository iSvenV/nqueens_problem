class backtracking {
    
    constructor(appManager) {
        this.appManager = appManager; 
    }

    isSafe(state, row, col) {
        for (let i = 0; i < row; i++) {
            if (state[i] === col || Math.abs(state[i] - col) === Math.abs(i - row)) {
                return false;
            }
        }
        return true;
    }

    stateIsValid(state) {
        for (let i = 0; i < state.length; i++) {
            if (state[i] === -1) continue;
            for (let j = i + 1; j < state.length; j++) {
                if (state[j] === -1) continue;
                if (state[i] === state[j] || Math.abs(state[i] - state[j]) === Math.abs(i - j)) {
                    return false;
                }
            }
        }
        return true;
    }

    stateIsComplete(state) {
        return state.every(val => val !== -1);
    }

    arraysEqual(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    async solve(state, row) {
        if (this.appManager.stopSolver) {
            return false;
        }

        const N = this.appManager.globalN;
        const userFinalState = this.appManager.userFinalState;

        if (row >= N) { 
            if (userFinalState && !this.arraysEqual(state, userFinalState)) {
                return false; 
            }
            if (!this.appManager.stopSolver) { 
                alert("Solution found!");
            }
            return true; 
        }

        for (let col = 0; col < N; col++) {
            if (this.appManager.stopSolver) {
                return false;
            }

            if (this.appManager.paused) {
                await this.appManager.sleepWithPause(0); 
                if (this.appManager.stopSolver) { 
                    return false;
                }
            }

            const cell = this.appManager.cells[row][col];
            const originalColor = ((row + col) % 2 === 0) ? "#ebecd0" : "#789454";

            cell.style.backgroundColor = "yellow"; 
            await this.appManager.sleepWithPause(this.appManager.currentDelay);

            if (this.appManager.stopSolver) {
                cell.style.backgroundColor = originalColor; 
                return false;
            }

            if (this.isSafe(state, row, col)) {
                state[row] = col;
                this.appManager.updateBoardDisplay(state);
                cell.style.backgroundColor = originalColor; 
                await this.appManager.sleepWithPause(this.appManager.currentDelay);

                if (this.appManager.stopSolver) { 
                    return false; 
                }

                if (await this.solve(state, row + 1)) {
                    return true; 
                }

                if (this.appManager.stopSolver) { 
                    return false;
                }
                
                if (this.appManager.paused) await this.appManager.sleepWithPause(0);
                if (this.appManager.stopSolver) { 
                    return false; 
                }

                cell.style.backgroundColor = "red"; 
                await this.appManager.sleepWithPause(this.appManager.currentDelay);
                
                if (this.appManager.stopSolver) { 
                    cell.style.backgroundColor = originalColor; 
                    return false;
                }

                state[row] = -1; 
                this.appManager.updateBoardDisplay(state);
                cell.style.backgroundColor = originalColor; 
                await this.appManager.sleepWithPause(this.appManager.currentDelay);
                
                if (this.appManager.stopSolver) { return false; }

            } else { 
                cell.style.backgroundColor = originalColor; 
            }
        }
        return false; 
    }
}