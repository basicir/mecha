import "./globals.css";

export const metadata = {
  title: "Mecha Oldal - Statika Kalkulátor",
  description: "Statika feladatok kalkulátor alkalmazás mérnök hallgatóknak",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
