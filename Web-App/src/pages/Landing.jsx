import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background1.jpg";
import adminImage from "../assets/admin.png";
import patientImage from "../assets/patient.jpeg";

export default function Landing () {
  const nav = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-center bg-no-repeat relative"
      style={ {
        backgroundImage: `url(${ backgroundImage })`,
        backgroundSize: "100% 100%",
      } }
    >

      {/* Dark Overlay */ }
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 text-center">
        {/* Title */ }
        {/* <h1 className="text-6xl font-extrabold mb-16 drop-shadow-lg bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
          HEALTH MONITORING
        </h1> */}
        <h1
  className="text-6xl font-extrabold tracking-wide text-green-500 drop-shadow-md mb-6"
>
  HEALTH MONITORING
</h1>


        {/* Cards Section */ }
        <div className="flex flex-wrap justify-center gap-20">
          {/* Admin Card */ }
          <div
            onClick={ () => nav( "/login" ) }
            className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300 w-96 border-2 border-blue-400 hover:border-blue-600"
          >
            <div className="flex justify-center mb-8">
              <img
                src={ adminImage }
                alt="Admin"
                className="w-56 h-56 rounded-full border-4 border-blue-400 shadow-lg object-cover"
              />
            </div>
            <h2 className="text-4xl font-bold text-blue-600">👨‍⚕️ Admin</h2>
          </div>

          {/* Patient Card */ }
          <div
            onClick={ () => nav( "/patient-login" ) }
            className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300 w-96 border-2 border-green-400 hover:border-green-600"
          >
            <div className="flex justify-center mb-8">
              <img
                src={ patientImage }
                alt="Patient"
                className="w-56 h-56 rounded-full border-4 border-green-400 shadow-lg object-cover"
              />
            </div>
            <h2 className="text-4xl font-bold text-green-600">🧑‍🦰 Patient</h2>
          </div>
        </div>
      </div>

      {/* Gradient Animation Style */ }
      <style>
        { `
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 6s ease infinite;
          }
        `}
      </style>
    </div>
  );
}
