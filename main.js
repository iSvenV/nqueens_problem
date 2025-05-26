class main {
    constructor() {
        this.n = 0;
        this.initialState = [];
        this.finalState = null;
        this.cells = [];
        this.delay = 300;
        this.paused = false;
        this.stopProcess = false;
        this.solver = new backtracking(this);
        this.appElement = document.getElementById("app");
    }

    clearApp() {
        this.appElement.innerHTML = "";
    }

    createElement(tag, text, className) {
        const el = document.createElement(tag);
        if (text) el.innerText = text;
        if (className) el.className = className;
        return el;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async sleepWithPause(ms) {
        let elapsed = 0;
        const step = 50; 
        while (elapsed < ms) {
            if (this.paused) {
                await this.sleep(step);
            } else {
                const delta = Math.min(step, ms - elapsed);
                await this.sleep(delta);
                elapsed += delta;
            }
        }
        while (this.paused) {
            await this.sleep(step);
        }
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseButton = document.getElementById("pauseButton");
        if (pauseButton) {
            pauseButton.textContent = this.paused ? "Resume" : "Pause";
        }
    }

    createBoard(N) {
        const boardContainer = document.getElementById("boardContainer");
        if (!boardContainer) {
            console.error("Board container not found during createBoard!");
            this.appElement.appendChild(this.createElement("div", "", "board"));
            return;
        }
        boardContainer.innerHTML = ""; 
        boardContainer.style.display = "grid";
        boardContainer.style.gridTemplateColumns = `repeat(${N}, 60px)`;
        boardContainer.style.width = `${N * 60}px`;
        boardContainer.style.height = `${N * 60}px`;
        boardContainer.className = "board";

        this.cells = [];
        for (let r = 0; r < N; r++) {
            let rowArray = [];
            for (let c = 0; c < N; c++) {
                const cell = this.createElement("div", "", "cell");
                cell.style.backgroundColor = ((r + c) % 2 === 0) ? "#ebecd0" : "#789454";
                boardContainer.appendChild(cell);
                rowArray.push(cell);
            }
            this.cells.push(rowArray);
        }
    }

    updateBoardDisplay(state) {
        if (!this.cells || this.cells.length === 0 || this.cells.length !== this.n) {
            return;
        }
        for (let r = 0; r < this.n; r++) {
            for (let c = 0; c < this.n; c++) {
                const cell = this.cells[r][c];
                if (!cell) continue;
                cell.style.backgroundColor = ((r + c) % 2 === 0) ? "#ebecd0" : "#789454";
                cell.innerHTML = ""; 
            }
            if (state[r] !== -1 && state[r] < this.n) { 
                const col = state[r];
                const cell = this.cells[r][col];
                if (!cell) continue;
                const queenImg = this.createElement("img");
                queenImg.src = "queen.png"; 
                queenImg.alt = "Queen";
                cell.appendChild(queenImg);
            }
        }
    }

    page1_initialN() {
        this.clearApp();
        this.paused = false; 
        this.appElement.appendChild(this.createElement("h1", "1. Initial State"));
        this.appElement.appendChild(this.createElement("p", "Enter board size N."));

        const controlsDiv = this.createElement("div", "", "controls");
        const nInput = this.createElement("input");
        nInput.type = "number";
        nInput.placeholder = "Enter N";
        nInput.min = "1";
        nInput.value = this.n > 0 ? this.n.toString() : "8";
        controlsDiv.appendChild(nInput);

        const createBtn = this.createElement("button", "Create Board");
        createBtn.onclick = () => {
            const N = parseInt(nInput.value);
            if (isNaN(N) || N <= 0) {
                alert("Please enter a valid number greater than 0.");
                return;
            }
            this.n = N;
            this.initialState = new Array(N).fill(-1);
            this.page2_initialSetup();
        };
        controlsDiv.appendChild(createBtn);
        this.appElement.appendChild(controlsDiv);
        this.appElement.appendChild(this.createElement("div", "", "message"));
    }

    page2_initialSetup() {
        this.clearApp();
        this.paused = false;
        this.appElement.appendChild(this.createElement("h1", "1. Initial State"));
        this.appElement.appendChild(this.createElement("p", "Click on squares to place/remove a queen (maximum 1 queen per row)."));

        const boardDiv = this.createElement("div");
        boardDiv.id = "boardContainer"; 
        this.appElement.appendChild(boardDiv);

        this.createBoard(this.n);
        this.updateBoardDisplay(this.initialState);

        for (let r = 0; r < this.n; r++) {
            for (let c = 0; c < this.n; c++) {
                this.cells[r][c].onclick = () => {
                    if (this.initialState[r] === c) {
                        this.initialState[r] = -1;
                    } else {
                        this.initialState[r] = c;
                    }
                    this.updateBoardDisplay(this.initialState);
                };
            }
        }

        const setInitialBtn = this.createElement("button", "Set Initial State");
        setInitialBtn.onclick = () => {
            if (!this.solver.stateIsValid(this.initialState)) {
                alert("Invalid configuration: Some queens are threatening each other.");
                return;
            }
            this.page3_finalSetup();
        };
        this.appElement.appendChild(setInitialBtn);

        const backBtn = this.createElement("button", "Back");
        backBtn.onclick = () => this.page1_initialN();
        this.appElement.appendChild(backBtn);
    }

    page3_finalSetup() {
        this.clearApp();
        this.paused = false; 

        this.appElement.appendChild(this.createElement("h1", "2. Final State"));
        this.appElement.appendChild(this.createElement("p", "Place one queen per row (no conflicts allowed) for the desired final solution. Or skip."));

        if (!this.finalState || this.finalState.length !== this.n) {
            this.finalState = new Array(this.n).fill(-1);
        }

        const boardDiv = this.createElement("div");
        boardDiv.id = "boardContainer";
        this.appElement.appendChild(boardDiv);

        this.createBoard(this.n);
        this.updateBoardDisplay(this.finalState); 

        for (let r = 0; r < this.n; r++) {
            for (let c = 0; c < this.n; c++) {
                this.cells[r][c].onclick = () => {
                    if (this.finalState[r] === c) {
                        this.finalState[r] = -1; 
                    } else {
                        this.finalState[r] = c; 
                    }
                    this.updateBoardDisplay(this.finalState);
                };
            }
        }

        const setFinalBtn = this.createElement("button", "Set Final State");
        setFinalBtn.onclick = () => {
            if (!this.solver.stateIsComplete(this.finalState)) {
                alert("Please place exactly one queen per row for the final state.");
                return;
            }
            if (!this.solver.stateIsValid(this.finalState)) {
                alert("Invalid final state: Some queens are threatening each other.");
                return;
            }
            this.page4_solution();
        };
        this.appElement.appendChild(setFinalBtn);

        const noFinalBtn = this.createElement("button", "No Specific Final State");
        noFinalBtn.onclick = () => {
            this.finalState = null; 
            this.page4_solution();
        };
        this.appElement.appendChild(noFinalBtn);

        const backBtn = this.createElement("button", "Back to Initial Setup");
        backBtn.onclick = () => this.page2_initialSetup(); 
        this.appElement.appendChild(backBtn);
    }

    page4_solution() {
        this.clearApp();
        this.paused = false; 
        this.stopProcess = false; 

        this.appElement.appendChild(this.createElement("h1", "Solving Process"));

        const speedDiv = this.createElement("div", "", "speed-controls");
        const speedLabel = this.createElement("label", "Speed: ");
        speedLabel.htmlFor = "speedSlider";
        speedDiv.appendChild(speedLabel);

        const speedSlider = this.createElement("input");
        speedSlider.type = "range";
        speedSlider.id = "speedSlider";
        speedSlider.min = "1";
        speedSlider.max = "10";
        speedSlider.value = Math.max(1, Math.min(10, Math.round((550 - this.delay) / 50))).toString();
        speedSlider.step = "1";
        speedDiv.appendChild(speedSlider);

        const speedValue = this.createElement("span", speedSlider.value);
        speedValue.id = "speedValue";
        speedDiv.appendChild(speedValue);

        speedSlider.oninput = () => {
            const level = parseInt(speedSlider.value);
            this.delay = (11 - level) * 50;
            speedValue.innerText = level.toString();
        };

        const pauseBtn = this.createElement("button", "Pause");
        pauseBtn.id = "pauseButton";
        pauseBtn.onclick = () => this.togglePause();
        speedDiv.appendChild(pauseBtn);
        this.appElement.appendChild(speedDiv);

        const boardDiv = this.createElement("div");
        boardDiv.id = "boardContainer";
        this.appElement.appendChild(boardDiv);

        this.createBoard(this.n);
        const solutionState = this.initialState.slice();
        this.updateBoardDisplay(solutionState);

        const backBtnDiv = this.createElement("div"); 
        const backBtn = this.createElement("button", "Back to Final State Setup");
        
        backBtn.onclick = () => {
            this.stopProcess = true; 
            this.paused = false;    
            const pauseButton = document.getElementById("pauseButton");
            if (pauseButton) {
                pauseButton.textContent = "Pause"; 
            }
            this.page3_finalSetup();
        };
        backBtnDiv.appendChild(backBtn);
        this.appElement.appendChild(backBtnDiv);

        let startRow = 0;
        let allRowsPreFilled = true;
        for(let i=0; i < this.n; i++) {
            if(solutionState[i] === -1) {
                startRow = i;
                allRowsPreFilled = false;
                break;
            }
        }

        if (allRowsPreFilled) { 
            if(this.solver.stateIsValid(solutionState)) { 
                 if (this.finalState && !this.solver.arraysEqual(solutionState, this.finalState)) {
                    alert("Initial state is a solution, but not the target one. The solver will attempt to find the target if specified, or other solutions.");
                } else {
                    alert("Initial state is already a valid solution!");
                }
            } else { 
                alert("Initial state is complete but invalid. Please correct it or clear some queens for the solver.");
                return; 
            }
        }
        
        setTimeout(async () => {
            if (this.stopProcess) {
                console.log("Solver launch aborted as stop was requested before starting.");
                return;
            }

            const found = await this.solver.solve(solutionState, startRow);

            if (this.stopProcess) {
                console.log("Solver process was stopped by the user during execution.");
                return;
            }

            if (!found) {
                if (this.finalState && this.solver.arraysEqual(solutionState, this.finalState)) {
                } else if (!(this.solver.stateIsValid(solutionState) && this.solver.stateIsComplete(solutionState))) {
                    alert("No further solution found from the current configuration that matches the criteria.");
                }
            }
        }, 500);
    }
}

window.onload = () => {
    const app = new main();
    app.page1_initialN();
};