// Type definitions for Mecha Oldal

export interface Customer {
    id: string;
    customer_name: string;
    created_at: string;
    has_calculated: boolean;
}

export interface UserInputData {
    id: string;
    customer_id: string;
    task_inputs: Record<string, Record<string, number>>;
    results?: Record<string, Record<string, number>>;
    updated_at: string;
}

export interface TaskVariable {
    name: string;
    label: string;
    unit?: string;
}

export interface TaskEquation {
    outputVariable: string;
    formula: string;
}

export interface TaskConfig {
    id: string;
    name: string;
    hint?: string; // Optional hint text shown on calculate page
    inputVariables: TaskVariable[];
    outputVariables: TaskVariable[];
    equations: TaskEquation[];
    showingText: string;
    outputPlaceholders: { variable: string; position: number }[];
    images: string[];
}

export interface ConfigData {
    tasks: TaskConfig[];
    lastUpdated: string;
}

export interface CalculationResult {
    taskId: string;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
}
