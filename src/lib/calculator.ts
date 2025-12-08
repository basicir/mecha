import { create, all } from 'mathjs';
import type { TaskConfig, CalculationResult } from '@/types';

const math = create(all);

export function calculateTask(
    taskConfig: TaskConfig,
    inputs: Record<string, number>
): Record<string, number> {
    const outputs: Record<string, number> = {};

    for (const equation of taskConfig.equations) {
        try {
            // Parse and evaluate the equation with input values as scope
            const result = math.evaluate(equation.formula, inputs);
            outputs[equation.outputVariable] = (result !== null && typeof result === 'number')
                ? Number(result.toFixed(6))
                : (result ?? NaN);
        } catch (error) {
            console.error(`Error calculating ${equation.outputVariable}:`, error);
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
