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
            outputs[equation.outputVariable] = typeof result === 'number'
                ? Number(result.toFixed(6))
                : result;
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

export function formatResult(value: number, precision: number = 4): string {
    if (isNaN(value)) return 'N/A';
    return value.toFixed(precision);
}
