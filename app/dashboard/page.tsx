"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { withAuth } from "@/lib/hocs/withAuth";

// Material UI Components
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
  LinearProgress,
  useTheme,
  Skeleton,
} from "@mui/material";

// Material UI Icons
import {
  TrendingUp,
  ConfirmationNumber,
  CheckCircle,
  Event,
  AttachMoney,
  BarChart as BarChartIcon,
  Refresh,
  ShowChart,
} from "@mui/icons-material";

// Recharts for charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * Interfaces
 */
interface Analytics {
  totalEvents: number;
  totalTickets: number;
  validTickets: number;
  checkedInTickets: number;
  revokedTickets: number;
  totalRevenue: number;
  eventAnalytics: Array<{
    name: string;
    ticketCount: number;
    checkedIn: number;
    revenue?: number;
  }>;
}

type TimeRange = "7d" | "30d" | "90d" | "1y";

/**
 * Constants
 */
const COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6"];

/**
 * Components
 */

// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  growth?: number;
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  growth,
  subtitle,
  loading = false,
}) => (
  <Card
    elevation={2}
    sx={{
      borderRadius: 2,
      transition: "all 0.3s ease",
      flex: "1 1 250px",
      minWidth: "250px",
      "&:hover": {
        boxShadow: 4,
        transform: "translateY(-2px)",
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: "medium" }}>
            {title}
          </Typography>
          
          {loading ? (
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
          ) : (
            <>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold", mb: growth ? 1 : 0 }}>
                {value}
              </Typography>
              {growth && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="body2" sx={{ color: "success.main", fontWeight: "medium" }}>
                    +{growth}%
                  </Typography>
                  {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                      {subtitle}
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
        
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {loading ? (
            <Skeleton variant="circular" width={28} height={28} />
          ) : (
            <Icon sx={{ fontSize: 28 }} />
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// DashboardHeader Component
interface DashboardHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
  adminName?: string;
  loading?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  adminName,
  loading = false,
}) => (
  <Box sx={{ mb: 6 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
      <Box>
        {loading ? (
          <>
            <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={400} height={24} />
          </>
        ) : (
          <>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time analytics and performance metrics
              {adminName && ` • Welcome back, ${adminName}`}
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {loading ? (
          <>
            <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="circular" width={40} height={40} />
          </>
        ) : (
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={onRefresh}
              sx={{
                backgroundColor: "white",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { backgroundColor: "grey.50" },
              }}
            >
              <Refresh />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  </Box>
);

// EventPerformanceChart Component
interface EventPerformanceChartProps {
  data: Array<{
    name: string;
    total: number;
    checkedIn: number;
    revenue: number;
    color: string;
  }>;
  loading?: boolean;
}

const EventPerformanceChart: React.FC<EventPerformanceChartProps> = ({ data, loading = false }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Event Performance
          </Typography>
          <ShowChart sx={{ color: "text.secondary" }} />
        </Box>

        {data.length > 0 ? (
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="name"
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    boxShadow: theme.shadows[3],
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  fill={theme.palette.primary.main}
                  radius={[4, 4, 0, 0]}
                  name="Total Tickets"
                />
                <Bar
                  dataKey="checkedIn"
                  fill={theme.palette.success.main}
                  radius={[4, 4, 0, 0]}
                  name="Checked In"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ textAlign: "center" }}>
              <BarChartIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="body1" color="text.secondary" fontWeight="medium">
                No event data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create events to see performance metrics
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// CheckInProgress Component
interface CheckInProgressProps {
  checkedInTickets: number;
  totalTickets: number;
  loading?: boolean;
}

const CheckInProgress: React.FC<CheckInProgressProps> = ({ checkedInTickets, totalTickets, loading = false }) => {
  const checkInRate = totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0;

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2, flex: "1 1 400px", minWidth: "300px" }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4, mb: 3 }} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 2, flex: "1 1 400px", minWidth: "300px" }}>
      <CardContent>
        <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
          Check-in Progress
        </Typography>

        <Box sx={{ spaceY: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Check-in Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {checkInRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={checkInRate}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "grey.200",
                "& .MuiLinearProgress-bar": { backgroundColor: "success.main" },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                textAlign: "center",
                backgroundColor: "primary.light",
                color: "primary.contrastText",
                borderRadius: 2,
                flex: "1 1 120px",
                minWidth: "120px",
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {checkedInTickets}
              </Typography>
              <Typography variant="caption">Checked In</Typography>
            </Paper>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                textAlign: "center",
                backgroundColor: "grey.100",
                borderRadius: 2,
                flex: "1 1 120px",
                minWidth: "120px",
              }}
            >
              <Typography variant="h5" fontWeight="bold" color="text.secondary">
                {totalTickets - checkedInTickets}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>
            </Paper>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// RevenueOverview Component
interface RevenueOverviewProps {
  totalRevenue: number;
  totalEvents: number;
  growth: number;
  loading?: boolean;
}

const RevenueOverview: React.FC<RevenueOverviewProps> = ({ totalRevenue, totalEvents, growth, loading = false }) => {
  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2, flex: "1 1 400px", minWidth: "300px" }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="text" width={80} height={24} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 2, flex: "1 1 400px", minWidth: "300px" }}>
      <CardContent>
        <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
          Revenue Overview
        </Typography>

        <Box sx={{ spaceY: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              ${totalRevenue.toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Average per Event
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              ${totalEvents > 0 ? (totalRevenue / totalEvents).toFixed(2) : "0.00"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Growth
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              +{growth}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// LoadingSkeleton Component
const LoadingSkeleton: React.FC = () => (
  <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", py: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
    <Container maxWidth="xl">
      <DashboardHeader
        timeRange="30d"
        onTimeRangeChange={() => {}}
        onRefresh={() => {}}
        loading={true}
      />
      
      {/* Stats Cards Skeleton */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 6, justifyContent: { xs: "center", sm: "flex-start" } }}>
        {[1, 2, 3, 4].map((i) => (
          <StatCard
            key={i}
            title="Loading"
            value={0}
            icon={Event}
            color="#ccc"
            loading={true}
          />
        ))}
      </Box>

      {/* Charts Section Skeleton */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <EventPerformanceChart data={[]} loading={true} />
        
        {/* Bottom Cards Skeleton - FlexBox Layout */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <CheckInProgress checkedInTickets={0} totalTickets={0} loading={true} />
          <RevenueOverview totalRevenue={0} totalEvents={0} growth={0} loading={true} />
        </Box>
      </Box>
    </Container>
  </Box>
);

// ErrorState Component
interface ErrorStateProps {
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => (
  <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", py: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
    <Container maxWidth="xl">
      <Box sx={{ textAlign: "center", py: 20 }}>
        <BarChartIcon sx={{ fontSize: 64, color: "grey.400", mb: 3 }} />
        <Typography variant="h5" color="text.secondary" fontWeight="medium" gutterBottom>
          Failed to load analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Please try refreshing the page
        </Typography>
        <IconButton
          onClick={onRetry}
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            "&:hover": { backgroundColor: "primary.dark" },
            px: 4,
            py: 1.5,
          }}
        >
          <Refresh sx={{ mr: 1 }} />
          Retry
        </IconButton>
      </Box>
    </Container>
  </Box>
);

/**
 * Main Dashboard Component
 */
function DashboardPage() {
  const { admin } = useAuthStore();
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Mock growth data
  const revenueGrowth = 12.5;
  const ticketGrowth = 8.2;
  const eventGrowth = 5.2;
  const checkInGrowth = 2.1;

  /**
   * Fetch dashboard analytics from API
   */
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/events/analytics`);
      if (response.data) {
        setAnalytics(response.data);
        toast.success("Dashboard data updated");
      }
    } catch (error: unknown) {
      console.error("Failed to fetch analytics:", error);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status !== 401) {
          toast.error(axiosError.response?.data?.error || "Failed to load dashboard data");
        }
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Prepare chart data from analytics
   */
  const chartData = analytics?.eventAnalytics.map((event: { name: string; ticketCount: number; checkedIn: number; revenue?: number }, index: number) => ({
    name: event.name.length > 12 ? event.name.substring(0, 10) + "..." : event.name,
    total: event.ticketCount,
    checkedIn: event.checkedIn,
    revenue: event.revenue || 0,
    color: COLORS[index % COLORS.length],
  })) || [];

  // Calculate check-in rate
  const checkInRate = analytics && analytics.totalTickets > 0 
    ? Math.round((analytics.checkedInTickets / analytics.totalTickets) * 100) 
    : 0;

  // Render loading state
  if (isLoading && !analytics) {
    return <LoadingSkeleton />;
  }

  // Render error state
  if (!analytics && !isLoading) {
    return <ErrorState onRetry={fetchAnalytics} />;
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", py: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Container maxWidth="xl">
        <DashboardHeader
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={fetchAnalytics}
          adminName={admin?.fullName}
        />

        {/* Stats Cards */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 6, justifyContent: { xs: "center", sm: "flex-start" } }}>
          <StatCard
            title="Total Events"
            value={analytics!.totalEvents}
            icon={Event}
            color={theme.palette.primary.main}
            growth={eventGrowth}
            subtitle="vs last period"
          />
          <StatCard
            title="Total Tickets"
            value={analytics!.totalTickets.toLocaleString()}
            icon={ConfirmationNumber}
            color={theme.palette.secondary.main}
            growth={ticketGrowth}
            subtitle="vs last period"
          />
          <StatCard
            title="Check-in Rate"
            value={`${checkInRate}%`}
            icon={CheckCircle}
            color={theme.palette.success.main}
            growth={checkInGrowth}
            subtitle="improvement"
          />
          <StatCard
            title="Total Revenue"
            value={`$${analytics!.totalRevenue.toLocaleString()}`}
            icon={AttachMoney}
            color={theme.palette.info.main}
            growth={revenueGrowth}
            subtitle="vs last period"
          />
        </Box>

        {/* Charts Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <EventPerformanceChart data={chartData} />
          
          {/* Bottom Cards - FlexBox Layout */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <CheckInProgress 
              checkedInTickets={analytics!.checkedInTickets} 
              totalTickets={analytics!.totalTickets} 
            />
            <RevenueOverview 
              totalRevenue={analytics!.totalRevenue} 
              totalEvents={analytics!.totalEvents} 
              growth={revenueGrowth} 
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// Export the authenticated component
export default withAuth(DashboardPage);