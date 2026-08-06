import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';
import { VERSION, BUILD_HASH } from '../version';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import DesktopShell from './DesktopShell';
import { NotificationToast, NotificationInbox, useNotifications } from './Notifications';
import { useToast } from './Toast';

function getToken(): string {
  return localStorage.getItem('supabase_auth_token') || '';
}

async function apiGet(path: string): Promise<any> {
  return apiFetch(path);
}

async function apiGetHtml(path: string): Promise<string> {
  const isRender = window.location.hostname.includes('onrender.com');
  const baseUrl = import.meta.env.VITE_API_URL || (isRender ? 'https://finnova-back.onrender.com' : '');
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.text();
}

interface SimJob { id: string; title: string; description: string; difficulty: number; category?: string; }
interface SimTask { id: string; jobId: string; title: string; description: string; taskType: string; difficulty: number; estimatedMinutes: number; sequenceOrder: number; }
type ViewMode = 'office' | 'workspace' | 'document';

// ─── DUST PARTICLES ───────────────────────────────────────────
function DustParticles() {
  const count = 60;
  const positions = useRef(new Float32Array(count * 3));
  const velocities = useRef(new Float32Array(count * 3));

  for (let i = 0; i < count; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 4;
    positions.current[i * 3 + 1] = Math.random() * 3 + 0.5;
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1;
    velocities.current[i * 3] = (Math.random() - 0.5) * 0.002;
    velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
    velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }

  const ref = useRef<THREE.Points>(null);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < count; i++) {
      (pos.array as Float32Array)[i * 3] += velocities.current[i * 3];
      (pos.array as Float32Array)[i * 3 + 1] += velocities.current[i * 3 + 1];
      (pos.array as Float32Array)[i * 3 + 2] += velocities.current[i * 3 + 2];
      if ((pos.array as Float32Array)[i * 3 + 1] > 4) (pos.array as Float32Array)[i * 3 + 1] = 0.5;
      if ((pos.array as Float32Array)[i * 3 + 1] < 0.3) (pos.array as Float32Array)[i * 3 + 1] = 3.5;
    }
    pos.needsUpdate = true;
  });

  const geomRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (geomRef.current) {
      geomRef.current.setAttribute('position', new THREE.BufferAttribute(positions.current, 3));
    }
  }, []);

  return (
    <points ref={ref}>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial size={0.008} color="#fffbe6" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ─── DESK ──────────────────────────────────────────────────────
function DeskGroup() {
  const legs = [[-1.0, 0.2, -0.4], [1.0, 0.2, -0.4], [-1.0, 0.2, 0.4], [1.0, 0.2, 0.4]];
  return (
    <group position={[0, 0, -2]}>
      {/* Desktop surface - dark walnut wood */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.2, 0.06, 1.0]} />
        <meshStandardMaterial color="#3e2723" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Desk edge trim - darker wood accent */}
      <mesh position={[0, 0.43, 0.5]}>
        <boxGeometry args={[2.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#2c1a12" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Front edge bevel */}
      <mesh position={[0, 0.43, 0.49]}>
        <boxGeometry args={[2.2, 0.01, 0.01]} />
        <meshStandardMaterial color="#5d4037" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Legs with brushed metal finish */}
      {legs.map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} receiveShadow castShadow>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {/* Leg cross-braces */}
      <mesh position={[0, 0.15, -0.4]} receiveShadow>
        <boxGeometry args={[2.0, 0.02, 0.02]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.15, 0.4]} receiveShadow>
        <boxGeometry args={[2.0, 0.02, 0.02]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Keyboard - matte black plastic */}
      <mesh position={[-0.3, 0.44, 0.15]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.015, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.0} />
      </mesh>
      {/* Keyboard key rows (subtle detail) */}
      {[-0.06, -0.03, 0, 0.03].map((z, i) => (
        <mesh key={`kr${i}`} position={[-0.3, 0.45, 0.12 + z]} receiveShadow>
          <boxGeometry args={[0.36, 0.003, 0.025]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.0} />
        </mesh>
      ))}
      {/* Mouse - ergonomic shape */}
      <mesh position={[0.35, 0.445, 0.15]} receiveShadow castShadow>
        <boxGeometry args={[0.06, 0.02, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.65} metalness={0.0} />
      </mesh>
      {/* Mouse scroll wheel */}
      <mesh position={[0.35, 0.46, 0.13]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.015, 8]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* Mouse pad - dark blue fabric */}
      <mesh position={[0.35, 0.435, 0.15]} receiveShadow>
        <boxGeometry args={[0.22, 0.005, 0.2]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.92} metalness={0.0} />
      </mesh>
      {/* Coffee mug - ceramic white */}
      <group position={[0.7, 0.43, -0.2]}>
        <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.035, 0.032, 0.08, 16]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Mug handle */}
        <mesh position={[0.04, 0.06, 0]} rotation={[0, 0, 0]} receiveShadow>
          <torusGeometry args={[0.02, 0.005, 8, 12, Math.PI]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.35} metalness={0.05} />
        </mesh>
        {/* Coffee liquid surface */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 16]} />
          <meshStandardMaterial color="#3e2723" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Steam wisps */}
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
        <mesh position={[0.01, 0.17, 0.005]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
      </group>
      {/* Papers stack - slightly offset for realism */}
      <mesh position={[-0.7, 0.44, -0.1]} receiveShadow>
        <boxGeometry args={[0.25, 0.015, 0.35]} />
        <meshStandardMaterial color="#fafafa" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[-0.69, 0.455, -0.09]} receiveShadow>
        <boxGeometry args={[0.23, 0.012, 0.33]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.88} metalness={0.0} />
      </mesh>
      <mesh position={[-0.71, 0.465, -0.11]} receiveShadow>
        <boxGeometry args={[0.24, 0.01, 0.34]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Pen - blue ink pen */}
      <mesh position={[-0.55, 0.44, -0.15]} rotation={[0, 0.3, Math.PI / 2]} receiveShadow castShadow>
        <cylinderGeometry args={[0.004, 0.003, 0.14, 8]} />
        <meshStandardMaterial color="#1a5276" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Pen clip */}
      <mesh position={[-0.55, 0.445, -0.14]} rotation={[0, 0.3, Math.PI / 2]} receiveShadow>
        <boxGeometry args={[0.001, 0.001, 0.04]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Cable from monitor to desk edge */}
      <mesh position={[0, 0.42, -0.3]} receiveShadow>
        <cylinderGeometry args={[0.003, 0.003, 0.4, 6]} />
        <meshStandardMaterial color="#111" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Cable curve */}
      <mesh position={[0, 0.41, -0.5]} rotation={[0.3, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.003, 0.003, 0.3, 6]} />
        <meshStandardMaterial color="#111" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* USB hub on desk */}
      <mesh position={[0.85, 0.435, 0.1]} receiveShadow castShadow>
        <boxGeometry args={[0.08, 0.015, 0.03]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* USB ports (tiny colored dots) */}
      {[0, 1, 2].map((i) => (
        <mesh key={`usb${i}`} position={[0.83 + i * 0.015, 0.444, 0.1]} receiveShadow>
          <circleGeometry args={[0.003, 8]} />
          <meshStandardMaterial color="#444" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ─── MONITOR ───────────────────────────────────────────────────
function MonitorGroup({ onClick, hovered }: { onClick: () => void; hovered: boolean }) {
  return (
    <group position={[0, 0.43, -2]} onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}>
      {/* Base - brushed metal */}
      <mesh position={[0, -0.02, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.02, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Base rubber pad */}
      <mesh position={[0, -0.032, 0]} receiveShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.005, 32]} />
        <meshStandardMaterial color="#111" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Stand - matte black plastic */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Stand neck detail */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Screen bezel - matte black */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.05, 0.65, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Bezel inner border */}
      <mesh position={[0, 0.35, 0.021]}>
        <boxGeometry args={[1.0, 0.6, 0.001]} />
        <meshStandardMaterial color="#050505" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Screen - main surface with emissive glow */}
      <mesh position={[0, 0.35, 0.021]}>
        <planeGeometry args={[0.95, 0.55]} />
        <meshStandardMaterial 
          color={hovered ? '#1e40af' : '#0f172a'} 
          emissive={hovered ? '#3b82f6' : '#1e3a5f'} 
          emissiveIntensity={hovered ? 0.8 : 0.4}
          roughness={0.1} 
          metalness={0.3} 
        />
      </mesh>
      {/* Screen content - desktop-like pattern */}
      <mesh position={[0, 0.35, 0.022]}>
        <planeGeometry args={[0.88, 0.48]} />
        <meshStandardMaterial 
          color={hovered ? '#60a5fa' : '#2563eb'} 
          emissive={hovered ? '#93c5fd' : '#3b82f6'} 
          emissiveIntensity={hovered ? 0.5 : 0.3}
          roughness={0.1} 
        />
      </mesh>
      {/* Power LED */}
      <mesh position={[0.4, 0.04, 0.025]}>
        <circleGeometry args={[0.01, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
      </mesh>
      {/* Brand logo */}
      <mesh position={[0, 0.41, 0.025]}>
        <circleGeometry args={[0.018, 12]} />
        <meshStandardMaterial color="#333" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Glow ring around monitor - warm ambient */}
      <mesh position={[0, 0.35, 0.03]}>
        <ringGeometry args={[0.52, 0.56, 32]} />
        <meshBasicMaterial color={hovered ? '#3b82f6' : '#FFB162'} transparent opacity={hovered ? 0.5 : 0.2} />
      </mesh>
      {/* Floating beacon above monitor */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial
          color="#FFB162"
          emissive="#FFB162"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

// ─── CHAIR ─────────────────────────────────────────────────────
function ChairGroup() {
  return (
    <group position={[0, 0, 0.3]}>
      {/* Wheels base - chrome */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.03, 24]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Wheel arms - polished metal */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.15, 0.03, Math.sin(angle) * 0.15]} receiveShadow castShadow>
            <boxGeometry args={[0.02, 0.02, 0.12]} />
            <meshStandardMaterial color="#333" metalness={0.85} roughness={0.2} />
          </mesh>
        );
      })}
      {/* Wheels - rubber coated */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={`w${i}`} position={[Math.cos(angle) * 0.2, 0.02, Math.sin(angle) * 0.2]} rotation={[Math.PI / 2, 0, angle]} receiveShadow castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.025, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} />
          </mesh>
        );
      })}
      {/* Gas lift - chrome cylinder */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.022, 0.028, 0.3, 12]} />
        <meshStandardMaterial color="#555" metalness={0.95} roughness={0.08} />
      </mesh>
      {/* Gas lift cover */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.15, 12]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Seat cushion - leather upholstery */}
      <mesh position={[0, 0.38, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.45, 0.06, 0.45]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Seat cushion stitching detail */}
      <mesh position={[0, 0.411, 0]} receiveShadow>
        <boxGeometry args={[0.4, 0.001, 0.4]} />
        <meshStandardMaterial color="#173050" roughness={0.85} metalness={0.0} />
      </mesh>
      {/* Seat frame - metal */}
      <mesh position={[0, 0.36, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.47, 0.02, 0.47]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Backrest - leather upholstery */}
      <mesh position={[0, 0.62, 0.22]} receiveShadow castShadow>
        <boxGeometry args={[0.42, 0.45, 0.05]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Backrest stitching */}
      <mesh position={[0, 0.62, 0.246]} receiveShadow>
        <boxGeometry args={[0.38, 0.4, 0.001]} />
        <meshStandardMaterial color="#173050" roughness={0.85} metalness={0.0} />
      </mesh>
      {/* Backrest frame - metal */}
      <mesh position={[0, 0.62, 0.245]} receiveShadow castShadow>
        <boxGeometry args={[0.44, 0.47, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Armrests - padded metal */}
      <mesh position={[-0.24, 0.48, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.04, 0.03, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0.24, 0.48, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.04, 0.03, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Armrest pads */}
      <mesh position={[-0.24, 0.498, 0]} receiveShadow>
        <boxGeometry args={[0.05, 0.008, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.0} />
      </mesh>
      <mesh position={[0.24, 0.498, 0]} receiveShadow>
        <boxGeometry args={[0.05, 0.008, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.0} />
      </mesh>
    </group>
  );
}

// ─── ROOM ─────────────────────────────────────────────────────
function RoomGroup() {
  return (
    <group>
      {/* Floor - polished concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#6b7280" roughness={0.75} metalness={0.05} />
      </mesh>
      {/* Floor tile lines (subtle grid) */}
      {[-3, 0, 3].map((x) => (
        <mesh key={`fx${x}`} position={[x, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.01, 14]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} metalness={0.05} transparent opacity={0.3} />
        </mesh>
      ))}
      {[-3, 0, 3].map((z) => (
        <mesh key={`fz${z}`} position={[0, -0.005, z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
          <planeGeometry args={[0.01, 14]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} metalness={0.05} transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Back wall - drywall/plaster */}
      <mesh position={[0, 2.5, -4.5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.3]} />
        <meshStandardMaterial color="#e8e4de" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[9, 5, 0.3]} />
        <meshStandardMaterial color="#ebe7e1" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Right wall */}
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[9, 5, 0.3]} />
        <meshStandardMaterial color="#e5e1db" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Ceiling - acoustic tile */}
      <mesh position={[0, 5, -2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 9]} />
        <meshStandardMaterial color="#f0ede8" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* ─── WINDOW WITH SKY ───────────────────────────── */}
      {/* Sky gradient behind window */}
      <mesh position={[1.8, 2, -4.46]}>
        <planeGeometry args={[2.0, 1.3]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>
      {/* Sky gradient overlay - lighter at bottom */}
      <mesh position={[1.8, 1.5, -4.455]}>
        <planeGeometry args={[2.0, 0.6]} />
        <meshBasicMaterial color="#e0f0ff" transparent opacity={0.6} />
      </mesh>
      {/* Sun glow */}
      <mesh position={[2.2, 2.5, -4.45]}>
        <circleGeometry args={[0.15, 24]} />
        <meshBasicMaterial color="#fff5d4" transparent opacity={0.8} />
      </mesh>
      <mesh position={[2.2, 2.5, -4.454]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#fff5d4" transparent opacity={0.3} />
      </mesh>
      {/* Cloud shapes */}
      <mesh position={[1.2, 2.8, -4.452]}>
        <boxGeometry args={[0.3, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={1} />
      </mesh>
      <mesh position={[1.35, 2.82, -4.452]}>
        <boxGeometry args={[0.2, 0.06, 0.01]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={1} />
      </mesh>
      <mesh position={[2.5, 2.6, -4.452]}>
        <boxGeometry args={[0.25, 0.07, 0.01]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} roughness={1} />
      </mesh>
      {/* Distant buildings silhouette */}
      <mesh position={[1.0, 1.4, -4.45]}>
        <boxGeometry args={[0.15, 0.3, 0.01]} />
        <meshStandardMaterial color="#b0bec5" transparent opacity={0.3} roughness={1} />
      </mesh>
      <mesh position={[1.3, 1.5, -4.45]}>
        <boxGeometry args={[0.1, 0.4, 0.01]} />
        <meshStandardMaterial color="#90a4ae" transparent opacity={0.25} roughness={1} />
      </mesh>
      <mesh position={[1.55, 1.35, -4.45]}>
        <boxGeometry args={[0.12, 0.25, 0.01]} />
        <meshStandardMaterial color="#b0bec5" transparent opacity={0.28} roughness={1} />
      </mesh>
      <mesh position={[2.5, 1.3, -4.45]}>
        <boxGeometry args={[0.08, 0.2, 0.01]} />
        <meshStandardMaterial color="#90a4ae" transparent opacity={0.22} roughness={1} />
      </mesh>
      {/* Window glass */}
      <mesh position={[1.8, 2, -4.44]} receiveShadow>
        <boxGeometry args={[2.2, 1.5, 0.02]} />
        <meshStandardMaterial
          color="#b8d4e8"
          transparent
          opacity={0.18}
          roughness={0.05}
          metalness={0.4}
          envMapIntensity={1.0}
        />
      </mesh>
      {/* Window frame - white painted wood */}
      <mesh position={[1.8, 2, -4.43]}>
        <boxGeometry args={[2.25, 1.55, 0.015]} />
        <meshStandardMaterial color="#e8e4e0" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Window cross bars */}
      <mesh position={[1.8, 2, -4.42]}>
        <boxGeometry args={[2.2, 0.035, 0.012]} />
        <meshStandardMaterial color="#d5d0ca" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[1.8, 2, -4.42]}>
        <boxGeometry args={[0.035, 1.5, 0.012]} />
        <meshStandardMaterial color="#d5d0ca" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Window sill */}
      <mesh position={[1.8, 1.22, -4.42]} receiveShadow>
        <boxGeometry args={[2.3, 0.04, 0.08]} />
        <meshStandardMaterial color="#e0dcd6" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* ─── BACK WALL DETAILS ─────────────────────────── */}
      {/* Whiteboard markers tray */}
      <mesh position={[0, 1.0, -4.38]} receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.08]} />
        <meshStandardMaterial color="#333" roughness={0.6} />
      </mesh>
      {/* Whiteboard markers */}
      <mesh position={[-0.3, 1.05, -4.36]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 1.05, -4.36]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0.3, 1.05, -4.36]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

      {/* Wall clock */}
      <mesh position={[-2.5, 3.5, -4.38]} receiveShadow>
        <circleGeometry args={[0.25, 32]} />
        <meshStandardMaterial color="#fff" roughness={0.3} />
      </mesh>
      <mesh position={[-2.5, 3.5, -4.37]}>
        <circleGeometry args={[0.23, 32]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.4} />
      </mesh>
      {/* Clock hands */}
      <mesh position={[-2.5, 3.5, -4.36]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.008, 0.12, 0.005]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-2.5, 3.5, -4.36]} rotation={[0, 0, -Math.PI / 3]}>
        <boxGeometry args={[0.006, 0.08, 0.005]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Clock center dot */}
      <mesh position={[-2.5, 3.5, -4.35]}>
        <circleGeometry args={[0.015, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Picture frame on back wall */}
      <mesh position={[3, 3, -4.38]} receiveShadow>
        <boxGeometry args={[0.8, 0.6, 0.02]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.5} />
      </mesh>
      <mesh position={[3, 3, -4.37]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#87CEEB" roughness={0.3} />
      </mesh>
      {/* Abstract art in frame */}
      <mesh position={[2.85, 3.05, -4.36]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color="#FFB162" emissive="#FFB162" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[3.1, 2.95, -4.36]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[3.15, 3.1, -4.36]}>
        <circleGeometry args={[0.05, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.2} />
      </mesh>

      {/* Thermostat on back wall */}
      <mesh position={[4, 2, -4.38]}>
        <boxGeometry args={[0.12, 0.12, 0.02]} />
        <meshStandardMaterial color="#fff" roughness={0.4} />
      </mesh>
      <mesh position={[4, 2, -4.37]}>
        <circleGeometry args={[0.04, 12]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

      {/* ─── CORK BOARD ────────────────────────────────── */}
      <mesh position={[3.2, 2.2, -4.44]} receiveShadow>
        <boxGeometry args={[0.8, 0.6, 0.03]} />
        <meshStandardMaterial color="#c49a6c" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Cork board frame */}
      <mesh position={[3.2, 2.2, -4.435]}>
        <boxGeometry args={[0.85, 0.65, 0.01]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Pinned notes */}
      <mesh position={[3.05, 2.35, -4.43]}>
        <planeGeometry args={[0.15, 0.12]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh position={[3.25, 2.28, -4.43]}>
        <planeGeometry args={[0.12, 0.15]} />
        <meshStandardMaterial color="#bbf7d0" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh position={[3.35, 2.1, -4.43]}>
        <planeGeometry args={[0.18, 0.1]} />
        <meshStandardMaterial color="#fecaca" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Pin on notes */}
      <mesh position={[3.05, 2.41, -4.428]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[3.25, 2.36, -4.428]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* ─── WALL CLOCK ────────────────────────────────── */}
      <group position={[-4.44, 3.0, -1]}>
        {/* Clock face */}
        <mesh rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#fafafa" roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Clock frame */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.17, 0.19, 32]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Hour hand */}
        <mesh position={[0, 0.05, 0.005]} rotation={[0, Math.PI / 2, 0.5]}>
          <boxGeometry args={[0.005, 0.08, 0.002]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Minute hand */}
        <mesh position={[-0.02, 0.06, 0.006]} rotation={[0, Math.PI / 2, -0.3]}>
          <boxGeometry args={[0.003, 0.12, 0.002]} />
          <meshStandardMaterial color="#333" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Center pin */}
        <mesh position={[0, 0, 0.008]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.012, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Hour markers */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
          const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
          const r = 0.14;
          return (
            <mesh key={`h${h}`} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0.004]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.006, 8]} />
              <meshStandardMaterial color="#333" roughness={0.4} metalness={0.3} />
            </mesh>
          );
        })}
      </group>

      {/* ─── PICTURE FRAME ON LEFT WALL ────────────────── */}
      <group position={[-4.44, 2.0, 0.5]}>
        {/* Frame */}
        <mesh rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[0.5, 0.4, 0.02]} />
          <meshStandardMaterial color="#5c3d2e" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Canvas/artwork */}
        <mesh position={[0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.42, 0.32]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.9} metalness={0.0} />
        </mesh>
        {/* Abstract art shapes */}
        <mesh position={[0.012, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="#8b5e3c" roughness={0.8} metalness={0.0} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.012, -0.03, 0.05]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.06, 12]} />
          <meshStandardMaterial color="#c49a6c" roughness={0.8} metalness={0.0} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* ─── WHITEBOARD ────────────────────────────────── */}
      <mesh position={[-4.44, 2.2, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[2.5, 1.5, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[-4.43, 2.2, -2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.55, 1.55, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Whiteboard marker tray */}
      <mesh position={[-4.42, 1.42, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.04, 0.06]} />
        <meshStandardMaterial color="#333" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Markers on tray */}
      <mesh position={[-4.41, 1.44, -2.2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
      <mesh position={[-4.41, 1.44, -2.0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.6} />
      </mesh>
      <mesh position={[-4.41, 1.44, -1.8]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>

      {/* ─── BASEBOARDS ────────────────────────────────── */}
      <mesh position={[0, 0.05, -4.35]}>
        <boxGeometry args={[10, 0.1, 0.02]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[-4.95, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9, 0.1, 0.02]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[4.95, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[9, 0.1, 0.02]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* ─── 3-POINT LIGHTING ──────────────────────────── */}
      {/* Key light - warm, from upper right */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={0.8}
        color="#FFF5E6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
      />
      {/* Fill light - cool, from left */}
      <directionalLight position={[-3, 4, 2]} intensity={0.3} color="#E6F0FF" />
      {/* Rim light - behind, for edge definition */}
      <directionalLight position={[0, 3, -5]} intensity={0.2} color="#FFFFFF" />
      {/* Ambient - base illumination */}
      <ambientLight intensity={0.25} color="#F0F0F0" />
      {/* Desk lamp - warm point light */}
      <pointLight position={[0, 1.2, -2]} intensity={0.5} distance={3} color="#FFE4B5" decay={2} castShadow />
      {/* Window light spill */}
      <pointLight position={[1.8, 2, -3.5]} intensity={0.3} distance={4} color="#e0f0ff" decay={2} />
    </group>
  );
}

// ─── SHELF ─────────────────────────────────────────────────────
function ShelfGroup() {
  const shelves = [[0.15, 0.4, 0], [0.15, 1.1, 0], [0.15, 1.8, 0]];
  return (
    <group position={[-4.3, 0, -3.5]}>
      {/* Shelf body - dark walnut */}
      <mesh position={[0, 1.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, 2.2, 1.0]} />
        <meshStandardMaterial color="#3e2723" roughness={0.45} metalness={0.08} />
      </mesh>
      {/* Shelf boards */}
      {shelves.map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} receiveShadow castShadow>
          <boxGeometry args={[0.02, 0.025, 0.95]} />
          <meshStandardMaterial color="#2c1a12" roughness={0.5} metalness={0.08} />
        </mesh>
      ))}
      {/* Books - various colors and sizes */}
      <mesh position={[0.12, 0.55, -0.3]} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.25, 0.15]} />
        <meshStandardMaterial color="#dc2626" roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[0.12, 0.55, -0.15]} receiveShadow castShadow>
        <boxGeometry args={[0.04, 0.28, 0.12]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[0.12, 0.55, 0.0]} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.3, 0.2]} />
        <meshStandardMaterial color="#2563eb" roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[0.12, 0.55, 0.2]} receiveShadow castShadow>
        <boxGeometry args={[0.04, 0.22, 0.14]} />
        <meshStandardMaterial color="#0891b2" roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[0.12, 0.55, 0.3]} receiveShadow castShadow>
        <boxGeometry args={[0.05, 0.22, 0.18]} />
        <meshStandardMaterial color="#16a34a" roughness={0.75} metalness={0.0} />
      </mesh>
      {/* Trophy - gold metallic */}
      <mesh position={[0.12, 1.3, 0.2]} receiveShadow castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.12, 12]} />
        <meshStandardMaterial color="#FFD700" metalness={0.92} roughness={0.08} />
      </mesh>
      {/* Trophy cup */}
      <mesh position={[0.12, 1.38, 0.2]} receiveShadow castShadow>
        <cylinderGeometry args={[0.035, 0.02, 0.06, 12]} />
        <meshStandardMaterial color="#FFD700" metalness={0.92} roughness={0.08} />
      </mesh>
      {/* Trophy base */}
      <mesh position={[0.12, 1.22, 0.2]} receiveShadow castShadow>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Plant pot - terracotta */}
      <mesh position={[0.12, 1.95, -0.2]} receiveShadow castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.06, 12]} />
        <meshStandardMaterial color="#a0522d" roughness={0.85} metalness={0.0} />
      </mesh>
      {/* Plant soil */}
      <mesh position={[0.12, 1.98, -0.2]} receiveShadow>
        <circleGeometry args={[0.035, 12]} />
        <meshStandardMaterial color="#3e2723" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Plant leaves - multiple spheres for realism */}
      <mesh position={[0.12, 2.05, -0.2]} receiveShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#228B22" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[0.14, 2.08, -0.18]} receiveShadow>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#2d8f2d" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[0.1, 2.07, -0.22]} receiveShadow>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#1a7a1a" roughness={0.85} metalness={0.0} />
      </mesh>
      <mesh position={[0.13, 2.1, -0.2]} receiveShadow>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#32cd32" roughness={0.85} metalness={0.0} />
      </mesh>
    </group>
  );
}

// ─── CEILING LAMP ──────────────────────────────────────────────
function CeilingLamp() {
  return (
    <group position={[0, 4.6, -1]}>
      {/* Lamp shade - frosted glass */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial
          color="#FFE4B5"
          emissive="#FFE4B5"
          emissiveIntensity={0.6}
          transparent
          opacity={0.82}
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>
      {/* Lamp inner glow */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.2} transparent opacity={0.4} />
      </mesh>
      {/* Lamp cord - braided fabric */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.35, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Lamp ceiling mount */}
      <mesh position={[0, 0.38, 0]} receiveShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light bulb - warm glow */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color="#fff8e7"
          emissive="#FFE4B5"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>
      {/* Bulb filament detail */}
      <mesh>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2.0} />
      </mesh>
    </group>
  );
}

// ─── FIRST-PERSON CONTROLLER ───────────────────────────────────
function FirstPersonController({ viewMode, cameraResetTrigger }: { viewMode: ViewMode; cameraResetTrigger: number }) {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isLocked = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  const MOVE_SPEED = 2.5;
  const SPRINT_MULTIPLIER = 1.8;
  const LOOK_SPEED = 0.002;
  const MIN_Y = 0.5;
  const MAX_Y = 1.6;

  const BOUNDS = { minX: -4.5, maxX: 4.5, minZ: -4, maxZ: 3.5 };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'office') return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': moveState.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': moveState.current.left = true; break;
        case 'KeyD': case 'ArrowRight': moveState.current.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': moveState.current.sprint = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': moveState.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': moveState.current.left = false; break;
        case 'KeyD': case 'ArrowRight': moveState.current.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': moveState.current.sprint = false; break;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current || viewMode !== 'office') return;
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= e.movementX * LOOK_SPEED;
      euler.current.x -= e.movementY * LOOK_SPEED;
      euler.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onClick = () => {
      if (viewMode === 'office' && !isLocked.current) {
        gl.domElement.requestPointerLock();
      }
    };
    gl.domElement.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      gl.domElement.removeEventListener('click', onClick);
    };
  }, [camera, gl, viewMode]);

  useEffect(() => {
    if (viewMode === 'office') {
      camera.position.set(0, 1.6, 2);
      camera.rotation.set(0, Math.PI, 0);
    }
  }, [viewMode, camera]);

  useEffect(() => {
    if (cameraResetTrigger > 0 && viewMode === 'office') {
      camera.position.set(0, 1.6, 2);
      camera.rotation.set(0, Math.PI, 0);
    }
  }, [cameraResetTrigger, viewMode, camera]);

  useFrame((_, delta) => {
    if (viewMode !== 'office') return;

    const speed = moveState.current.sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
    direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
    direction.current.normalize();

    if (moveState.current.forward || moveState.current.backward || moveState.current.left || moveState.current.right) {
      const right = new THREE.Vector3();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      velocity.current.copy(forward).multiplyScalar(direction.current.z * speed * delta);
      velocity.current.add(right.multiplyScalar(direction.current.x * speed * delta));

      const newPos = camera.position.clone().add(velocity.current);
      newPos.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, newPos.x));
      newPos.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, newPos.z));
      newPos.y = MAX_Y;

      camera.position.copy(newPos);
    }
  });

  return null;
}

// ─── SCENE ─────────────────────────────────────────────────────
function OfficeScene({ onMonitorClick, hovered, setHovered }: { onMonitorClick: () => void; hovered: boolean; setHovered: (b: boolean) => void }) {
  return (
    <group>
      <RoomGroup />
      <DeskGroup />
      <MonitorGroup onClick={onMonitorClick} hovered={hovered} />
      <ChairGroup />
      <ShelfGroup />
      <CeilingLamp />
      <DustParticles />
    </group>
  );
}

// ─── UI COMPONENTS ────────────────────────────────────────────
function TaskCard({ task, onClick, colors }: { task: SimTask; onClick: () => void; colors: any }) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 hover:translate-x-1 cursor-pointer group"
      style={{
        borderColor: colors.border,
        background: colors.cardBg,
        boxShadow: `3px 3px 0px 0px ${colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold leading-tight" style={{ color: colors.text }}>{task.title}</span>
        <span className="text-[12px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2" style={{
          background: colors.primary, color: '#1B2632',
        }}>{task.estimatedMinutes}m</span>
      </div>
      <p className="text-[13px] leading-relaxed mb-2" style={{ color: colors.textMuted }}>{task.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded" style={{
          background: colors.bg, color: colors.textMuted,
        }}>{task.taskType.replace(/_/g, ' ')}</span>
        <span className="text-[12px] font-mono" style={{ color: colors.secondary }}>
          {'★'.repeat(task.difficulty)}<span style={{ opacity: 0.3 }}>{'★'.repeat(5 - task.difficulty)}</span>
        </span>
      </div>
    </button>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
interface SimProps { theme: Theme; }

export default function SimuladorLaboral({ theme }: SimProps) {
  const colors = themeColors[theme];
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('office');
  const [jobs, setJobs] = useState<SimJob[]>([]);
  const [tasks, setTasks] = useState<SimTask[]>([]);
  const [selectedJob, setSelectedJob] = useState<SimJob | null>(null);
  const [selectedTask, setSelectedTask] = useState<SimTask | null>(null);
  const [docHtml, setDocHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitorHovered, setMonitorHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [firstVisit] = useState(() => !localStorage.getItem('sim_visited'));
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);

  const { notifications, toast, inboxOpen, setInboxOpen, unreadCount, addNotification, markAllRead, checkEvents } = useNotifications();
  const { addToast } = useToast();

  // Poll for events every 90s when in workspace mode
  useEffect(() => {
    if (viewMode !== 'workspace' && viewMode !== 'document') return;
    const interval = setInterval(checkEvents, 90000);
    checkEvents();
    return () => clearInterval(interval);
  }, [viewMode]);

  useEffect(() => {
    checkOnboarding();
    fetchJobs();
    loadStats();
  }, []);

  async function checkOnboarding() {
    try {
      const profile = await apiFetch<any>('/api/sim/my-profile');
      if (!profile.onboardingCompleted) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
        if (profile.assignedJob) setSelectedJob(profile.assignedJob);
      }
    } catch (e) {
      console.error(e);
      setNeedsOnboarding(true);
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  async function fetchJobs() {
    try {
      setApiError(null);
      // Usar TaskPlanner para obtener tareas del mes actual
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const week = Math.ceil(now.getDate() / 7) || 1;
      const day = now.getDay() || 1; // 1=Lun

      let todayTasks: any[] = [];
      try {
        todayTasks = await apiGet(`/api/sim/today-tasks/${month}/${year}/${week}/${day}`);
      } catch (e) {
        console.warn('TaskPlanner no disponible, usando tareas por defecto');
        // Fallback: crear tareas de ejemplo si el TaskPlanner falla
        todayTasks = [
          { id: 'task-1', title: 'Factura a Comercial del Norte', type: 'invoice_emission', difficulty: 1, time: 10, category: 'facturacion', description: 'Emitir factura CFDI', priority: 'alta' },
          { id: 'task-2', title: 'Pago de Transportes Rápidos', type: 'payment_registration', difficulty: 1, time: 8, category: 'cobranza', description: 'Registrar pago', priority: 'media' },
          { id: 'task-3', title: 'CFDI de Papelería del Norte', type: 'supplier_invoice', difficulty: 1, time: 8, category: 'compras', description: 'Registrar factura proveedor', priority: 'media' },
        ];
      }

      // Convertir tareas del plan al formato esperado por DesktopShell
      const formattedTasks: SimTask[] = (todayTasks || []).map((t: any) => ({
        id: t.id,
        jobId: `job-${t.category || 'general'}`,
        title: t.title,
        description: t.description || '',
        taskType: t.type,
        difficulty: t.difficulty,
        estimatedMinutes: t.time || 10,
        sequenceOrder: 0,
      }));

      // Crear "jobs" virtuales basados en categorías del plan
      const categories = [...new Set(formattedTasks.map((t: any) => t.category || 'general').filter(Boolean))] as string[];
      const virtualJobs = categories.map((cat: string) => ({
        id: `job-${cat}`,
        title: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
        description: `Tareas de ${cat}`,
        difficulty: 1,
        category: cat,
      }));

      setJobs(virtualJobs.length > 0 ? virtualJobs : [{ id: 'job-general', title: 'Auxiliar Contable', description: 'Tareas generales', difficulty: 1, category: 'general' }]);
      setTasks(formattedTasks);
    } catch (e: any) {
      setApiError('No se puede conectar con el backend. Verifica que VITE_API_URL esté configurado.');
      console.error(e);
      addToast('Error al cargar tareas del servidor', 'error');
    }
  }

  async function loadStats() {
    try { const data = await apiGet('/api/sim/my-stats'); setUserStats(data); }
    catch (e) { console.error(e); addToast('Error al cargar estadísticas', 'warning'); }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const data = await apiFetch<any>(`/api/sim/tasks/${taskId}/complete`, { method: 'POST' });
      setEvalResult(data);
      loadStats();

      // Progression milestone notification
      if (data.progression && data.progression.milestone) {
        addNotification({
          id: `prog-${Date.now()}`,
          from: 'Sistema',
          subject: data.progression.leveledUp ? '🎉 ¡Promoción!' : '📈 Progreso',
          body: data.progression.milestone,
          time: new Date().toISOString(),
          read: false,
          type: 'milestone',
        });
      }
    } catch (e) { console.error(e); }
  }

  async function selectJob(job: SimJob) {
    setSelectedJob(job); setLoading(true);
    try {
      // Usar tareas ya cargadas del TaskPlanner, filtradas por categoría
      const filteredTasks = tasks.filter((t: any) => t.category === job.category);
      if (filteredTasks.length > 0) {
        setTasks(filteredTasks);
      }
      setViewMode('workspace');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openDocument(task: SimTask) {
    setSelectedTask(task); setLoading(true);
    try {
      const docType =
        task.taskType === 'bank_reconciliation' ? 'bank_statement' :
        task.taskType === 'ap_reconciliation' ? 'trial_balance' :
        task.taskType === 'payment_registration' || task.taskType === 'payment_scheduling' ? 'payment_receipt' :
        task.taskType === 'tax_calculation' ? 'invoice' :
        task.taskType === 'payroll' ? 'payroll' :
        task.taskType === 'journal_entry' ? 'trial_balance' :
        'invoice';
      const html = await apiGetHtml(`/api/sim/documents/${docType}?format=html`);
      setDocHtml(html); setViewMode('document');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleMonitorClick() {
    if (apiError) {
      addNotification({ id: `err-${Date.now()}`, from: 'Sistema', subject: '⚠️ Error de conexión', body: apiError, time: new Date().toISOString(), read: false, type: 'alert' });
      return;
    }
    if (viewMode === 'office' && jobs.length > 0) {
      // Welcome notification on first entry
      const welcomeShown = localStorage.getItem('sim_welcome_shown');
      if (!welcomeShown) {
        addNotification({
          id: `welcome-${Date.now()}`,
          from: 'Sistema',
          subject: '🏢 ¡Bienvenido al Simulador Laboral!',
          body: `Has sido asignado como ${jobs[0]?.title || 'Auxiliar Contable'}. Revisa tu bandeja de entrada para comenzar.`,
          time: new Date().toISOString(),
          read: false,
          type: 'milestone',
        });
        localStorage.setItem('sim_welcome_shown', 'true');
      }
      selectJob(jobs[0]);
    }
  }

  function goBack() {
    if (viewMode === 'document') setViewMode('workspace');
    else if (viewMode === 'workspace') {
      setSelectedJob(null);
      setTasks([]);
      setSelectedTask(null);
      setViewMode('office');
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }

  const isDark = theme === 'dark';

  if (needsOnboarding === null) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center rounded-2xl border-2" style={{ borderColor: colors.border, background: colors.bg }}>
        <div className="w-10 h-10 rounded-full border-3 animate-spin" style={{ borderColor: colors.primary, borderTopColor: 'transparent', borderWidth: 3 }} />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding theme={theme} onComplete={() => {
      setNeedsOnboarding(false);
      fetchJobs();
    }} />;
  }

  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-120px)] relative overflow-hidden rounded-2xl border-2" style={{ borderColor: colors.border, background: isDark ? '#0a1628' : '#E2DCD0', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.15)' }}>
      {/* Top bar - SOLO en modo oficina 3D */}
      {viewMode === 'office' && (
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
          <div className="flex items-center gap-2.5 backdrop-blur-xl px-3 py-1.5 rounded-xl border-2 pointer-events-auto" style={{
            borderColor: colors.border,
            background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)',
          }}>
            <div>
              <p className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>🏢 OFICINA VIRTUAL</p>
              {selectedJob && (
                <p className="text-[13px] font-mono uppercase tracking-wider" style={{ color: colors.primary }}>
                  {selectedJob.title}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={() => setInboxOpen(true)}
                className="relative px-3 py-1.5 rounded-xl border-2 cursor-pointer text-[13px] font-mono font-bold backdrop-blur-md transition hover:scale-105"
                style={{ borderColor: colors.border, color: colors.text, background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)' }}>
                📬 {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: colors.primary, color: '#1B2632' }}>{unreadCount}</span>
                )}
              </button>
              <button onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-xl border-2 cursor-pointer text-[13px] font-mono font-bold backdrop-blur-md transition hover:scale-105 pointer-events-auto"
                style={{ borderColor: colors.border, color: colors.text, background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)' }}>
                {isFullscreen ? '⛶ Salir' : '⛶ Pantalla completa'}
              </button>
              <button onClick={() => setCameraResetTrigger(t => t + 1)}
                className="px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer"
                style={{ borderColor: colors.border, color: colors.textMuted, background: 'transparent', border: `1px solid ${colors.border}` }}>
                🎯
              </button>
            </div>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 1.6, 2], fov: 60, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        shadows
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(isDark ? '#0a1628' : '#E2DCD0'))}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.25} color="#F0F0F0" />
          <directionalLight position={[5, 8, 3]} intensity={0.8} color="#FFF5E6" castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={20} shadow-camera-left={-5} shadow-camera-right={5}
            shadow-camera-top={5} shadow-camera-bottom={-5} />
          <directionalLight position={[-3, 4, 2]} intensity={0.3} color="#E6F0FF" />
          <directionalLight position={[0, 3, -5]} intensity={0.2} color="#FFFFFF" />

          <OfficeScene onMonitorClick={handleMonitorClick} hovered={monitorHovered} setHovered={setMonitorHovered} />
          <FirstPersonController viewMode={viewMode} cameraResetTrigger={cameraResetTrigger} />
        </Suspense>
      </Canvas>

      {/* Crosshair for first-person mode */}
      {viewMode === 'office' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 relative">
            <div className="absolute top-1/2 left-0 w-full h-px" style={{ background: 'rgba(255,255,255,0.5)' }} />
            <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>
      )}

      {/* First-person controls instruction */}
      {viewMode === 'office' && !localStorage.getItem('fp_controls_shown') && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
            <div className="text-[11px] font-bold mb-1">🎮 Controles</div>
            <div className="text-[9px]">WASD: Mover · Mouse: Mirar · Shift: Correr · Click: Interactuar</div>
          </div>
        </div>
      )}

      {/* DESKTOP SHELL — escritorio de trabajo */}
      {(viewMode === 'workspace' || viewMode === 'document') && (
        <div className="absolute inset-0 z-30">
          <DesktopShell
            theme={theme}
            tasks={tasks.map(t => ({ id: t.id, title: t.title, type: (t as any).taskType || (t as any).task_type, difficulty: t.difficulty, time: t.estimatedMinutes }))}
            onClose={() => {
              setViewMode('office');
              setTasks([]);
              loadStats();
            }}
            onTaskComplete={loadStats}
          />
        </div>
      )}

      {/* Dashboard modal */}
      {showDashboard && <Dashboard theme={theme} onBack={() => { setShowDashboard(false); loadStats(); }} />}

      {/* Stats HUD */}
      {userStats && (
        <div className="absolute bottom-3 left-3 z-30 flex gap-2">
          <div className="px-3 py-2 rounded-xl border-2 backdrop-blur-xl text-[12px] font-mono" style={{
            borderColor: colors.border, background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)',
          }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span style={{ color: colors.textMuted }}>SESIÓN ACTIVA</span>
              <span className="text-[13px] font-bold px-1.5 py-0.5 rounded" style={{ background: colors.primary, color: '#1B2632' }}>
                🎯 {userStats.level}
              </span>
            </div>
            <div className="flex items-center gap-3" style={{ color: colors.text }}>
              <span>✅ <strong>{userStats.tasksCompleted}</strong> tareas</span>
              <span>⭐ <strong>{userStats.totalScore} pts</strong></span>
              <span>⏱️ <strong>{userStats.totalTime} min</strong></span>
            </div>
            <button onClick={() => setShowDashboard(true)}
              className="mt-1.5 w-full text-[11px] font-bold py-1 rounded-lg border cursor-pointer hover:opacity-80 transition"
              style={{ borderColor: colors.primary, color: colors.primary, background: 'transparent' }}
            >📊 Ver dashboard</button>
            <div className="mt-1 pt-1 border-t text-center" style={{ borderColor: colors.border + '40', color: colors.textMuted }}>
              <span className="text-[13px] font-mono">v{VERSION} ({BUILD_HASH})</span>
            </div>
          </div>
        </div>
      )}
      {toast && <NotificationToast notif={toast} theme={theme} />}
      {inboxOpen && <NotificationInbox theme={theme} onClose={() => setInboxOpen(false)} notifications={notifications} markAllRead={markAllRead} unreadCount={unreadCount} />}
    </div>
  );
}
