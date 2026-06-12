import type { Metadata } from "next";

import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "GymFlow Admin",
  description: "Gym management admin system",
};

const themeScript = `
(function () {
  try {
    var storedTheme = window.localStorage.getItem("gymflow_theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : prefersDark ? "dark" : "light";

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
