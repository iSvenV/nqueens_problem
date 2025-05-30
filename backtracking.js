class backtracking {
    
    constructor(main) {
        this.main = main; 
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
        if (this.main.stopProcess) {
            return false;
        }

        const N = this.main.n;
        const finalState = this.main.finalState;

        if (row >= N) { 
            if (finalState && !this.arraysEqual(state, finalState)) {
                return false; 
            }
            if (!this.main.stopProcess) { 
                alert("Solution found!");
            }
            return true; 
        }

        for (let col = 0; col < N; col++) {
            if (this.main.stopProcess) {
                return false;
            }

            if (this.main.paused) {
                await this.main.sleepWithPause(0); 
                if (this.main.stopProcess) { 
                    return false;
                }
            }

            const cell = this.main.cells[row][col];
            const originalColor = ((row + col) % 2 === 0) ? "#ebecd0" : "#789454";

            cell.style.backgroundColor = "yellow"; 
            await this.main.sleepWithPause(this.main.delay);

            if (this.main.stopProcess) {
                cell.style.backgroundColor = originalColor; 
                return false;
            }

            if (this.isSafe(state, row, col)) {
                state[row] = col;
                this.main.updateBoardDisplay(state);
                cell.style.backgroundColor = originalColor; 
                await this.main.sleepWithPause(this.main.delay);

                if (this.main.stopProcess) { 
                    return false; 
                }

                if (await this.solve(state, row + 1)) {
                    return true; 
                }

                if (this.main.stopProcess) { 
                    return false;
                }
                
                if (this.main.paused) await this.main.sleepWithPause(0);
                if (this.main.stopProcess) { 
                    return false; 
                }

                cell.style.backgroundColor = "red"; 
                await this.main.sleepWithPause(this.main.delay);
                
                if (this.main.stopProcess) { 
                    cell.style.backgroundColor = originalColor; 
                    return false;
                }

                state[row] = -1; 
                this.main.updateBoardDisplay(state);
                cell.style.backgroundColor = originalColor; 
                await this.main.sleepWithPause(this.main.delay);
                
                if (this.main.stopProcess) { return false; }

            } else { 
                cell.style.backgroundColor = originalColor; 
            }
        }
        return false; 
    }
}