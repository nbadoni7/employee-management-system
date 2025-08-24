import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  shape: { borderRadius: 10 },
  components: {
    MuiTextField: {
      defaultProps: { fullWidth: true, size: "small", variant: "outlined" },
    },
    MuiButton: { defaultProps: { variant: "contained" } },
  },
});
export default theme;
