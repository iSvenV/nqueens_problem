class GeneticAlgorithm {
    //constrctor
    constructor(populationSize, boardSize, mainAppInterface, initialState1D = null) {
        this.populationSize = parseInt(populationSize) || 100;
        this.boardSize = parseInt(boardSize);
        this.main = mainAppInterface; 
        this.initialState1D = initialState1D ? [...initialState1D] : null;

        this.population = [];
        this.fitnessScores = [];
        this.bestSolutionOverall = null;
        this.bestFitnessOverall = (this.boardSize * (this.boardSize - 1)) / 2 +1; // Initialize high
        this.generationCount = 0;
    }

    //initial population
    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            let individual = new Array(this.boardSize);
            for (let r = 0; r < this.boardSize; r++) {
                individual[r] = Math.floor(Math.random() * this.boardSize);
            }
            this.population.push(individual);
        }
        this.fitnessScores = this.population.map(ind => this.calculateFitness(ind));
        this.bestSolutionOverall = [...this.population[0]]; 
        this.bestFitnessOverall = this.fitnessScores[0];

        for(let i = 1; i < this.populationSize; i++) {
            if (this.fitnessScores[i] < this.bestFitnessOverall) {
                this.bestFitnessOverall = this.fitnessScores[i];
                this.bestSolutionOverall = [...this.population[i]];
            }
        }
        this.generationCount = 0;
    }

    //fitness function (number of queens pairs that attack)
    calculateFitness(individual) {
        if (!individual || individual.length !== this.boardSize) return (this.boardSize * (this.boardSize - 1)) / 2 + 1;
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

    //selecting parents for reproduction
    selection() {
        let parents = [];
        const tournamentSize = Math.min(5, this.populationSize);

        for (let i = 0; i < this.populationSize; i++) {
            let bestInTournament = null;
            let bestFitnessInTournament = (this.boardSize * (this.boardSize - 1)) / 2 + 2; 

            for (let j = 0; j < tournamentSize; j++) {
                let randomIndex = Math.floor(Math.random() * this.populationSize);
                if (this.population[randomIndex] && typeof this.fitnessScores[randomIndex] !== 'undefined') {
                    let competitor = this.population[randomIndex];
                    let competitorFitness = this.fitnessScores[randomIndex];

                    if (competitorFitness < bestFitnessInTournament) {
                        bestFitnessInTournament = competitorFitness;
                        bestInTournament = competitor;
                    }
                }
            }
            if (bestInTournament) {
                parents.push([...bestInTournament]);
            } else if (this.population.length > 0) { 
                parents.push([...this.population[Math.floor(Math.random() * this.population.length)]]);
            }
        }
        while (parents.length < this.populationSize && this.population.length > 0) {
             parents.push([...this.population[Math.floor(Math.random() * this.population.length)]]);
        }
        return parents; 
    }

    //crossover between 2 parents to make 2 childern
    crossover(parent1, parent2) {
        const child1 = [...parent1];
        const child2 = [...parent2];
        if (this.boardSize <= 1) return [child1, child2];
        const point = Math.floor(Math.random() * (this.boardSize - 1)) + 1; 
        for (let i = point; i < this.boardSize; i++) {
            const temp = child1[i];
            child1[i] = child2[i];
            child2[i] = temp;
        }
        return [child1, child2];
    }

    //mutation function
    mutation(individual, mutationRate = 0.15) { 
        if (Math.random() < mutationRate) {
            if (this.boardSize > 0) {
                const rowIndex = Math.floor(Math.random() * this.boardSize);
                const newColumnValue = Math.floor(Math.random() * this.boardSize);
                individual[rowIndex] = newColumnValue;
            }
        }
        return individual;
    }

    // running genetic algorithm
    async runEvolution(maxGenerations = 200, targetFitness = 0, onGenerationCallback = null) {
        this.initializePopulation();
        this.generationCount = 0;

        if (onGenerationCallback) {
            onGenerationCallback(
                this.generationCount,
                this.population.map(ind => [...ind]),
                [...this.fitnessScores],
                this.bestSolutionOverall ? [...this.bestSolutionOverall] : null,
                this.bestFitnessOverall
            );
        }
        if (this.bestFitnessOverall === targetFitness) {
            console.log(`Genetic Algorithm: Initial population contains a solution with fitness ${this.bestFitnessOverall}`);
            return this.bestSolutionOverall;
        }


        for (let gen = 1; gen <= maxGenerations; gen++) {
            if (this.main && this.main.stopProcess) {
                console.log("Genetic Algorithm evolution stopped by user.");
                return this.bestSolutionOverall; 
            }
            this.generationCount = gen;
            
            //creating new generation
            let selectedParents = this.selection();
            let newPopulation = [];
            for (let i = 0; i < this.populationSize; i += 2) {
                 if (i + 1 >= selectedParents.length) {
                    if(selectedParents[i]) newPopulation.push(this.mutation([...selectedParents[i]]));
                    break;
                }
                let parent1 = selectedParents[i];
                let parent2 = selectedParents[i+1];
                if (!parent1 || !parent2) continue;
                let children = this.crossover(parent1, parent2);
                newPopulation.push(this.mutation([...children[0]]));
                if (newPopulation.length < this.populationSize) {
                    newPopulation.push(this.mutation([...children[1]]));
                }
            }
            while (newPopulation.length < this.populationSize && this.population.length > 0) {
                 newPopulation.push([...this.population[Math.floor(Math.random() * this.population.length)]]);
            }
            this.population = newPopulation;

            this.fitnessScores = this.population.map(ind => this.calculateFitness(ind));
            for (let i = 0; i < this.populationSize; i++) {
                if (this.fitnessScores[i] < this.bestFitnessOverall) {
                    this.bestFitnessOverall = this.fitnessScores[i];
                    this.bestSolutionOverall = [...this.population[i]];
                }
            }
            
            if (onGenerationCallback) {
                onGenerationCallback(
                    gen,
                    this.population.map(ind => [...ind]), // Sending population individuals
                    [...this.fitnessScores],
                    this.bestSolutionOverall ? [...this.bestSolutionOverall] : null,
                    this.bestFitnessOverall
                );
            }

            //checking for solution
            if (this.bestFitnessOverall === targetFitness) {
                console.log(`Genetic Algorithm: Solution found in generation ${gen} with fitness ${this.bestFitnessOverall}`);
                return this.bestSolutionOverall;
            }

            if (this.main) { 
                await this.main.sleep(10);
            }
        }

        console.log(`Genetic Algorithm: Finished ${maxGenerations} generations. Best fitness found: ${this.bestFitnessOverall}`);
        return this.bestSolutionOverall;
    }

    //returing the best solution
    getBestSolution1D() {
        return this.bestSolutionOverall;
    }
}