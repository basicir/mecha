import { create, all } from 'mathjs';

// Create a mathjs instance with all functions
const math = create(all);

/**
 * Calculate results based on input values and task equations
 * @param {Object} inputs - Key-value pairs of input values
 * @param {Object} equations - Key-value pairs where key is result name and value is equation
 * @returns {Object} - Calculated results
 */
export function calculateResults(inputs, equations) {
    const results = {};

    // Create a scope with all input values
    const scope = { ...inputs };

    // Calculate each result using mathjs
    for (const [resultKey, equation] of Object.entries(equations)) {
        try {
            const result = math.evaluate(equation, scope);
            // Round to 2 decimal places
            results[resultKey] = Math.round(result * 100) / 100;
        } catch (error) {
            console.error(`Error calculating ${resultKey}:`, error);
            results[resultKey] = null;
        }
    }

    return results;
}

/**
 * Validate that all required inputs have values
 * @param {Object} inputs - Input values
 * @param {Array} requiredInputs - Array of required input IDs
 * @returns {boolean}
 */
export function validateInputs(inputs, requiredInputs) {
    return requiredInputs.every(inputId => {
        const value = inputs[inputId];
        return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
    });
}
