import { create, all } from 'mathjs';
import type { TaskConfig, CalculationResult } from '@/types';

const math = create(all);

/**
 * Hungarian Excel function names mapped to mathjs equivalents
 */
const EXCEL_FUNCTIONS: Record<string, string> = {
    // Math functions - Hungarian
    'GYÖK': 'sqrt',
    'GYOK': 'sqrt',
    'HATVÁNY': 'pow',
    'HATVANY': 'pow',
    'ABS': 'abs',
    'KEREKÍTÉS': 'round',
    'KEREKITES': 'round',
    'KEREK': 'round',
    'EGÉSZ': 'floor',
    'EGESZ': 'floor',
    'PLAFON': 'ceil',
    'MIN': 'min',
    'MAX': 'max',
    'ÖSSZEG': 'sum',
    'OSSZEG': 'sum',
    'ÁTLAG': 'mean',
    'ATLAG': 'mean',
    'LOG': 'log10',
    'LN': 'log',
    'EXP': 'exp',
    'MOD': 'mod',

    // Trigonometric functions - Hungarian
    'SIN': 'sin',
    'COS': 'cos',
    'TAN': 'tan',
    'SZIN': 'sin',     // Alternative Hungarian
    'KOSZ': 'cos',     // Alternative Hungarian
    'ASIN': 'asin',
    'ACOS': 'acos',
    'ATAN': 'atan',
    'ATAN2': 'atan2',
    'SINH': 'sinh',
    'COSH': 'cosh',
    'TANH': 'tanh',

    // Angle conversion - Hungarian
    'RADIÁN': 'toRadians',
    'RADIAN': 'toRadians',
    'FOK': 'toDegrees',
    'DEGREES': 'toDegrees',

    // Constants
    'PI': 'PI_VALUE',  // Special handling

    // Logical - Hungarian
    'HA': 'excelIf',   // Special IF handling
    'IF': 'excelIf',
    'ÉS': 'and',
    'ES': 'and',
    'AND': 'and',
    'VAGY': 'or',
    'OR': 'or',
    'NEM': 'not',
    'NOT': 'not',

    // Comparison helpers
    'IGAZ': 'true',
    'HAMIS': 'false',
    'TRUE': 'true',
    'FALSE': 'false',
};

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 */
function toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
}

/**
 * Excel-style IF function
 * HA(condition; trueValue; falseValue)
 */
function excelIf(condition: boolean, trueValue: number, falseValue: number): number {
    return condition ? trueValue : falseValue;
}

// Register custom functions in mathjs
math.import({
    toRadians,
    toDegrees,
    excelIf,
    PI_VALUE: Math.PI,
}, { override: true });

/**
 * Converts an Excel formula to mathjs-compatible syntax
 * 
 * Examples:
 *   =GYÖK(B3*1000/B5) → sqrt(B3*1000/B5)
 *   =HA(E20<B23;B19+B20;B19) → excelIf(E20<B23, B19+B20, B19)
 *   =B12^2*PI()/4 → B12^2*PI_VALUE/4
 *   =RADIÁN(45) → toRadians(45)
 *   =HA(x=5;0,5;1) → excelIf(x==5, 0.5, 1)  // with European decimal notation
 */
export function parseExcelFormula(formula: string): string {
    let result = formula.trim();

    // Remove leading = if present
    if (result.startsWith('=')) {
        result = result.substring(1);
    }

    // Step 1: Convert European decimal notation (e.g., 0,5 → 0.5)
    // Match pattern: digit followed by comma followed by digit (decimal separator)
    // This must be done BEFORE replacing semicolons with commas
    result = result.replace(/(\d),(\d)/g, '$1.$2');

    // Step 2: Replace semicolons with commas (Excel uses ; as argument separator in some locales)
    result = result.replace(/;/g, ',');

    // Step 3: Replace PI() with PI_VALUE
    result = result.replace(/PI\(\)/gi, 'PI_VALUE');

    // Step 4: Replace Hungarian/Excel functions with mathjs equivalents
    for (const [excelFunc, mathjsFunc] of Object.entries(EXCEL_FUNCTIONS)) {
        // Match function calls (word followed by parenthesis)
        const regex = new RegExp(`\\b${excelFunc}\\s*\\(`, 'gi');
        result = result.replace(regex, `${mathjsFunc}(`);
    }

    // Step 5: Handle <> (not equal) → !=
    result = result.replace(/<>/g, '!=');

    // Step 6: Handle Excel = operator for equality in comparisons
    // Replace single = with == but avoid replacing operators like <=, >=, !=, ==
    // Look for patterns like: )=( or variable=value or number=number
    // The pattern matches when = is preceded by: letter, digit, underscore, ), or ]
    // and followed by: letter, digit, underscore, (, or [
    result = result.replace(/([a-zA-Z0-9_)\]])=([a-zA-Z0-9_(])/g, '$1==$2');

    return result;
}

/**
 * Maps variable names from the formula to actual input values
 * Variables can be simple names like: delta_l, sigma_x, F, E
 */
export function calculateTask(
    taskConfig: TaskConfig,
    inputs: Record<string, number>
): Record<string, number> {
    const outputs: Record<string, number> = {};

    for (const equation of taskConfig.equations) {
        try {
            // Parse the Excel formula to mathjs syntax
            const mathjsFormula = parseExcelFormula(equation.formula);

            // Create scope with all input values
            const scope: Record<string, number | typeof Math.PI> = {
                ...inputs,
                PI_VALUE: Math.PI,
                pi: Math.PI,
            };

            // Add previously calculated outputs to scope (for chained calculations)
            Object.assign(scope, outputs);

            // Evaluate the formula
            const result = math.evaluate(mathjsFormula, scope);

            outputs[equation.outputVariable] = (result !== null && typeof result === 'number')
                ? Number(result.toFixed(6))
                : (result ?? NaN);
        } catch (error) {
            console.error(`Error calculating ${equation.outputVariable} with formula "${equation.formula}":`, error);
            outputs[equation.outputVariable] = NaN;
        }
    }

    return outputs;
}

export function calculateAllTasks(
    tasks: TaskConfig[],
    allInputs: Record<string, Record<string, number>>
): CalculationResult[] {
    return tasks.map((task) => {
        const inputs = allInputs[task.id] || {};
        const outputs = calculateTask(task, inputs);
        return {
            taskId: task.id,
            inputs,
            outputs,
        };
    });
}

export function formatResult(value: number | null | undefined, precision: number = 4): string {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toFixed(precision);
}

/**
 * Test function to verify Excel formula parsing
 */
export function testExcelFormulas(): void {
    const testCases = [
        { excel: '=B4*(B2*1000/B5)', expected: 'B4*(B2*1000/B5)' },
        { excel: '=GYÖK(B3*1000/B5)', expected: 'sqrt(B3*1000/B5)' },
        { excel: '=B12^2*PI()/4', expected: 'B12^2*PI_VALUE/4' },
        { excel: '=HA(E20<B23;B19+B20;B19)', expected: 'excelIf(E20<B23,B19+B20,B19)' },
        { excel: '=RADIÁN(45)', expected: 'toRadians(45)' },
        { excel: '=SIN(RADIÁN(45))', expected: 'sin(toRadians(45))' },
        { excel: '=HATVÁNY(2;3)', expected: 'pow(2,3)' },
        // European decimal notation
        { excel: '=0,5*x1', expected: '0.5*x1' },
        { excel: '=HA(x>0;0,5;1,5)', expected: 'excelIf(x>0,0.5,1.5)' },
        // Nested HA with equality
        { excel: '=HA(x2=(a+b);value1;value2)', expected: 'excelIf(x2==(a+b),value1,value2)' },
        { excel: '=HA((SIN(RADIÁN(alfa))*F1)<F2;a+b;a)', expected: 'excelIf((sin(toRadians(alfa))*F1)<F2,a+b,a)' },
        // Complex nested HA
        { excel: '=HA((HA(x<5;a;b))=(a);result1;result2)', expected: 'excelIf((excelIf(x<5,a,b))==(a),result1,result2)' },
    ];

    console.log('=== Testing Excel Formula Parsing ===');
    for (const test of testCases) {
        const result = parseExcelFormula(test.excel);
        const passed = result === test.expected;
        console.log(`${passed ? '✅' : '❌'} ${test.excel}`);
        console.log(`   Result:   ${result}`);
        if (!passed) {
            console.log(`   Expected: ${test.expected}`);
        }
    }
}

