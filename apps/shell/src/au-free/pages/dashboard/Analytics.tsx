"use client";

import { Container, Stack, Typography, Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  analyticKPIs,
  userByCountryData,
  userEngagementChartData,
} from 'data/dashboard';
import AnalyticKPI from 'components/sections/dashboards/analytics/kpi/AnalyticKPI';
import UserByCountry from 'components/sections/dashboards/analytics/user-by-country/UserByCountry';
import UserEngagement from 'components/sections/dashboards/analytics/user-engagement/UserEngagement';

const Analytics = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ mb: 1, color: 'text.primary' }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Real-time analytics and performance metrics for the MOA Portal.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 5 }} container spacing={2}>
          {analyticKPIs.map((kpi) => (
            <Grid key={kpi.title} size={{ xs: 12, sm: 6 }}>
              <AnalyticKPI kpi={kpi} />
            </Grid>
          ))}
        </Grid>

        <Grid size={{ xs: 12, xl: 7 }}>
          <UserEngagement data={userEngagementChartData} />
        </Grid>

        <Grid size={12}>
          <UserByCountry data={userByCountryData} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
