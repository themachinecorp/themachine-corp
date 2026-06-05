import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import GlobalNavbar from "@/components/auth/GlobalNavbar";

export const metadata: Metadata = {
  title: "CROWN — Watch Collection Identity",
  description: "Turn your watch collection into shareable digital identity cards. Every timepiece deserves its moment.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E8ECF2'><polygon points='12,1.5 12.7,11.4 12.7,12 11.3,12 11.3,11.4'/><polygon points='12,0.2 12.5,11.4 12.5,12 11.5,12 11.5,11.4'/><circle cx='12' cy='12' r='0.8'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.minimaxi.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.minimaxi.com" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className="min-h-screen antialiased" style={{ background: '#0a0a0a' }}>
        <AuthProvider>
          <GlobalNavbar />
          {children}
        </AuthProvider>
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  function tick() {
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();
    var hourDeg = h * 30 + m * 0.5 + s * (0.5 / 60);
    var minDeg  = m * 6 + s * 0.1;
    var svgs = document.querySelectorAll('.watch-live');
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      var vb = svg.getAttribute('viewBox');
      var cx = 12, cy = 12;
      if (vb) {
        var parts = vb.trim().split(/\\s+/);
        var nums = [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
        if (!isNaN(nums[0]) && !isNaN(nums[1]) && !isNaN(nums[2]) && !isNaN(nums[3])) {
          cx = nums[0] + nums[2] / 2;
          cy = nums[1] + nums[3] / 2;
        }
      }
      var hour = svg.querySelector('.wm-hour');
      var min  = svg.querySelector('.wm-min');
      if (hour) hour.setAttribute('transform', 'rotate(' + hourDeg.toFixed(2) + ' ' + cx + ' ' + cy + ')');
      if (min)  min.setAttribute('transform',  'rotate(' + minDeg.toFixed(2)  + ' ' + cx + ' ' + cy + ')');
    }
  }
  tick();
  setTimeout(function loop() {
    tick();
    setTimeout(loop, 1000);
  }, 1000 - (Date.now() % 1000));
})();
            `,
          }}
        />
      </body>
    </html>
  );
}
