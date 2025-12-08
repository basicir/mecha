import './globals.css'

export const metadata = {
  title: 'Mecha Oldal - Statika Kalkulátor',
  description: 'Kalkulátor alkalmazás statikai feladatokhoz',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML"
          async
        ></script>
      </head>
      <body>
        <nav className="navbar">
          <span className="navbar-brand">Mecha Oldal</span>
        </nav>
        {children}
      </body>
    </html>
  )
}
