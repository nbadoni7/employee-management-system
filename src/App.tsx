import { Outlet } from "react-router-dom";
import { Container, AppBar, Toolbar, Typography } from "@mui/material";

export default function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Employee Management System</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  );
}
