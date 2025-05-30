class main {
    //constructor
    constructor() {
        this.n = 0;
        this.initialState = [];
        this.finalState = null;
        this.cells = [];
        this.miniBoardElements = [];
        this.delay = 300;
        this.paused = false;
        this.stopProcess = false;
        this.solver = new backtracking(this); //default solver is backtracking
        this.appElement = document.getElementById("app");
    }

    //clearing page elements
    clearApp() {
        this.appElement.innerHTML = "";
    }

    //creating elements
    createElement(tag, text, className) {
        const el = document.createElement(tag);
        if (text) el.innerText = text;
        if (className) el.className = className;
        return el;
    }

    //delay function (used to change backtracking speed)
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //function to pause backtracking algorithm
    async sleepWithPause(ms) {
        let elapsed = 0;
        const step = 50; 
        while (elapsed < ms) {
            if (this.stopProcess) return;
            if (this.paused) {
                await this.sleep(step);
            } else {
                const delta = Math.min(step, ms - elapsed);
                await this.sleep(delta);
                elapsed += delta;
            }
        }
        while (this.paused) {
            if (this.stopProcess) return;
            await this.sleep(step);
        }
    }

    //toggle pause/resume
    togglePause() {
        this.paused = !this.paused;
        const pauseButton = document.getElementById("pauseButton");
        if (pauseButton) {
            pauseButton.textContent = this.paused ? "Resume" : "Pause";
        }
    }

    //generating chessboard for backtracking and mini-chessboards for GA
    createBoard(N, containerId = "boardContainer", cellClassName = "cell", isMainBoard = true) {
        const boardContainer = document.getElementById(containerId);
        if (!boardContainer) {
            console.error("Board container not found:", containerId);
            if (isMainBoard && this.appElement) {
                this.appElement.appendChild(this.createElement("div", "", "board"));
            }
            return [];
        }
        boardContainer.innerHTML = ""; 
        boardContainer.style.display = "grid";
        const cellSize = isMainBoard ? 60 : 12; 
        boardContainer.style.gridTemplateColumns = `repeat(${N}, ${cellSize}px)`;
        boardContainer.style.width = `calc(${N} * ${cellSize}px)`; 
        boardContainer.style.height = `calc(${N} * ${cellSize}px)`;
        boardContainer.className = isMainBoard ? "board" : "mini-board";

        let boardCells = [];
        for (let r = 0; r < N; r++) {
            let rowArray = [];
            for (let c = 0; c < N; c++) {
                const cell = this.createElement("div", "", cellClassName);
                cell.style.backgroundColor = ((r + c) % 2 === 0) ? "#eeeed2" : "#769656";
                if (!isMainBoard) { 
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;
                }
                boardContainer.appendChild(cell);
                rowArray.push(cell);
            }
            boardCells.push(rowArray);
        }
        if (isMainBoard) {
            this.cells = boardCells;
        }
        return boardCells;
    }

    //updating board based on given state
    updateBoardDisplay(state, boardCells = null, boardSize = 0, isMainBoard = true) {
        const currentCells = isMainBoard ? this.cells : boardCells;
        const currentN = isMainBoard ? this.n : boardSize;

        if (!currentCells || currentCells.length === 0 || currentCells.length !== currentN) {
            return;
        }

        for (let r = 0; r < currentN; r++) {
            for (let c = 0; c < currentN; c++) {
                if (currentCells[r] && currentCells[r][c]) {
                    const cell = currentCells[r][c];
                    cell.style.backgroundColor = ((r + c) % 2 === 0) ? "#eeeed2" : "#769656";
                    cell.innerHTML = ""; 
                    cell.classList.remove("queen"); 
                }
            }
            if (state && typeof state[r] !== 'undefined' && state[r] !== -1 && state[r] < currentN) { 
                const col = state[r];
                if (currentCells[r] && currentCells[r][col]) {
                    const cellToUpdate = currentCells[r][col];
                    if (isMainBoard) {
                        const queenImg = this.createElement("img");
                        queenImg.src = "queen.png"; 
                        queenImg.alt = "Queen";
                        cellToUpdate.appendChild(queenImg);
                    } else {
                        cellToUpdate.classList.add("queen");
                    }
                }
            }
        }
    }

    //page 1 : selecting N
    page1_initialN() {
        this.clearApp();
        this.paused = false; 
        this.appElement.appendChild(this.createElement("h1", "1. Initial State"));
        this.appElement.appendChild(this.createElement("p", "Enter board size N"));

        const controlsDiv = this.createElement("div", "", "controls");
        const nInput = this.createElement("input");
        nInput.type = "number";
        nInput.placeholder = "Enter N";
        nInput.min = "4"; // N less than 4 cannot be solved
        nInput.max = "8"; // N greater than 8 not optimal 
        nInput.value = this.n > 0 ? this.n.toString() : "4";
        controlsDiv.appendChild(nInput);

        const createBtn = this.createElement("button", "Create Board");
        createBtn.onclick = () => {
            const N = parseInt(nInput.value);
            this.n = N;
            this.initialState = new Array(N).fill(-1);
            this.page2_initialSetup();
        };
        controlsDiv.appendChild(createBtn);
        this.appElement.appendChild(controlsDiv);
        this.appElement.appendChild(this.createElement("div", "", "message"));
    }

    //page 2 : setting up initial state
    page2_initialSetup() {
        this.clearApp();
        this.paused = false;
        this.appElement.appendChild(this.createElement("h1", "1. Initial State"));
        this.appElement.appendChild(this.createElement("p", "Click on squares to place/remove a queen (maximum 1 queen per row)."));

        const boardDiv = this.createElement("div");
        boardDiv.id = "boardContainer"; 
        this.appElement.appendChild(boardDiv);

        this.createBoard(this.n, "boardContainer", "cell", true);
        this.updateBoardDisplay(this.initialState, this.cells, this.n, true);

        for (let r = 0; r < this.n; r++) {
            for (let c = 0; c < this.n; c++) {
                this.cells[r][c].onclick = () => {
                    if (this.initialState[r] === c) {
                        this.initialState[r] = -1;
                    } else {
                        this.initialState[r] = c;
                    }   
                    this.updateBoardDisplay(this.initialState, this.cells, this.n, true);
                };
            }
        }

        const setInitialBtn = this.createElement("button", "Set Initial State");
        setInitialBtn.onclick = () => {
            if (!this.solver.stateIsValid(this.initialState)) {
                alert("Invalid: Some queens are threatening each other");
                return;
            }
            this.page3_finalSetup();
        };
        this.appElement.appendChild(setInitialBtn);

        const backBtn = this.createElement("button", "Back");
        backBtn.onclick = () => this.page1_initialN();
        this.appElement.appendChild(backBtn);
    }

    //page 3 : setting up final state
    page3_finalSetup() {
        this.clearApp();
        this.paused = false; 

        this.appElement.appendChild(this.createElement("h1", "2. Final State"));
        this.appElement.appendChild(this.createElement("p", "Place one queen per row (no conflicts allowed)"));

        if (!this.finalState || this.finalState.length !== this.n) {
            this.finalState = new Array(this.n).fill(-1);
        }

        const boardDiv = this.createElement("div");
        boardDiv.id = "boardContainer";
        this.appElement.appendChild(boardDiv);

        this.createBoard(this.n, "boardContainer", "cell", true);
        this.updateBoardDisplay(this.finalState, this.cells, this.n, true); 

        for (let r = 0; r < this.n; r++) {
            for (let c = 0; c < this.n; c++) {
                this.cells[r][c].onclick = () => {
                    if (this.finalState[r] === c) {
                        this.finalState[r] = -1; 
                    } else {
                        this.finalState[r] = c; 
                    }
                    this.updateBoardDisplay(this.finalState, this.cells, this.n, true);
                };
            }
        }

        const setFinalBtn = this.createElement("button", "Set Final State");
        setFinalBtn.onclick = () => {
            if (!this.solver.stateIsComplete(this.finalState)) {
                alert("place one queen per row!");
                return;
            }
            if (!this.solver.stateIsValid(this.finalState)) {
                alert("Invalid: Some queens are threatening each other.");
                return;
            }
            this.page4_algorithm();
        };
        this.appElement.appendChild(setFinalBtn);

        // not setting final state
        const noFinalBtn = this.createElement("button", "No Final State");
        noFinalBtn.onclick = () => {
            this.finalState = null; 
            this.page4_algorithm();
        };
        this.appElement.appendChild(noFinalBtn);

        const backBtn = this.createElement("button", "Back");
        backBtn.onclick = () => this.page2_initialSetup(); 
        this.appElement.appendChild(backBtn);
    }

    // page 4 : choosing algorithm
    page4_algorithm() {
        this.clearApp();
        this.paused = false;

        this.appElement.appendChild(this.createElement("h1", "3. Select Algorithm"));
        this.appElement.appendChild(this.createElement("p", "Choose an algorithm"));

        const buttonContainer = this.createElement("div", "", "controls"); 
        const backtrackBtn = this.createElement("button", "Backtracking");
        const gaBtn = this.createElement("button", "Genetic Algorithm"); 
        const backToPage3Btn = this.createElement("button", "Back");

        backtrackBtn.onclick = () => {
            this.page5_backtrack();
        };
        buttonContainer.appendChild(backtrackBtn);

        gaBtn.onclick = () => { 
            this.page5_genetic();   
        };
        buttonContainer.appendChild(gaBtn);
        this.appElement.appendChild(buttonContainer);

        backToPage3Btn.innerText = "Back";
        backToPage3Btn.onclick = () => this.page3_finalSetup();
        this.appElement.appendChild(backToPage3Btn);
    }

    // page 5 backtracking : solution process using backtracking algorithm
    page5_backtrack() {
        this.clearApp();
        this.paused = false; 
        this.stopProcess = false; 

        this.appElement.appendChild(this.createElement("h1", "Solving Process (Backtracking)"));

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

        this.createBoard(this.n, "boardContainer", "cell", true);
        const solutionState = this.initialState.slice();
        this.updateBoardDisplay(solutionState, this.cells, this.n, true);

        const backBtnDiv = this.createElement("div"); 
        const backBtn = this.createElement("button", "Back");

        backBtn.onclick = () => {
            this.stopProcess = true; 
            this.paused = false;    
            const pauseButton = document.getElementById("pauseButton");
            if (pauseButton) {
                pauseButton.textContent = "Pause"; 
            }
            this.page4_algorithm();
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
                    alert("Initial state is a solution, but not the target");
                } else {
                    alert("Initial state is already a valid solution!");
                }
            } else { 
                alert("Initial state is invalid");
                return; 
            }
        }

        setTimeout(async () => {
            if (this.stopProcess) {
                return;
            }
            const found = await this.solver.solve(solutionState, startRow); 
            if (this.stopProcess) {
                return;
            }
            if (!found) {
                if (this.finalState && this.solver.arraysEqual(solutionState, this.finalState)) {
                } else if (!(this.solver.stateIsValid(solutionState) && this.solver.stateIsComplete(solutionState))) {
                    alert("Error");
                }
            }
        }, 500);
    }

    //page 5 genetic : solution process using Genetic Algorithm
    async page5_genetic() {
        this.clearApp();
        this.paused = false; 
        this.stopProcess = false;
        this.miniBoardElements = [];

        this.appElement.appendChild(this.createElement("h1", "Solving Process (Genetic Algorithm)"));

        this.appElement.appendChild(this.createElement("h2", "Best Solution:"));
        const mainBoardDivGA = this.createElement("div");
        mainBoardDivGA.id = "gaMainBoardContainer"; 
        this.appElement.appendChild(mainBoardDivGA);
        this.createBoard(this.n, "gaMainBoardContainer", "cell", true); 
        if (this.initialState && this.initialState.length === this.n) {
            this.updateBoardDisplay(this.initialState, this.cells, this.n, true);
        } else {
            this.updateBoardDisplay(new Array(this.n).fill(-1), this.cells, this.n, true);
        }

        const progressDiv = this.createElement("div", "", "ga-progress-container");
        progressDiv.id = "gaProgressInfo";
        this.appElement.appendChild(progressDiv);

        const populationSize = 50; 
        const maxGenerations = 10; 

        this.appElement.appendChild(this.createElement("h3", `Population(${populationSize}):`));
        const miniBoardsArea = this.createElement("div", "", "mini-boards-display-area");
        miniBoardsArea.id = "gaMiniBoardsContainer";
        this.appElement.appendChild(miniBoardsArea);

        for (let i = 0; i < populationSize; i++) {
            const wrapper = this.createElement("div", "", "mini-board-wrapper");
            const boardElementContainer = this.createElement("div");
            boardElementContainer.id = `miniBoardContainer_${i}`; 
            const fitnessElement = this.createElement("p", `Attacks: -`, "mini-board-fitness");
            fitnessElement.id = `miniBoardFitness_${i}`;
            
            wrapper.appendChild(boardElementContainer);
            wrapper.appendChild(fitnessElement);
            miniBoardsArea.appendChild(wrapper);
            this.miniBoardElements[i] = this.createBoard(this.n, `miniBoardContainer_${i}`, "mini-cell", false);
        }
        
        const backBtnDiv = this.createElement("div"); 
        const backBtn = this.createElement("button", "Back");
        backBtn.onclick = () => {
            this.stopProcess = true; 
            this.page4_algorithm();
        };
        backBtnDiv.appendChild(backBtn);
        this.appElement.appendChild(backBtnDiv);
        
        const gaSolverInstance = new GeneticAlgorithm(populationSize, this.n, this, this.initialState);
        
        const onGenCallback = (genNum, currentPopulation, currentFitnessScores, overallBestInd, overallBestFit) => {
            if (progressDiv) { 
                progressDiv.innerHTML = 
                    `<p>Generation: ${genNum} / ${maxGenerations}</p>
                    <p>Overall Best Attacks: ${overallBestFit} -> [${overallBestInd ? overallBestInd.join(', ') : 'N/A'}]</p>`;
            }
            if (overallBestInd) {
                this.updateBoardDisplay(overallBestInd, this.cells, this.n, true); 
            }

            for (let i = 0; i < populationSize; i++) {
                const fitnessElement = document.getElementById(`miniBoardFitness_${i}`);
                if (currentPopulation[i] && typeof currentFitnessScores[i] !== 'undefined') {
                    const individualToShow = currentPopulation[i];
                    const individualFitness = currentFitnessScores[i];
                    if (this.miniBoardElements[i]) { 
                        this.updateBoardDisplay(individualToShow, this.miniBoardElements[i], this.n, false);
                    }
                    if (fitnessElement) fitnessElement.innerText = `Attacks: ${individualFitness}`;
                } else {
                    if (this.miniBoardElements[i]) {
                        this.updateBoardDisplay(new Array(this.n).fill(-1), this.miniBoardElements[i], this.n, false);
                    }
                    if (fitnessElement) fitnessElement.innerText = `Attacks: -`;
                }
            }
        };

        progressDiv.innerHTML = "<p>Starting Genetic Algorithm...</p>";
        const solution1D = await gaSolverInstance.runEvolution(maxGenerations, 0, onGenCallback); 

        if (this.stopProcess) {
            console.log("GA was stopped by user.");
            if (progressDiv) progressDiv.innerHTML += "<p>Process stopped by user.</p>";
            return; 
        }

        if (solution1D && gaSolverInstance.calculateFitness(solution1D) === 0) {
            this.updateBoardDisplay(solution1D, this.cells, this.n, true); 
            if (progressDiv) {
                progressDiv.innerHTML = 
                    `<p>Solution Fount at Generation ${gaSolverInstance.generationCount}!</p>
                    <p>Attacks: 0</p>`;
            }
        } else {
            const bestSolution = gaSolverInstance.getBestSolution1D();
            if (bestSolution) {
                this.updateBoardDisplay(bestSolution, this.cells, this.n, true);
            }
            if (progressDiv) {
                const bestSolArray = gaSolverInstance.getBestSolution1D();
                progressDiv.innerHTML = 
                    `<p>Max ${maxGenerations} generations reached. Best attempt shown.</p>
                    <p>Overall Best Attacks: ${gaSolverInstance.bestFitnessOverall}</p>
                    <p>Best Board: [${bestSolArray ? bestSolArray.join(', ') : 'N/A'}]</p>`;
            }
        }
    }
}

// Main entry point when the window loads
window.onload = () => {
    const app = new main();
    app.page1_initialN();
};