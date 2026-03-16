// Type definitions to suppress recharts compatibility issues with React 18
// This file helps TypeScript understand that recharts components are valid JSX elements

declare module 'recharts' {
    import { ComponentType } from 'react'

    // Re-export all types from recharts but mark components as valid JSX
    export * from 'recharts/types'

    // Explicitly declare components as React components
    export const XAxis: ComponentType<any>
    export const YAxis: ComponentType<any>
    export const Tooltip: ComponentType<any>
    export const Legend: ComponentType<any>
    export const Bar: ComponentType<any>
    export const Line: ComponentType<any>
    export const Pie: ComponentType<any>
    export const Cell: ComponentType<any>
    export const CartesianGrid: ComponentType<any>
    export const ResponsiveContainer: ComponentType<any>
    export const BarChart: ComponentType<any>
    export const LineChart: ComponentType<any>
    export const PieChart: ComponentType<any>
}
