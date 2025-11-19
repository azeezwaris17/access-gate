"use client";

import { useState, useEffect, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { withAuth } from "@/lib/hocs/withAuth";

// Material UI Components
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Menu,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  InputAdornment,
} from "@mui/material";

// Material UI Icons
import {
  ConfirmationNumber,
  Person,
  Email,
  CalendarToday,
  LocationOn,
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Download,
  QrCode,
  CheckCircle,
  Cancel,
  Schedule,
  Add,
  Warning,
  Event,
} from "@mui/icons-material";

/**
 * Interface for Ticket Type data structure
 */
interface TicketType {
  _id: string;
  name: string;
  price: number;
}

/**
 * Interface for Event data structure
 */
interface EventType {
  _id: string;
  name: string;
  date: string;
  location: string;
  ticketTypes: TicketType[];
}

/**
 * Interface for Ticket data structure
 */
interface Ticket {
  _id: string;
  eventId: string;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketCode: string;
  status: "valid" | "checked-in" | "revoked";
  createdAt: string;
  checkedInAt?: string;
  revokedAt?: string;
  qrCode?: string;
  event?: EventType;
  ticketType?: TicketType;
}

/**
 * Status filter type
 */
type StatusFilter = "all" | "valid" | "checked-in" | "revoked";

function TicketsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<EventType[]>([]);

  /**
   * Fetch tickets and events on component mount
   */
  useEffect(() => {
    fetchTickets();
    fetchEvents();
  }, []);

  /**
   * Fetch tickets with filtering using the API service
   */
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/tickets/get-all-tickets?status=${statusFilter}&event=${eventFilter}&search=${searchTerm}`
      );

      if (response.data) {
        setTickets(response.data);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to load tickets";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch all events for filtering using the API service
   */
  const fetchEvents = async () => {
    try {
      const response = await api.get("/events/get-all-events");

      if (response.data) {
        setEvents(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
    }
  };

  /**
   * Refetch when filters change
   */
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, eventFilter, searchTerm]);

  /**
   * Menu handlers
   */
  const handleMenuOpen = (event: MouseEvent<HTMLElement>, ticket: Ticket) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTicket(null);
  };

  /**
   * Handle ticket status update using the API service
   */
  const handleStatusUpdate = async (newStatus: "checked-in" | "revoked") => {
    if (!selectedTicket) return;

    try {
      await api.post(`/tickets/${selectedTicket._id}/checkin`, {});

      toast.success(
        `Ticket ${
          newStatus === "checked-in" ? "checked in" : "revoked"
        } successfully`
      );
      fetchTickets();
      handleMenuClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update ticket status";
      toast.error(errorMessage);
    }
  };

  /**
   * Get status chip configuration
   */
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "valid":
        return {
          color: "success" as const,
          icon: <Schedule sx={{ fontSize: 16 }} />,
          label: "Valid",
        };
      case "checked-in":
        return {
          color: "primary" as const,
          icon: <CheckCircle sx={{ fontSize: 16 }} />,
          label: "Checked In",
        };
      case "revoked":
        return {
          color: "error" as const,
          icon: <Cancel sx={{ fontSize: 16 }} />,
          label: "Revoked",
        };
      default:
        return {
          color: "default" as const,
          icon: <Schedule sx={{ fontSize: 16 }} />,
          label: "Unknown",
        };
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Export tickets to CSV
   */
  const exportTickets = () => {
    const csvContent = [
      [
        "Ticket Code",
        "Attendee Name",
        "Attendee Email",
        "Event",
        "Ticket Type",
        "Status",
        "Created At",
        "Checked In At",
      ],
      ...tickets.map((ticket) => [
        ticket.ticketCode,
        ticket.attendeeName,
        ticket.attendeeEmail,
        ticket.event?.name || "N/A",
        ticket.ticketType?.name || "N/A",
        ticket.status,
        formatDate(ticket.createdAt),
        ticket.checkedInAt ? formatDate(ticket.checkedInAt) : "Not checked in",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Tickets exported successfully");
  };

  /**
   * Filter tickets based on search and filters
   */
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.attendeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesEvent =
      eventFilter === "all" || ticket.eventId === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  /**
   * Calculate ticket statistics
   */
  const ticketStats = {
    valid: tickets.filter((t) => t.status === "valid").length,
    checkedIn: tickets.filter((t) => t.status === "checked-in").length,
    revoked: tickets.filter((t) => t.status === "revoked").length,
    total: tickets.length,
  };

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 12,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ mb: 2, color: "primary.main" }} />
          <Typography variant="h6" color="text.secondary" fontWeight="medium">
            Loading tickets...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            All Tickets
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage and view all ticket registrations
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportTickets}
            sx={{
              backgroundColor: "success.main",
              "&:hover": {
                backgroundColor: "success.dark",
              },
              borderRadius: 2,
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/dashboard/events")}
            sx={{
              background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
              "&:hover": {
                background: "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
              },
              borderRadius: 2,
            }}
          >
            Create Tickets
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" icon={<Warning />} sx={{ borderRadius: 3, mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Search Section */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: { xs: "stretch", md: "center" },
            }}
          >
            {/* Search Field */}
            <TextField
              fullWidth
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Status Filter */}
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="valid">Valid</MenuItem>
                <MenuItem value="checked-in">Checked In</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
              </Select>
            </FormControl>

            {/* Event Filter */}
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Event</InputLabel>
              <Select
                value={eventFilter}
                label="Event"
                onChange={(e) => setEventFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Events</MenuItem>
                {events.map((event) => (
                  <MenuItem key={event._id} value={event._id}>
                    {event.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card
          elevation={2}
          sx={{
            borderRadius: 3,
            textAlign: "center",
            p: 8,
          }}
        >
          <ConfirmationNumber
            sx={{ fontSize: 64, color: "text.secondary", mb: 3 }}
          />
          <Typography
            variant="h5"
            component="h3"
            gutterBottom
            fontWeight="medium"
          >
            No tickets found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 400, mx: "auto" }}
          >
            {searchTerm || statusFilter !== "all" || eventFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No tickets have been created yet"}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push("/dashboard/events")}
            sx={{ borderRadius: 2 }}
          >
            Create Tickets
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
          {filteredTickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.status);

            return (
              <Card
                key={ticket._id}
                elevation={2}
                sx={{ borderRadius: 3, transition: "all 0.2s ease" }}
              >
                <CardContent sx={{ p: 4 }}>
                  {/* Ticket Header */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", lg: "row" },
                      gap: 3,
                      alignItems: { xs: "flex-start", lg: "flex-start" },
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Ticket Info */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="h5"
                              component="h3"
                              fontWeight="bold"
                            >
                              {ticket.attendeeName}
                            </Typography>
                            <Chip
                              label={statusConfig.label}
                              color={statusConfig.color}
                              variant="outlined"
                              icon={statusConfig.icon}
                              size="small"
                            />
                          </Box>

                          {/* Ticket Details */}
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 3,
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Email
                                sx={{ fontSize: 20, color: "text.secondary" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {ticket.attendeeEmail}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <ConfirmationNumber
                                sx={{ fontSize: 20, color: "text.secondary" }}
                              />
                              <Typography
                                variant="body2"
                                component="code"
                                sx={{
                                  backgroundColor: "grey.100",
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontFamily: "monospace",
                                }}
                              >
                                {ticket.ticketCode}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <CalendarToday
                                sx={{ fontSize: 20, color: "text.secondary" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Created {formatDate(ticket.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Action Menu */}
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, ticket)}
                          sx={{ color: "text.secondary" }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {/* Event Info */}
                      {ticket.event && (
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            backgroundColor: "grey.50",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <Event
                              sx={{ fontSize: 20, color: "text.secondary" }}
                            />
                            <Typography
                              variant="h6"
                              component="h4"
                              fontWeight="medium"
                            >
                              {ticket.event.name}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 3,
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <LocationOn
                                sx={{ fontSize: 16, color: "text.secondary" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {ticket.event.location}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <ConfirmationNumber
                                sx={{ fontSize: 16, color: "text.secondary" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {ticket.ticketType?.name || "General Admission"}{" "}
                                - ${ticket.ticketType?.price || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      )}
                    </Box>
                  </Box>

                  {/* Check-in Info */}
                  {ticket.checkedInAt && (
                    <Box
                      sx={{
                        mt: 3,
                        pt: 3,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckCircle
                          sx={{ fontSize: 20, color: "primary.main" }}
                        />
                        <Typography variant="body2" color="primary.main">
                          Checked in on {formatDate(ticket.checkedInAt)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Ticket Statistics */}
      {filteredTickets.length > 0 && (
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              component="h3"
              gutterBottom
              fontWeight="medium"
            >
              Ticket Summary
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {/* Valid Tickets */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "success.light",
                  color: "success.contrastText",
                  borderRadius: 2,
                  flex: "1 1 150px",
                  minWidth: "150px",
                }}
              >
                <Typography variant="h4" component="p" fontWeight="bold">
                  {ticketStats.valid}
                </Typography>
                <Typography variant="body2">Valid Tickets</Typography>
              </Paper>

              {/* Checked In */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "primary.light",
                  color: "primary.contrastText",
                  borderRadius: 2,
                  flex: "1 1 150px",
                  minWidth: "150px",
                }}
              >
                <Typography variant="h4" component="p" fontWeight="bold">
                  {ticketStats.checkedIn}
                </Typography>
                <Typography variant="body2">Checked In</Typography>
              </Paper>

              {/* Revoked */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "error.light",
                  color: "error.contrastText",
                  borderRadius: 2,
                  flex: "1 1 150px",
                  minWidth: "150px",
                }}
              >
                <Typography variant="h4" component="p" fontWeight="bold">
                  {ticketStats.revoked}
                </Typography>
                <Typography variant="body2">Revoked</Typography>
              </Paper>

              {/* Total */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "grey.300",
                  color: "grey.800",
                  borderRadius: 2,
                  flex: "1 1 150px",
                  minWidth: "150px",
                }}
              >
                <Typography variant="h4" component="p" fontWeight="bold">
                  {ticketStats.total}
                </Typography>
                <Typography variant="body2">Total Tickets</Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {selectedTicket?.status === "valid" && (
          <MenuItem onClick={() => handleStatusUpdate("checked-in")}>
            <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
            Check In
          </MenuItem>
        )}

        {selectedTicket?.status !== "revoked" && (
          <MenuItem
            onClick={() => handleStatusUpdate("revoked")}
            sx={{ color: "error.main" }}
          >
            <Cancel sx={{ mr: 1, fontSize: 20 }} />
            Revoke Ticket
          </MenuItem>
        )}

        <MenuItem onClick={handleMenuClose}>
          <QrCode sx={{ mr: 1, fontSize: 20 }} />
          View QR Code
        </MenuItem>
      </Menu>
    </Container>
  );
}

export default withAuth(TicketsPage);