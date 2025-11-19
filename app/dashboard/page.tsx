"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api"; // Import the API service
import { withAuth } from "@/lib/hocs/withAuth"; // Import the HOC

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
  CircularProgress,
  Paper,
  LinearProgress,
  useTheme,
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
 * Interface for dashboard statistics
 */
interface Stats {
  totalEvents: number;
  totalTickets: number;
  validTickets: number;
  checkedInTickets: number;
  revokedTickets: number;
  totalRevenue: number;
  eventStats: Array<{
    name: string;
    ticketCount: number;
    checkedIn: number;
    revenue?: number;
  }>;
}

/**
 * Time range type for analytics
 */
type TimeRange = "7d" | "30d" | "90d" | "1y";

/**
 * Color palette for charts
 */
const COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6"];

function DashboardPage() {
  const { admin } = useAuthStore(); // We can access admin info if needed
  const theme = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  /**
   * Fetch dashboard statistics from API
   */
  useEffect(() => {
    fetchStats();
  }, [timeRange]); // Removed token dependency since API service handles it

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Use the API service - it automatically includes the auth token
      const response = await api.get(`/events/stats?range=${timeRange}`); // Removed /api prefix

      if (response.data) {
        setStats(response.data);
        toast.success("Dashboard data updated");
      }
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      // 401 errors are automatically handled by the API service interceptor
      if (error.response?.status !== 401) {
        toast.error(
          error.response?.data?.error || "Failed to load dashboard data"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate check-in rate percentage
   */
  const checkInRate =
    stats && stats.totalTickets > 0
      ? Math.round((stats.checkedInTickets / stats.totalTickets) * 100)
      : 0;

  /**
   * Mock growth data - in production, this would come from API
   */
  const revenueGrowth = 12.5;
  const ticketGrowth = 8.2;
  const eventGrowth = 5.2;
  const checkInGrowth = 2.1;

  /**
   * Prepare chart data from statistics
   */
  const chartData =
    stats?.eventStats.map((event, index) => ({
      name:
        event.name.length > 12
          ? event.name.substring(0, 10) + "..."
          : event.name,
      total: event.ticketCount,
      checkedIn: event.checkedIn,
      revenue: event.revenue || 0,
      color: COLORS[index % COLORS.length],
    })) || [];

  /**
   * StatCard Component for displaying metrics
   */
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    growth,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    growth?: number;
    subtitle?: string;
  }) => (
    <Card
      elevation={2}
      sx={{
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        transition: "all 0.3s ease",
        flex: "1 1 250px",
        minWidth: "250px",
        "&:hover": {
          elevation: 4,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: "medium" }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: "bold",
                mb: growth ? 1 : 0,
              }}
            >
              {value}
            </Typography>
            {growth && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "success.main",
                    fontWeight: "medium",
                  }}
                >
                  +{growth}%
                </Typography>
                {subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: `${color}15`, // 15% opacity
              color: color,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          py: 4,
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 20,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress
                size={60}
                sx={{ mb: 3, color: "primary.main" }}
              />
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight="medium"
              >
                Loading analytics...
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  /**
   * Error State
   */
  if (!stats) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          py: 4,
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", py: 20 }}>
            <BarChartIcon sx={{ fontSize: 64, color: "grey.400", mb: 3 }} />
            <Typography
              variant="h5"
              color="text.secondary"
              fontWeight="medium"
              gutterBottom
            >
              Failed to load analytics
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please try refreshing the page
            </Typography>
            <IconButton
              onClick={fetchStats}
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
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
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                gutterBottom
              >
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Real-time analytics and performance metrics
                {admin && ` • Welcome back, ${admin.fullName}`}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Time Range Selector */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                >
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="90d">Last 90 days</MenuItem>
                  <MenuItem value="1y">Last year</MenuItem>
                </Select>
              </FormControl>

              {/* Refresh Button */}
              <IconButton
                onClick={fetchStats}
                sx={{
                  backgroundColor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    backgroundColor: "grey.50",
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards - Flexbox Layout */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 6,
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Event}
            color={theme.palette.primary.main}
            growth={eventGrowth}
            subtitle="vs last period"
          />
          <StatCard
            title="Total Tickets"
            value={stats.totalTickets.toLocaleString()}
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
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={AttachMoney}
            color={theme.palette.info.main}
            growth={revenueGrowth}
            subtitle="vs last period"
          />
        </Box>

        {/* Charts Section - Flexbox Layout */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Event Performance Chart */}
          <Card
            elevation={2}
            sx={{
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              flex: "1 1 auto",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 4,
                }}
              >
                <Typography variant="h6" component="h2" fontWeight="bold">
                  Event Performance
                </Typography>
                <ShowChart sx={{ color: "text.secondary" }} />
              </Box>

              {chartData.length > 0 ? (
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                      />
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
                <Box
                  sx={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <BarChartIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      fontWeight="medium"
                    >
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

          {/* Additional Metrics  */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 4,
            }}
          >
            {/* Check-in Progress */}
            <Card
              elevation={2}
              sx={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                flex: "1 1 400px",
                minWidth: "300px",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                  gutterBottom
                >
                  Check-in Progress
                </Typography>

                <Box sx={{ spaceY: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
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
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "success.main",
                        },
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
                        {stats.checkedInTickets}
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
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color="text.secondary"
                      >
                        {stats.totalTickets - stats.checkedInTickets}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remaining
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Revenue Overview */}
            <Card
              elevation={2}
              sx={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                flex: "1 1 400px",
                minWidth: "300px",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                  gutterBottom
                >
                  Revenue Overview
                </Typography>

                <Box sx={{ spaceY: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      ${stats.totalRevenue.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Average per Event
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      $
                      {stats.totalEvents > 0
                        ? (stats.totalRevenue / stats.totalEvents).toFixed(2)
                        : "0.00"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Growth
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="success.main"
                    >
                      +{revenueGrowth}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// Export the authenticated component
export default withAuth(DashboardPage);