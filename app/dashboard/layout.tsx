"use client";

import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Material UI Components
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";

// Material UI Icons
import {
  Menu as MenuIcon,
  Logout,
  Shield,
  BarChart,
  ConfirmationNumber,
  Event,
  Add,
  List as ListIcon,
  ExpandLess,
  ExpandMore,
  Home,
  VpnKey,
  Person,
  Settings,
  ChevronRight,
  Dashboard,
  AdminPanelSettings,
  QrCodeScanner, // Added for Gate icon
} from "@mui/icons-material";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout Component
 * Provides navigation structure and layout for the admin dashboard
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { token, admin, clearAuth } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [openMenus, setOpenMenus] = useState({
    events: false,
    tickets: false,
  });
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  /**
   * Redirect to signin if no token exists
   */
  useEffect(() => {
    if (!token) {
      router.push("/signin");
    }
  }, [token, router]);

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    router.push("/signin");
    handleUserMenuClose();
  };

  /**
   * Toggle sidebar menu expansion
   */
  const toggleMenu = (menu: "events" | "tickets") => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  /**
   * Handle create ticket navigation
   */
  const handleCreateTicket = () => {
    router.push("/dashboard/events");
    // Fixed: Use toast directly instead of toast.info
    toast("Please select an event first to create tickets", {
      icon: "ℹ️",
      duration: 4000,
    });
  };

  /**
   * User menu handlers
   */
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  /**
   * Navigation items configuration
   */
  const navigationItems = [
    {
      label: "Dashboard",
      icon: <Dashboard />,
      href: "/dashboard",
    },
    {
      label: "Events",
      icon: <Event />,
      children: [
        {
          label: "Create Event",
          icon: <Add />,
          href: "/dashboard/events/create-event",
        },
        {
          label: "All Events",
          icon: <ListIcon />,
          href: "/dashboard/events",
        },
      ],
    },
    {
      label: "Tickets",
      icon: <ConfirmationNumber />,
      children: [
        {
          label: "Create Ticket",
          icon: <Add />,
          onClick: handleCreateTicket,
        },
        {
          label: "All Tickets",
          icon: <ListIcon />,
          href: "/dashboard/tickets",
        },
      ],
    },
    {
      label: "Admin Keys",
      icon: <VpnKey />,
      href: "/dashboard/keys",
    },
    // {
    //   label: "Gate",
    //   icon: <QrCodeScanner />, 
    //   href: "/gate",
    // },
  ];

  /**
   * Sidebar drawer content
   */
  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",
          color: "white",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Shield />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              AccessGate
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Admin Dashboard
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <List component="nav" sx={{ width: "100%" }}>
          {navigationItems.map((item) => (
            <Box key={item.label}>
              {item.children ? (
                /* Expandable menu item */
                <>
                  <ListItemButton
                    onClick={() =>
                      toggleMenu(
                        item.label.toLowerCase() as "events" | "tickets"
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "primary.main",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: "medium",
                        fontSize: "0.875rem",
                      }}
                    />
                    {openMenus[
                      item.label.toLowerCase() as "events" | "tickets"
                    ] ? (
                      <ExpandLess sx={{ fontSize: 18 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 18 }} />
                    )}
                  </ListItemButton>

                  <Collapse
                    in={
                      openMenus[
                        item.label.toLowerCase() as "events" | "tickets"
                      ]
                    }
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.children.map((child) => (
                        <ListItemButton
                          key={child.label}
                          sx={{
                            pl: 4,
                            borderRadius: 2,
                            mb: 0.5,
                            "&:hover": {
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={
                            child.onClick ||
                            (() => child.href && router.push(child.href))
                          }
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{
                              fontSize: "0.8rem",
                              color: "text.secondary",
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                /* Simple menu item */
                <ListItemButton
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "primary.main",
                    },
                  }}
                  onClick={() => item.href && router.push(item.href)}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: "medium",
                      fontSize: "0.875rem",
                    }}
                  />
                </ListItemButton>
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* Footer Section */}
      <Paper elevation={0} sx={{ p: 2, background: "transparent" }}>
        <Divider sx={{ mb: 2 }} />
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "error.main",
            "&:hover": {
              backgroundColor: "error.light",
              color: "error.dark",
            },
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontWeight: "medium",
              fontSize: "0.875rem",
            }}
          />
        </ListItemButton>
      </Paper>
    </Box>
  );

  if (!token) {
    return null; // or loading spinner
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            border: "none",
            background: "white",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        {/* Top App Bar */}
        <AppBar
          position="static"
          elevation={1}
          sx={{
            p: 2.5,
            background: "white",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar>
            {/* Mobile menu button */}
            <IconButton
              edge="start"
              sx={{ mr: 2, display: { lg: "none" } }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuIcon />
            </IconButton>

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* User Menu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                Welcome back, {admin?.fullName || "Admin"}
              </Typography>

              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  p: 1,
                  border: "2px solid",
                  borderColor: "primary.light",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background:
                      "linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)",
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                  }}
                >
                  {admin?.fullName?.charAt(0).toUpperCase() || "A"}
                </Avatar>
              </IconButton>

              {/* User Dropdown Menu */}
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >

                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            overflow: "auto",
            background: "transparent",
          }}
        >
          <Box sx={{ maxWidth: "100%", margin: "0 auto" }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
