"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import api from "@/lib/services/api"; // Import API service
import { withAuth } from "@/lib/hocs/withAuth"; // Import HOC

// Material UI Components
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Avatar,
  useTheme,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";

// Material UI Icons
import {
  VpnKey,
  ContentCopy,
  Check,
  Add,
  AutoAwesome,
  CalendarToday,
  Person,
  History,
  Warning,
} from "@mui/icons-material";

/**
 * Interface for Registration Key data structure
 */
interface RegistrationKey {
  key: string;
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
}

/**
 * Admin Keys Page Component
 * Manages admin registration key generation and tracking
 */
function AdminKeysPage() {
  const { admin } = useAuthStore(); // We can access admin info
  const theme = useTheme();
  const [keys, setKeys] = useState<RegistrationKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  /**
   * Fetch all admin keys on component mount
   */
  useEffect(() => {
    fetchKeys();
  }, []);

  /**
   * Fetch admin keys from API using the API service
   */
  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      // Use API service - automatically includes auth token
      const response = await api.get("/admin/keys"); // Removed /api prefix

      if (response.data) {
        setKeys(response.data.keys || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch keys:", error);
      // 401 errors are automatically handled by the API service interceptor
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.error || "Failed to load admin keys");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate a new admin registration key using the API service
   */
  const generateNewKey = async () => {
    setIsGenerating(true);
    try {
      // Use API service - automatically includes auth token
      const response = await api.post("/admin/keys", {}); // Removed /api prefix

      if (response.data) {
        setNewKey(response.data.key);
        setKeys(response.data.allKeys || []);
        toast.success("New admin key generated successfully!");
      }
    } catch (error: any) {
      console.error("Failed to generate key:", error);
      // 401 errors are automatically handled by the API service interceptor
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.error || "Failed to generate key");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copy key to clipboard with feedback
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  /**
   * Get status configuration for a key
   */
  const getStatusConfig = (used: boolean) => {
    return used
      ? {
          color: "default" as const,
          label: "Used",
          icon: <Check sx={{ fontSize: 16 }} />,
        }
      : {
          color: "success" as const,
          label: "Active",
          icon: <AutoAwesome sx={{ fontSize: 16 }} />,
        };
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
            }}
          >
            <VpnKey sx={{ fontSize: 40 }} />
          </Avatar>

          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            Admin Access Keys
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto" }}
          >
            Generate and manage registration keys for admin access to the
            platform{admin && ` • Welcome, ${admin.fullName}`}
          </Typography>
        </Box>

        {/* Main Content Card */}
        <Card
          elevation={4}
          sx={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            overflow: "hidden",
            background: "white",
          }}
        >
          {/* Generate Key Section */}
          <CardContent
            sx={{ p: 4, borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  component="h2"
                  gutterBottom
                  fontWeight="medium"
                >
                  Generate New Key
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create a unique registration key for new admins
                </Typography>
              </Box>

              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  background:
                    "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                }}
              >
                <AutoAwesome />
              </Avatar>
            </Box>

            {/* Generate Key Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={isGenerating}
              startIcon={
                isGenerating ? <CircularProgress size={20} /> : <Add />
              }
              onClick={generateNewKey}
              sx={{
                py: 2,
                background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
                  transform: "translateY(-1px)",
                  boxShadow: 4,
                },
                transition: "all 0.2s ease-in-out",
                borderRadius: 2,
              }}
            >
              {isGenerating
                ? "Generating Key..."
                : "Generate New Registration Key"}
            </Button>

            {/* New Key Display */}
            {newKey && (
              <Alert
                severity="success"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  background:
                    "linear-gradient(45deg, #e8f5e8 0%, #f1f8e9 100%)",
                }}
                icon={<Check />}
              >
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  New Key Generated Successfully!
                </Typography>

                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    mt: 2,
                    mb: 2,
                    background: "white",
                    border: "1px solid",
                    borderColor: "success.light",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="code"
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: "medium",
                      color: "text.primary",
                      flex: 1,
                    }}
                  >
                    {newKey}
                  </Typography>

                  <IconButton
                    onClick={() => copyToClipboard(newKey)}
                    sx={{
                      ml: 2,
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    }}
                  >
                    {copiedKey === newKey ? <Check /> : <ContentCopy />}
                  </IconButton>
                </Paper>

                <Typography variant="body2" color="success.dark">
                  Share this key with the new admin. It can only be used once
                  for registration.
                </Typography>
              </Alert>
            )}
          </CardContent>

          {/* Key History Section */}
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  component="h2"
                  gutterBottom
                  fontWeight="medium"
                >
                  Key History
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Track all generated registration keys and their status
                </Typography>
              </Box>

              <Chip
                label={`${keys.length} ${
                  keys.length === 1 ? "key" : "keys"
                } total`}
                variant="outlined"
                icon={<History />}
              />
            </Box>

            {/* Loading State */}
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 8,
                }}
              >
                <CircularProgress
                  size={48}
                  sx={{ mb: 2, color: "primary.main" }}
                />
                <Typography variant="body1" color="text.secondary">
                  Loading keys...
                </Typography>
              </Box>
            ) : keys.length === 0 ? (
              /* Empty State */
              <Paper
                elevation={0}
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 4,
                  border: "2px dashed",
                  borderColor: "divider",
                  background: "grey.50",
                  borderRadius: 3,
                }}
              >
                <VpnKey sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  fontWeight="medium"
                  color="text.secondary"
                >
                  No Keys Generated Yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 400, mx: "auto", mb: 3 }}
                >
                  Generate your first registration key to get started with admin
                  access management.
                </Typography>
                
                {/* Generate First Key Button */}
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={generateNewKey}
                  disabled={isGenerating}
                  sx={{
                    background: "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #1976D2 0%, #00ACC1 100%)",
                    },
                  }}
                >
                  {isGenerating ? "Generating..." : "Generate First Key"}
                </Button>
              </Paper>
            ) : (
              /* Keys List */
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {keys.map((keyData) => {
                  const status = getStatusConfig(!!keyData.usedBy);
                  const isActive = !keyData.usedBy;

                  return (
                    <Paper
                      key={keyData.key}
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": {
                          borderColor: "primary.light",
                          boxShadow: 4,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Key Info */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 3,
                            flex: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              backgroundColor: isActive
                                ? "primary.light"
                                : "grey.300",
                            }}
                          >
                            <VpnKey
                              sx={{
                                color: isActive
                                  ? "primary.contrastText"
                                  : "grey.600",
                              }}
                            />
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            {/* Key and Status */}
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
                                variant="body1"
                                component="code"
                                sx={{
                                  fontFamily: "monospace",
                                  fontWeight: "bold",
                                  backgroundColor: "grey.100",
                                  px: 2,
                                  py: 1,
                                  borderRadius: 1,
                                }}
                              >
                                {keyData.key}
                              </Typography>

                              <Chip
                                label={status.label}
                                color={status.color}
                                variant="outlined"
                                icon={status.icon}
                                size="small"
                              />
                            </Box>

                            {/* Metadata */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <CalendarToday
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Created {formatDate(keyData.createdAt)}
                                </Typography>
                              </Box>

                              {keyData.usedBy && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Person
                                    sx={{
                                      fontSize: 16,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Used by {keyData.usedBy}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {/* Copy Button - Only for active keys */}
                        {isActive && (
                          <IconButton
                            onClick={() => copyToClipboard(keyData.key)}
                            sx={{
                              backgroundColor: "grey.100",
                              "&:hover": {
                                backgroundColor: "primary.main",
                                color: "white",
                              },
                              transition: "all 0.2s ease",
                            }}
                            title="Copy key"
                          >
                            {copiedKey === keyData.key ? (
                              <Check />
                            ) : (
                              <ContentCopy />
                            )}
                          </IconButton>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Each key can only be used once for admin registration. Used keys
            cannot be reused.
          </Typography>
        </Box>

        {/* Copy Success Toast */}
        <Snackbar
          open={showCopiedToast}
          autoHideDuration={2000}
          onClose={() => setShowCopiedToast(false)}
          message="Key copied to clipboard!"
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Container>
    </Box>
  );
}

// Export the authenticated component
export default withAuth(AdminKeysPage);