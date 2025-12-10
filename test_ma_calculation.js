// Test script to verify MA calculation
// Run this in Node.js or browser console with mathjs

const { create, all } = require('mathjs');
const math = create(all);

// Custom functions
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

math.import({ toRadians }, { override: true });

// Input values from screenshot
const inputs = {
    a: 4,
    b: 0.8,
    c: 1,
    q1: 5.1,
    M2: 35,  // This is AN INPUT, not output!
    F3: 14.54038,
    alfa: 51,
    x1: 3.6,
    x2: 5.2
};

// MA Formula (as provided by user)
const MA_formula = "(q1*a)*(a/2)+M2-(sin(toRadians(alfa))*F3)*(a+b+c)";

console.log("Calculating MA:");
console.log("Formula:", MA_formula);
console.log("Inputs:", inputs);

const MA_result = math.evaluate(MA_formula, inputs);
console.log("Result:", MA_result);

// Expected from Excel: 10.26
// Step by step:
console.log("\nStep-by-step:");
console.log("q1*a =", inputs.q1 * inputs.a);
console.log("a/2 =", inputs.a / 2);
console.log("(q1*a)*(a/2) =", (inputs.q1 * inputs.a) * (inputs.a / 2));
console.log("toRadians(alfa) =", toRadians(inputs.alfa));
console.log("sin(toRadians(alfa)) =", Math.sin(toRadians(inputs.alfa)));
console.log("sin(toRadians(alfa))*F3 =", Math.sin(toRadians(inputs.alfa)) * inputs.F3);
console.log("a+b+c =", inputs.a + inputs.b + inputs.c);
console.log("(sin(toRadians(alfa))*F3)*(a+b+c) =", Math.sin(toRadians(inputs.alfa)) * inputs.F3 * (inputs.a + inputs.b + inputs.c));
console.log("Final: (q1*a)*(a/2) + M2 - (sin*F3)*(a+b+c) =",
    (inputs.q1 * inputs.a) * (inputs.a / 2) + inputs.M2 - (Math.sin(toRadians(inputs.alfa)) * inputs.F3 * (inputs.a + inputs.b + inputs.c)));

