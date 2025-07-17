import React from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import { ProgressChart as RNProgressChart } from 'react-native-chart-kit';

interface ProgressChartProps {
  data: {
    labels: string[];
    data: number[];
  };
  title?: string;
  backgroundColor?: string;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  colors?: string[];
  strokeWidth?: number;
  radius?: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  title,
  backgroundColor = '#ffffff',
  backgroundGradientFrom = '#ffffff',
  backgroundGradientTo = '#ffffff',
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA07A'],
  strokeWidth = 16,
  radius = 32,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40; // Account for padding

  const chartConfig = {
    backgroundColor,
    backgroundGradientFrom,
    backgroundGradientTo,
    decimalPlaces: 1,
    color: (opacity = 1, index = 0) => colors[index % colors.length] || `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  if (!data.data || data.data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Ensure all values are between 0 and 1
  const normalizedData = {
    ...data,
    data: data.data.map(value => Math.min(Math.max(value, 0), 1)),
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNProgressChart
        data={normalizedData}
        width={chartWidth}
        height={220}
        strokeWidth={strokeWidth}
        radius={radius}
        chartConfig={chartConfig}
        hideLegend={false}
        style={styles.chart}
      />
      <View style={styles.legendContainer}>
        {data.labels.map((label, index) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: colors[index % colors.length] }
              ]} 
            />
            <Text style={styles.legendText}>{label}</Text>
            <Text style={styles.legendValue}>
              {Math.round((data.data[index] || 0) * 100)}%
            </Text>
          </View>
        ))}
      </View>
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
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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

export default ProgressChart;