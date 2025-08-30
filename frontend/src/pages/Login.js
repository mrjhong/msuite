// frontend/src/pages/Login.js - Actualizado
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { apiAuthLogin } from '../services/authApiService';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { initSocket } from '../services/socket';
import { useSetup } from '../hooks/useSetup';
import Setup from '../components/Setup';
import { useGlobalContext } from '../context/GlobalContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useGlobalContext();

  // Hook para manejar el setup
  const { loading: setupLoading, setupRequired, refreshSetupStatus } = useSetup();

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async container => {
    // Callback opcional cuando las partículas se cargan
  }, []);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const resp = await apiAuthLogin({ email, password });
      
      if (resp.failure) {
        // Manejar errores específicos
        if (resp.error === 'Sistema no configurado') {
          showNotification('El sistema requiere configuración inicial', 'warning');
          refreshSetupStatus(); // Refrescar estado del setup
          return;
        }
        setError(resp.error);
        return;
      }

      // Login exitoso
      localStorage.setItem('token', resp.token);
      localStorage.setItem('user', JSON.stringify(resp.user));
      initSocket();
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSetupComplete = () => {
    showNotification('¡Sistema configurado correctamente! Ya puedes iniciar sesión.', 'success');
    refreshSetupStatus(); // Actualizar estado del setup
  };

  // Mostrar loading mientras verifica el estado del setup
  if (setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Verificando configuración del sistema...</p>
        </div>
      </div>
    );
  }

  // Si se requiere setup, mostrar el componente de configuración
  if (setupRequired) {
    return <Setup onSetupComplete={handleSetupComplete} />;
  }

  // Mostrar login normal si el sistema ya está configurado
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ------------------ IZQUIERDA ------------------ */}
      <div className="md:w-1/2 relative flex items-center justify-center bg-gradient-to-b from-slate-900 to-purple-900 text-white p-8">
        {/* Efecto de partículas */}
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            fullScreen: {
              enable: false,
              zIndex: 0
            },
            particles: {
              number: {
                value: 80,
                density: {
                  enable: true,
                  value_area: 800
                }
              },
              color: {
                value: "#ffffff"
              },
              shape: {
                type: "circle"
              },
              opacity: {
                value: 0.5,
                random: true,
                anim: {
                  enable: true,
                  speed: 1,
                  opacity_min: 0.1,
                  sync: false
                }
              },
              size: {
                value: 3,
                random: true,
                anim: {
                  enable: true,
                  speed: 2,
                  size_min: 0.1,
                  sync: false
                }
              },
              line_linked: {
                enable: true,
                distance: 150,
                color: "#ffffff",
                opacity: 0.4,
                width: 1
              },
              move: {
                enable: true,
                speed: 1,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                  enable: false,
                  rotateX: 600,
                  rotateY: 1200
                }
              }
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: {
                  enable: true,
                  mode: "grab"
                },
                onclick: {
                  enable: true,
                  mode: "push"
                },
                resize: true
              },
              modes: {
                grab: {
                  distance: 140,
                  line_linked: {
                    opacity: 1
                  }
                },
                push: {
                  particles_nb: 4
                }
              }
            },
            retina_detect: true
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%"
          }}
        />
        
        <div className="z-10 max-w-md text-center md:text-left">
          <h1 className="text-4xl font-bold mb-4">Eficiencia Automatizada</h1>
          <p className="text-sm leading-relaxed text-white/80">
            Tu centro de comandos para comunicaciones automatizadas.
            <span className="block mt-3 text-white/60 text-xs">
              Accede a todas las herramientas para gestionar tus envíos masivos
              y comunicaciones programadas desde un solo lugar.
            </span>
          </p>
        </div>
      </div>

      {/* ------------------ DERECHA ------------------ */}
      <div className="md:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Bienvenido</h2>

          {error && (
            <div className="mt-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loginLoading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loginLoading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                disabled={loginLoading}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 disabled:opacity-50"
                style={{ top: '24px' }} // Ajustar por el label
              >
                {showPwd ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginLoading}
              className={`w-full py-3 rounded-lg text-white transition-all duration-200 ${
                loginLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loginLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            © 2025 MSuite. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;