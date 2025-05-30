class genetic {
    constructor(populationSize, boardSize, mainAppInterface, initialState1D = null) {
        this.populationSize = parseInt(populationSize) || 100;
        this.boardSize = parseInt(boardSize);
        this.main = mainAppInterface; 
        this.initialState1D = initialState1D ? [...initialState1D] : null; 
        this.population = []; 
        this.bestSolutionOverall = null;
        this.bestFitnessOverall = this.boardSize * this.boardSize; 
        this.generationCount = 0;
    }

    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            let individual = new Array(this.boardSize);
            for (let r = 0; r < this.boardSize; r++) {
                individual[r] = Math.floor(Math.random() * this.boardSize);
            }
            this.population.push(individual);
        }
        this.bestSolutionOverall = null;
        this.bestFitnessOverall = (this.boardSize * (this.boardSize - 1)); 
        this.generationCount = 0;
    }


    calculateFitness(individual) {
        let attackingPairs = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = i + 1; j < this.boardSize; j++) {
                if (individual[i] === individual[j]) {
                    attackingPairs++;
                }
                if (Math.abs(i - j) === Math.abs(individual[i] - individual[j])) {
                    attackingPairs++;
                }
            }
        }
        return attackingPairs;
    }

    selection() {
        let parents = [];
        const tournamentSize = 5; 

        for (let i = 0; i < this.populationSize; i++) {
            let bestInTournament = null;
            let bestFitnessInTournament = this.boardSize * this.boardSize; 

            for (let j = 0; j < tournamentSize; j++) {
                let randomIndex = Math.floor(Math.random() * this.populationSize);
                let competitor = this.population[randomIndex];
                let competitorFitness = this.calculateFitness(competitor);

                if (competitorFitness < bestFitnessInTournament) {
                    bestFitnessInTournament = competitorFitness;
                    bestInTournament = competitor;
                }
            }
            parents.push(bestInTournament); 
        }
        return parents; 
    }

    crossover(parent1, parent2) {
        const child1 = [...parent1];
        const child2 = [...parent2];
        
        if (!parent1 || !parent2 || parent1.length !== this.boardSize || parent2.length !== this.boardSize) {
            return [this.population[Math.floor(Math.random() * this.populationSize)], 
                    this.population[Math.floor(Math.random() * this.populationSize)]]; 
        }

        if (this.boardSize <= 1) return [[...parent1], [...parent2]]; 

        const point = Math.floor(Math.random() * (this.boardSize - 1)) + 1; 

        for (let i = point; i < this.boardSize; i++) {
            const temp = child1[i];
            child1[i] = child2[i];
            child2[i] = temp;
        }
        return [child1, child2];
    }

    mutation(individual, mutationRate = 0.1) { 
        if (Math.random() < mutationRate) {
            if (this.boardSize > 0) {
                const rowIndex = Math.floor(Math.random() * this.boardSize);
                const newColumnValue = Math.floor(Math.random() * this.boardSize);
                individual[rowIndex] = newColumnValue;
            }
        }
        return individual;
    }

    async runEvolution(maxGenerations = 200, targetFitness = 0) {
        this.initializePopulation();
        this.generationCount = 0;

        for (let gen = 0; gen < maxGenerations; gen++) {
            if (this.main && this.main.stopProcess) {
                console.log("Genetic Algorithm evolution stopped by user.");
                return this.bestSolutionOverall; 
            }

            this.generationCount = gen;
            let newPopulation = [];
            let currentFitnessScores = this.population.map(ind => this.calculateFitness(ind));

            for (let i = 0; i < this.populationSize; i++) {
                if (currentFitnessScores[i] < this.bestFitnessOverall) {
                    this.bestFitnessOverall = currentFitnessScores[i];
                    this.bestSolutionOverall = [...this.population[i]];
                }
            }

            if (this.bestFitnessOverall === targetFitness) {
                console.log(`Genetic Algorithm: Solution found in generation ${gen} with fitness ${this.bestFitnessOverall}`);
                return this.bestSolutionOverall;
            }

            let selectedParents = this.selection(); 

            for (let i = 0; i < this.populationSize; i += 2) {
                if (i + 1 >= selectedParents.length) { 
                    if(selectedParents[i]) newPopulation.push([...selectedParents[i]]); 
                    break;
                }

                let parent1 = selectedParents[i];
                let parent2 = selectedParents[i+1];
                
                let children = this.crossover(parent1, parent2);
                
                newPopulation.push(this.mutation([...children[0]]));
                if (newPopulation.length < this.populationSize) {
                    newPopulation.push(this.mutation([...children[1]]));
                }
            }
            this.population = newPopulation;

            if (this.main && gen % 20 === 0) { 
                await this.main.sleep(1);
            }
        }

        console.log(`Genetic Algorithm: Finished ${maxGenerations} generations. Best fitness found: ${this.bestFitnessOverall}`);
        return this.bestSolutionOverall;
    }

    getBestSolution1D() {
        return this.bestSolutionOverall;
    }
}