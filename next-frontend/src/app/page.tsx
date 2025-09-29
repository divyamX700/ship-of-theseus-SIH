"use client";

import { useRouter } from "next/navigation";
import { DM_Sans } from "next/font/google";
import { Bell } from "lucide-react"; // <-- import Bell icon

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/cv_generate"); // redirect to dashboard
  };

  return (
    <div className={`min-h-screen flex flex-col ${dmSans.className}`}>
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side with logo + title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">🇮🇳</span>
              </div>
              <span className="font-semibold">PM Internship Portal</span>
            </div>

            {/* Right side navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="hover:text-blue-200">
               Home
              </a>
              <a href="#" className="hover:text-blue-200">
               Guidelines
              </a>
              <div className="flex items-center space-x-2 hover:text-blue-200 cursor-pointer">
                Mobile App
              </div>
               <button className="hover:text-blue-200">Gallery</button>
              <button className="hover:text-blue-200">Support</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Left side with background */}
        <div
          className="w-1/2 bg-cover bg-center flex items-end justify-center p-6"
          style={{
            backgroundImage: "url('/frontpage.png')",
          }}
        >
          <div className="bg-white rounded-xl shadow-md p-6 w-4/5">
            <h2 className="font-bold text-lg mb-4 text-center">
              Eligibility Criteria
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border rounded-lg p-3">
                <p className="font-semibold">Education</p>
                <p className="text-gray-600">Not enrolled fulltime.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-semibold">Age</p>
                <p className="text-gray-600">21–24 years old</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-semibold">Job Status</p>
                <p className="text-gray-600">Not fully employed.</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-semibold">Family</p>
                <p className="text-gray-600">
                  No one earning more than ₹8LPA; No Govt. Job.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side (Login form) */}
        <div className="w-1/2 flex flex-col justify-center px-24 bg-[#EAF5FF]">
          <div className="max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">PM Internship Scheme</h2>
            <p className="text-gray-500 text-sm mb-6">Login to continue</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Login with phone number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <a
                href="#"
                className="text-sm text-blue-600 hover:underline block text-right"
              >
                Forgot password
              </a>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold"
              >
                Login
              </button>

              <p className="text-sm mt-2">
                <a href="#" className="text-blue-600 hover:underline">
                  New User?
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600">
        © 2025 PM Internship Scheme &nbsp; | &nbsp;
        <a href="#" className="hover:underline">
          Terms
        </a>{" "}
        &nbsp; | &nbsp;
        <a href="#" className="hover:underline">
          Privacy
        </a>
      </footer>
    </div>
  );
}
