/**
 * Calculator Engine for Mecha Oldal
 * Evaluates equations with variable substitution
 */

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180)
}

// Safe math functions that work with degrees
const mathFunctions = {
    sin: (x) => Math.sin(toRadians(x)),
    cos: (x) => Math.cos(toRadians(x)),
    tan: (x) => Math.tan(toRadians(x)),
    asin: (x) => (Math.asin(x) * 180) / Math.PI,
    acos: (x) => (Math.acos(x) * 180) / Math.PI,
    atan: (x) => (Math.atan(x) * 180) / Math.PI,
    sqrt: Math.sqrt,
    abs: Math.abs,
    pow: Math.pow,
    exp: Math.exp,
    log: Math.log,
    log10: Math.log10,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    min: Math.min,
    max: Math.max,
    PI: Math.PI
}

/**
 * Parse and evaluate a mathematical expression
 * @param {string} expression - The equation to evaluate (e.g., "a + b * sin(alpha)")
 * @param {Object} variables - Object with variable values (e.g., { a: 5, b: 3, alpha: 45 })
 * @returns {number} The calculated result
 */
export function evaluateExpression(expression, variables = {}) {
    try {
        // Create a safe context with math functions and variables
        let safeExpression = expression

        // Replace variable names with their values
        // Sort by length descending to avoid partial replacements (e.g., 'a' replacing 'alpha')
        const sortedVarNames = Object.keys(variables).sort((a, b) => b.length - a.length)

        for (const varName of sortedVarNames) {
            const value = parseFloat(variables[varName])
            if (isNaN(value)) {
                throw new Error(`Invalid value for variable: ${varName}`)
            }
            // Use word boundaries to avoid partial replacements
            const regex = new RegExp(`\\b${varName}\\b`, 'g')
            safeExpression = safeExpression.replace(regex, `(${value})`)
        }

        // Replace math function names with our safe versions
        for (const funcName of Object.keys(mathFunctions)) {
            const regex = new RegExp(`\\b${funcName}\\b`, 'g')
            safeExpression = safeExpression.replace(regex, `__math__.${funcName}`)
        }

        // Create a sandboxed function to evaluate
        const func = new Function('__math__', `return ${safeExpression}`)
        const result = func(mathFunctions)

        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            throw new Error('Calculation resulted in invalid number')
        }

        return result
    } catch (err) {
        console.error('Calculation error:', err.message)
        throw new Error(`Failed to calculate: ${err.message}`)
    }
}

/**
 * Round a number to specified decimal places
 * @param {number} value - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number
 */
export function roundTo(value, decimals = 2) {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}

/**
 * Calculate all outputs for a task configuration
 * @param {Object} config - Task configuration with inputs and outputs
 * @param {Object} inputValues - User-provided input values
 * @returns {Object} Calculated results for each output
 */
export function calculateTask(config, inputValues) {
    const results = {}

    if (!config.outputs || !Array.isArray(config.outputs)) {
        return results
    }

    for (const output of config.outputs) {
        try {
            if (output.equation) {
                const value = evaluateExpression(output.equation, inputValues)
                results[output.name] = roundTo(value, output.decimals || 2)
            }
        } catch (err) {
            console.error(`Error calculating ${output.name}:`, err.message)
            results[output.name] = 'Error'
        }
    }

    return results
}

/**
 * Validate that all required inputs have values
 * @param {Array} requiredInputs - Array of input configuration objects
 * @param {Object} inputValues - User-provided values
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateInputs(requiredInputs, inputValues) {
    const missing = []

    for (const input of requiredInputs) {
        const value = inputValues[input.name]
        if (value === undefined || value === null || value === '') {
            missing.push(input.label || input.name)
        } else if (isNaN(parseFloat(value))) {
            missing.push(`${input.label || input.name} (invalid number)`)
        }
    }

    return {
        valid: missing.length === 0,
        missing
    }
}
