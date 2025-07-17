import React from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }[];
  };
  title?: string;
  yAxisSuffix?: string;
  showGrid?: boolean;
  backgroundColor?: string;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  color?: (opacity: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  yAxisSuffix = '',
  showGrid = true,
  backgroundColor = '#ffffff',
  backgroundGradientFrom = '#ffffff',
  backgroundGradientTo = '#ffffff',
  color = (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40; // Account for padding

  const chartConfig = {
    backgroundColor,
    backgroundGradientFrom,
    backgroundGradientTo,
    decimalPlaces: 1,
    color,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color(1),
    },
    fillShadowGradient: color(0.1),
    fillShadowGradientOpacity: 0.1,
  };

  if (!data.datasets || data.datasets.length === 0 || !data.datasets[0].data.length) {
    return (
      <View style={styles.emptyContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNLineChart
        data={data}
        width={chartWidth}
        height={220}
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={showGrid}
        withOuterLines={showGrid}
        withVerticalLines={showGrid}
        withHorizontalLines={showGrid}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default LineChart;