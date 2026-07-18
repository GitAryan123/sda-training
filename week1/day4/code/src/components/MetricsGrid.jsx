import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { MetricsCard } from './MetricsCard';

export function MetricsGrid({ data }) {
  const usersSum = useMemo(() => {
    if (!data.users?.values || data.users.values.length === 0) return 0;
    return data.users.values.reduce((a, b) => a + b, 0);
  }, [data.users]);

  const revenueSum = useMemo(() => {
    if (!data.revenue?.values || data.revenue.values.length === 0) return 0;
    return data.revenue.values.reduce((a, b) => a + b, 0);
  }, [data.revenue]);

  const ordersSum = useMemo(() => {
    if (!data.orders?.values || data.orders.values.length === 0) return 0;
    return data.orders.values.reduce((a, b) => a + b, 0);
  }, [data.orders]);

  return (
    <div className="metrics-grid-container">
      <MetricsCard
        title="Total Registrations"
        value={usersSum}
        change={12.4}
        trend="Growing consistently"
        icon="👤"
      />
      <MetricsCard
        title="Revenue Analytics"
        value={`$${revenueSum.toLocaleString()}`}
        change={8.2}
        trend="Peak sales on Friday"
        icon="💵"
      />
      <MetricsCard
        title="Total Orders"
        value={ordersSum}
        change={-1.5}
        trend="Completed order peak"
        icon="🛒"
      />
    </div>
  );
}

MetricsGrid.propTypes = {
  data: PropTypes.shape({
    users: PropTypes.object,
    revenue: PropTypes.object,
    orders: PropTypes.object
  }).isRequired
};
