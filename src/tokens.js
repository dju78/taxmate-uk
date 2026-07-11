// Design tokens
export const TOKENS = {
  colors: {
    neutral: {
      0: "#FFFFFF",
      50: "#F7F8F9",
      100: "#EDEFF1",
      200: "#DCE0E3",
      300: "#C2C8CC",
      400: "#9AA2A8",
      500: "#75808A",
      600: "#565F68",
      700: "#3A4148",
      900: "#1A1F24",
    },
    green: {
      50: "#EAF6EE",
      100: "#D4EEDB",
      200: "#AEDFBB",
      300: "#82CC97",
      400: "#57B972",
      500: "#3AA25A",
      600: "#2E8C4B",
      700: "#23703C",
      800: "#1A552D",
      900: "#123B1F",
    },
    semantic: {
      success: "#3AA25A",
      warning: "#B8860B",
      danger: "#DC2626",
      info: "#2563EB",
    },
  },
  typography: {
    display: { family: "Manrope, sans-serif", size: "44px", weight: 800 },
    heading: { family: "Manrope, sans-serif", size: "24px", weight: 700 },
    body: { family: "Inter, sans-serif", size: "16px", weight: 400 },
    caption: { family: "Inter, sans-serif", size: "13px", weight: 600 },
  },
  spacing: { xs: "8px", sm: "12px", md: "16px", lg: "20px", xl: "32px", "2xl": "36px" },
  radius: { sm: "8px", md: "14px", lg: "20px", xl: "22px" },
  shadows: {
    card: "0 8px 24px -8px rgba(0, 0, 0, 0.25)",
    dashboard: "0 20px 50px -20px rgba(0, 0, 0, 0.2)",
  },
  focus: {
    outline: "0 0 0 3px rgba(58, 162, 90, 0.25)",
  },
};
