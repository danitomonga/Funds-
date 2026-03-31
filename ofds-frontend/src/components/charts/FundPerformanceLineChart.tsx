import { Line } from "react-chartjs-2";
import { baseChartOptions, getFundColor } from "@/lib/chartConfig";
import type { ChartData, ChartOptions } from "chart.js";

interface FundPerformanceData {
  labels: string[];
  funds: { name: string; data: number[] }[];
}

interface Props {
  data: FundPerformanceData;
  height?: number;
}

export function FundPerformanceLineChart({ data, height = 280 }: Props) {
  const chartData: ChartData<"line"> = {
    labels: data.labels,
    datasets: data.funds.map((fund) => ({
      label: fund.name,
      data: fund.data,
      borderColor: getFundColor(fund.name),
      backgroundColor: getFundColor(fund.name) + "14",
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: getFundColor(fund.name),
      borderWidth: 2,
    })),
  };

  const options: ChartOptions<"line"> = {
    ...baseChartOptions,
    scales: {
      ...baseChartOptions.scales,
      y: {
        ...baseChartOptions.scales?.y,
        ticks: {
          ...((baseChartOptions.scales?.y as Record<string, unknown>)?.ticks as object),
          callback: (v) => v + "%",
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
