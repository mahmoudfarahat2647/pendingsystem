import type { GridApi } from "ag-grid-community";
import { useEffect, useRef } from "react";

interface PerformanceMetrics {
	gridReadyTime: number;
	firstDataRenderedTime: number;
	totalRowCount: number;
	visibleRowCount: number;
}

export function useGridPerformance(gridApi: GridApi | null) {
	const metricsRef = useRef<PerformanceMetrics>({
		gridReadyTime: 0,
		firstDataRenderedTime: 0,
		totalRowCount: 0,
		visibleRowCount: 0,
	});
	const startTimeRef = useRef<number>(performance.now());

	useEffect(() => {
		if (!gridApi) return;

		const updateMetrics = () => {
			metricsRef.current = {
				...metricsRef.current,
				totalRowCount: gridApi.getDisplayedRowCount(),
				visibleRowCount: gridApi.getRenderedNodes().length,
			};

			// Log metrics in development
			if (process.env.NODE_ENV === "development") {
				// console.table(metricsRef.current); // Uncomment to debug performance
			}
		};

		gridApi.addEventListener("modelUpdated", updateMetrics);

		return () => {
			gridApi.removeEventListener("modelUpdated", updateMetrics);
		};
	}, [gridApi]);

	const markGridReady = () => {
		const duration = performance.now() - startTimeRef.current;
		metricsRef.current.gridReadyTime = duration;
	};

	const markFirstDataRendered = () => {
		const duration = performance.now() - startTimeRef.current;
		metricsRef.current.firstDataRenderedTime = duration;
	};

	return {
		metrics: metricsRef.current,
		markGridReady,
		markFirstDataRendered,
	};
}
